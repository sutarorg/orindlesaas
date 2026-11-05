import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { VerifiedIdentity } from "@/lib/server/auth/guards";
import { appendWalletMovement, lockCreditWallet } from "@/lib/server/credits/ledger";
import { getDb } from "@/lib/server/db/client";
import { auditEvents, idempotencyRecords } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";

export const adminCreditAdjustmentSchema = z.object({
  userId: z.uuid(),
  amountCredits: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0),
  reason: z.string().trim().min(10).max(500),
  idempotencyKey: z.string().min(12).max(128).regex(/^[A-Za-z0-9:_-]+$/),
}).strict();

type AdjustmentInput = z.infer<typeof adminCreditAdjustmentSchema>;
const storedResultSchema = z.object({ adjustmentId: z.string().min(1), availableCredits: z.number().int().nonnegative() });

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => `${JSON.stringify(name)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export async function applyAdminCreditAdjustment(admin: VerifiedIdentity, input: AdjustmentInput, requestId: string) {
  const { idempotencyKey, ...operationInput } = input;
  const requestSha256 = createHash("sha256").update(stableJson(operationInput)).digest("hex");
  return getDb().transaction(async (tx) => {
    // This actor/operation/key claim is independent of the target wallet. The
    // wallet-ledger key remains a second line of defense, not the API scope.
    const [newRecord] = await tx.insert(idempotencyRecords).values({
      actorId: admin.userId,
      operation: "credits.adjust",
      key: idempotencyKey,
      requestSha256,
    }).onConflictDoNothing().returning({ id: idempotencyRecords.id });
    if (!newRecord) {
      const [existing] = await tx.select().from(idempotencyRecords).where(and(
        eq(idempotencyRecords.actorId, admin.userId),
        eq(idempotencyRecords.operation, "credits.adjust"),
        eq(idempotencyRecords.key, idempotencyKey),
      )).for("update").limit(1);
      if (!existing || existing.requestSha256 !== requestSha256) {
        throw new AppError("conflict", 409, "This request key was already used for a different credit adjustment.");
      }
      const previous = storedResultSchema.parse(existing.responseBody);
      return { ...previous, duplicate: true };
    }

    const before = await lockCreditWallet(tx, input.userId);
    const movement = await appendWalletMovement(tx, {
      userId: input.userId,
      kind: "admin_adjustment",
      availableDelta: input.amountCredits,
      reservedDelta: 0,
      actorId: admin.userId,
      referenceType: "admin_adjustment",
      referenceId: idempotencyKey,
      correlationId: requestId,
      idempotencyKey,
      description: `Admin adjustment: ${input.reason}`,
      metadata: { requestId },
    });
    if (!movement.duplicate) {
      await tx.insert(auditEvents).values({
        actorId: admin.userId,
        action: "credits.adjust",
        targetType: "wallet_ledger",
        targetId: movement.entry.id,
        reason: input.reason,
        requestId,
        before: { availableCredits: before.availableCredits, reservedCredits: before.reservedCredits, version: before.version },
        after: { availableCredits: movement.wallet.availableCredits, reservedCredits: movement.wallet.reservedCredits, version: movement.wallet.version, ledgerEntryId: movement.entry.id },
      });
    }
    const result = {
      adjustmentId: movement.entry.id,
      availableCredits: movement.duplicate ? movement.entry.availableAfterCredits : movement.wallet.availableCredits,
    };
    const parsedResult = storedResultSchema.parse(result);
    await tx.update(idempotencyRecords).set({
      responseStatus: movement.duplicate ? 200 : 201,
      responseBody: parsedResult,
      lockedUntil: null,
      updatedAt: new Date(),
    }).where(eq(idempotencyRecords.id, newRecord.id));
    return { ...parsedResult, duplicate: movement.duplicate };
  });
}
