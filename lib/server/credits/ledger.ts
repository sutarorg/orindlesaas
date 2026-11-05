import { and, eq, inArray } from "drizzle-orm";
import { AppError } from "@/lib/server/errors";
import type { DbTransaction } from "@/lib/server/db/types";
import { creditReservations, usageEvents, walletLedger, wallets } from "@/lib/server/db/schema";
import {
  creditsForActualCost,
  formatUsdNanodollars,
  nanodollarsToSafeNumber,
  parseUsdNanodollars,
} from "@/lib/server/credits/arithmetic";

type LedgerKind = typeof walletLedger.$inferInsert.kind;

type Movement = {
  userId: string;
  kind: LedgerKind;
  availableDelta: number;
  reservedDelta: number;
  purchasedDelta?: number;
  usedDelta?: number;
  actorId?: string;
  referenceType: string;
  referenceId: string;
  correlationId: string;
  idempotencyKey: string;
  description: string;
  metadata?: Record<string, unknown>;
};

function safeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${label} exceeds the safe integer range.`);
  return value;
}

export async function lockCreditWallet(tx: DbTransaction, userId: string) {
  await tx.insert(wallets).values({ userId }).onConflictDoNothing();
  const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId)).for("update").limit(1);
  if (!wallet) throw new AppError("not_found", 404, "The credit wallet was not found.");
  return wallet;
}

export async function appendWalletMovement(tx: DbTransaction, movement: Movement) {
  safeInteger(movement.availableDelta, "Available delta");
  safeInteger(movement.reservedDelta, "Reserved delta");
  const wallet = await lockCreditWallet(tx, movement.userId);
  const [existing] = await tx
    .select()
    .from(walletLedger)
    .where(
      and(
        eq(walletLedger.userId, movement.userId),
        eq(walletLedger.kind, movement.kind),
        eq(walletLedger.idempotencyKey, movement.idempotencyKey),
      ),
    )
    .limit(1);

  if (existing) {
    if (
      existing.availableDeltaCredits !== movement.availableDelta ||
      existing.reservedDeltaCredits !== movement.reservedDelta ||
      existing.referenceType !== movement.referenceType ||
      existing.referenceId !== movement.referenceId ||
      existing.description !== movement.description
    ) {
      throw new AppError("conflict", 409, "The idempotency key was already used for a different operation.");
    }
    return { wallet, entry: existing, duplicate: true };
  }

  const available = safeInteger(wallet.availableCredits + movement.availableDelta, "Available balance");
  const reserved = safeInteger(wallet.reservedCredits + movement.reservedDelta, "Reserved balance");
  const purchased = safeInteger(wallet.lifetimePurchasedCredits + (movement.purchasedDelta ?? 0), "Purchased total");
  const used = safeInteger(wallet.lifetimeUsedCredits + (movement.usedDelta ?? 0), "Used total");
  if (available < 0 || reserved < 0) {
    throw new AppError("insufficient_credits", 409, "There are not enough available credits for this operation.");
  }

  const [updatedWallet] = await tx
    .update(wallets)
    .set({
      availableCredits: available,
      reservedCredits: reserved,
      lifetimePurchasedCredits: purchased,
      lifetimeUsedCredits: used,
      version: wallet.version + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(wallets.userId, movement.userId), eq(wallets.version, wallet.version)))
    .returning();
  if (!updatedWallet) throw new AppError("conflict", 409, "The wallet changed. Retry with the same request key.");

  const [entry] = await tx
    .insert(walletLedger)
    .values({
      userId: movement.userId,
      kind: movement.kind,
      availableDeltaCredits: movement.availableDelta,
      reservedDeltaCredits: movement.reservedDelta,
      availableAfterCredits: available,
      reservedAfterCredits: reserved,
      actorId: movement.actorId,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      correlationId: movement.correlationId,
      idempotencyKey: movement.idempotencyKey,
      description: movement.description,
      metadata: movement.metadata ?? {},
    })
    .returning();
  if (!entry) throw new Error("Ledger insert returned no row.");
  return { wallet: updatedWallet, entry, duplicate: false };
}

export async function grantPurchasedCredits(
  tx: DbTransaction,
  input: { userId: string; purchaseId: string; credits: number; correlationId: string },
) {
  return appendWalletMovement(tx, {
    userId: input.userId,
    kind: "purchase",
    availableDelta: input.credits,
    reservedDelta: 0,
    purchasedDelta: input.credits,
    referenceType: "purchase",
    referenceId: input.purchaseId,
    correlationId: input.correlationId,
    idempotencyKey: `purchase:${input.purchaseId}`,
    description: "One-time credit pack purchase",
  });
}

export async function holdCredits(
  tx: DbTransaction,
  input: {
    userId: string;
    jobId?: string;
    estimatedCostUsd: string;
    idempotencyKey: string;
    correlationId: string;
  },
) {
  const estimatedCredits = nanodollarsToSafeNumber(creditsForActualCost(input.estimatedCostUsd));
  const [existing] = await tx
    .select()
    .from(creditReservations)
    .where(and(eq(creditReservations.userId, input.userId), eq(creditReservations.idempotencyKey, input.idempotencyKey)))
    .limit(1);
  if (existing) {
    if (existing.estimatedCredits !== estimatedCredits || (existing.jobId && existing.jobId !== input.jobId)) {
      throw new AppError("conflict", 409, "The generation request key was already used with different input.");
    }
    return { reservation: existing, duplicate: true };
  }

  const reservationId = crypto.randomUUID();
  if (estimatedCredits > 0) {
    await appendWalletMovement(tx, {
      userId: input.userId,
      kind: "reservation_hold",
      availableDelta: -estimatedCredits,
      reservedDelta: estimatedCredits,
      referenceType: "credit_reservation",
      referenceId: reservationId,
      correlationId: input.correlationId,
      idempotencyKey: `hold:${reservationId}`,
      description: "Estimated generation credit hold",
    });
  } else {
    await lockCreditWallet(tx, input.userId);
  }
  const [reservation] = await tx
    .insert(creditReservations)
    .values({
      id: reservationId,
      userId: input.userId,
      jobId: input.jobId,
      estimatedCostUsd: formatUsdNanodollars(parseUsdNanodollars(input.estimatedCostUsd)),
      estimatedCredits,
      idempotencyKey: input.idempotencyKey,
    })
    .returning();
  if (!reservation) throw new Error("Reservation insert returned no row.");
  return { reservation, duplicate: false };
}

export async function releaseReservation(tx: DbTransaction, reservationId: string, correlationId: string) {
  const [reservation] = await tx
    .select()
    .from(creditReservations)
    .where(eq(creditReservations.id, reservationId))
    .for("update")
    .limit(1);
  if (!reservation) throw new AppError("not_found", 404, "The credit reservation was not found.");
  if (reservation.status === "released") return { reservation, duplicate: true };
  if (reservation.status !== "held") {
    throw new AppError("conflict", 409, "Only a held reservation can be released.");
  }
  if (reservation.estimatedCredits > 0) {
    await appendWalletMovement(tx, {
      userId: reservation.userId,
      kind: "reservation_release",
      availableDelta: reservation.estimatedCredits,
      reservedDelta: -reservation.estimatedCredits,
      referenceType: "credit_reservation",
      referenceId: reservation.id,
      correlationId,
      idempotencyKey: `release:${reservation.id}`,
      description: "Released generation credit hold",
    });
  }
  const [updated] = await tx
    .update(creditReservations)
    .set({ status: "released", updatedAt: new Date(), settledAt: new Date() })
    .where(and(eq(creditReservations.id, reservation.id), eq(creditReservations.status, "held")))
    .returning();
  if (!updated) throw new AppError("conflict", 409, "The reservation changed before it could be released.");
  return { reservation: updated, duplicate: false };
}

async function recordUsageEvidence(
  tx: DbTransaction,
  reservation: typeof creditReservations.$inferSelect,
  input: { actualCostUsd: string; gatewayGenerationId?: string; usage?: Record<string, number> },
  status: "required" | "settled",
  chargedCredits: number | null,
) {
  if (!reservation.jobId) return;
  const values = {
    userId: reservation.userId,
    generationJobId: reservation.jobId,
    gatewayGenerationId: input.gatewayGenerationId,
    usage: input.usage ?? {},
    source: "gateway_actual" as const,
    actualCostUsd: input.actualCostUsd,
    chargedCredits,
    reconciliationStatus: status,
  };
  const [existing] = await tx.select().from(usageEvents).where(eq(usageEvents.generationJobId, reservation.jobId)).for("update").limit(1);
  if (!existing) {
    await tx.insert(usageEvents).values(values);
    return;
  }
  if (
    existing.userId !== reservation.userId ||
    !existing.actualCostUsd ||
    parseUsdNanodollars(existing.actualCostUsd) !== parseUsdNanodollars(input.actualCostUsd) ||
    (input.gatewayGenerationId && existing.gatewayGenerationId !== input.gatewayGenerationId) ||
    (existing.reconciliationStatus === "settled" && status !== "settled")
  ) {
    throw new AppError("conflict", 409, "Stored metering evidence does not match this settlement.");
  }
  if (existing.reconciliationStatus !== status || existing.chargedCredits !== chargedCredits) {
    await tx.update(usageEvents).set({ ...values, updatedAt: new Date() }).where(eq(usageEvents.id, existing.id));
  }
}

export async function settleReservation(
  tx: DbTransaction,
  input: {
    reservationId: string;
    actualCostUsd: string;
    gatewayGenerationId?: string;
    usage?: Record<string, number>;
    correlationId: string;
  },
) {
  const actualNanodollars = parseUsdNanodollars(input.actualCostUsd);
  const actualCredits = nanodollarsToSafeNumber(creditsForActualCost(actualNanodollars));
  const [reservation] = await tx
    .select()
    .from(creditReservations)
    .where(eq(creditReservations.id, input.reservationId))
    .for("update")
    .limit(1);
  if (!reservation) throw new AppError("not_found", 404, "The credit reservation was not found.");
  if (reservation.status === "settled" || reservation.status === "reconciliation_required") {
    if (
      reservation.actualCredits !== actualCredits ||
      !reservation.actualCostUsd ||
      parseUsdNanodollars(reservation.actualCostUsd) !== actualNanodollars
    ) {
      throw new AppError("conflict", 409, "The reservation already has different actual-cost evidence.");
    }
    if (reservation.status === "settled") return { status: "settled" as const, reservation, actualCredits, duplicate: true };
  }
  if (reservation.status !== "held" && reservation.status !== "reconciliation_required") {
    throw new AppError("conflict", 409, "Only a held or reconciliation reservation can be settled.");
  }

  const wallet = await lockCreditWallet(tx, reservation.userId);
  if (wallet.availableCredits + reservation.estimatedCredits < actualCredits) {
    const [review] = await tx
      .update(creditReservations)
      .set({
        actualCostUsd: formatUsdNanodollars(actualNanodollars),
        actualCredits,
        status: "reconciliation_required",
        updatedAt: new Date(),
      })
      .where(eq(creditReservations.id, reservation.id))
      .returning();
    await recordUsageEvidence(tx, reservation, { ...input, actualCostUsd: formatUsdNanodollars(actualNanodollars) }, "required", null);
    return { status: "reconciliation_required" as const, reservation: review, actualCredits, duplicate: false };
  }

  await appendWalletMovement(tx, {
    userId: reservation.userId,
    kind: "usage_settlement",
    availableDelta: reservation.estimatedCredits - actualCredits,
    reservedDelta: -reservation.estimatedCredits,
    usedDelta: actualCredits,
    referenceType: "credit_reservation",
    referenceId: reservation.id,
    correlationId: input.correlationId,
    idempotencyKey: `settle:${reservation.id}`,
    description: "Actual metered AI usage settlement",
  });
  const [updated] = await tx
    .update(creditReservations)
    .set({
      actualCostUsd: formatUsdNanodollars(actualNanodollars),
      actualCredits,
      status: "settled",
      settledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(creditReservations.id, reservation.id), inArray(creditReservations.status, ["held", "reconciliation_required"])))
    .returning();
  if (!updated) throw new AppError("conflict", 409, "The reservation changed before settlement.");
  await recordUsageEvidence(tx, reservation, { ...input, actualCostUsd: formatUsdNanodollars(actualNanodollars) }, "settled", actualCredits);
  return { status: "settled" as const, reservation: updated, actualCredits, duplicate: false };
}
