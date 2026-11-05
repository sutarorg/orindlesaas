import { z } from "zod";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { appendWalletMovement, lockCreditWallet } from "@/lib/server/credits/ledger";
import { auditEvents } from "@/lib/server/db/schema";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";
const schema = z.object({ userId: z.uuid(), amountCredits: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0), reason: z.string().trim().min(10).max(500), idempotencyKey: z.string().min(12).max(128).regex(/^[A-Za-z0-9:_-]+$/) }).strict();

export const POST = apiHandler(async (request, { requestId }) => {
  assertSameOrigin(request);
  const admin = await requireAdmin("credits:adjust", { stepUp: true });
  await enforceRateLimit({ name: "admin-credit-adjust", identifier: requestIdentifier(request, admin.userId), limit: 10 });
  const input = await readJson(request, schema);
  const result = await getDb().transaction(async (tx) => {
    const before = await lockCreditWallet(tx, input.userId);
    const movement = await appendWalletMovement(tx, {
      userId: input.userId,
      kind: "admin_adjustment",
      availableDelta: input.amountCredits,
      reservedDelta: 0,
      actorId: admin.userId,
      referenceType: "admin_adjustment",
      referenceId: input.idempotencyKey,
      correlationId: requestId,
      idempotencyKey: input.idempotencyKey,
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
    return { adjustmentId: movement.entry.id, availableCredits: movement.duplicate ? movement.entry.availableAfterCredits : movement.wallet.availableCredits, duplicate: movement.duplicate };
  });
  return json(result, result.duplicate ? 200 : 201);
});
