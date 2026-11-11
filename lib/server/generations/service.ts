import { createHash } from "node:crypto";
import { and, count, eq, inArray, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { creditReservations, generationJobs, outboxEvents } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { resolveGenerationModel, type GenerationKind } from "@/lib/server/ai/models";
import { holdCredits, lockCreditWallet, settleReservation } from "@/lib/server/credits/ledger";
import { classifyGenerationId, lookupOpenRouterGenerationCost, type UsageEvidence } from "@/lib/server/ai/usage";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function generationRequestHash(request: unknown) {
  return createHash("sha256").update(stableJson(request)).digest("hex");
}

export async function createGeneration(input: {
  userId: string;
  kind: GenerationKind;
  modelId: string;
  prompt: string;
  request: Record<string, unknown>;
  idempotencyKey: string;
  correlationId: string;
  dispatch: boolean;
}) {
  const requestSha256 = generationRequestHash({ modelId: input.modelId, kind: input.kind, ...input.request });
  const [existingRow] = await getDb().select({ job: generationJobs, reservation: creditReservations }).from(generationJobs).leftJoin(creditReservations, eq(generationJobs.reservationId, creditReservations.id)).where(
    and(eq(generationJobs.userId, input.userId), eq(generationJobs.idempotencyKey, input.idempotencyKey)),
  ).limit(1);
  if (existingRow) {
    if (existingRow.job.requestSha256 !== requestSha256) throw new AppError("conflict", 409, "This generation request key was already used with different input.");
    return { job: existingRow.job, reservation: existingRow.reservation ?? undefined, duplicate: true };
  }
  const model = await resolveGenerationModel({ modelId: input.modelId, kind: input.kind, prompt: input.prompt, options: input.request });
  const estimatedCostUsd = model.estimatedCostUsd;
  const jobId = crypto.randomUUID();
  return getDb().transaction(async (tx) => {
    await lockCreditWallet(tx, input.userId);
    const [existing] = await tx.select().from(generationJobs).where(
      and(eq(generationJobs.userId, input.userId), eq(generationJobs.idempotencyKey, input.idempotencyKey)),
    ).limit(1);
    if (existing) {
      if (existing.requestSha256 !== requestSha256) {
        throw new AppError("conflict", 409, "This generation request key was already used with different input.");
      }
      const reservation = existing.reservationId
        ? (await tx.select().from(creditReservations).where(eq(creditReservations.id, existing.reservationId)).limit(1))[0]
        : undefined;
      return { job: existing, reservation, duplicate: true };
    }
    const [active] = await tx.select({ value: count() }).from(generationJobs).where(
      and(eq(generationJobs.userId, input.userId), inArray(generationJobs.status, ["queued", "running", "awaiting_provider"])),
    );
    if ((active?.value ?? 0) >= 3) {
      throw new AppError("rate_limited", 429, "You already have three active generations. Wait for one to finish.");
    }
    const [job] = await tx.insert(generationJobs).values({
      id: jobId,
      userId: input.userId,
      kind: input.kind,
      modelId: model.id,
      request: input.request,
      requestSha256,
      idempotencyKey: input.idempotencyKey,
    }).returning();
    if (!job) throw new Error("Generation insert returned no row.");
    const { reservation } = await holdCredits(tx, {
      userId: input.userId,
      jobId,
      estimatedCostUsd,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
    });
    await tx.update(generationJobs).set({ reservationId: reservation.id }).where(eq(generationJobs.id, jobId));
    if (input.dispatch) {
      await tx.insert(outboxEvents).values({
        eventKey: `generation:${jobId}`,
        eventName: "orindle/generation.requested",
        payload: { jobId, userId: input.userId },
      });
    }
    return { job: { ...job, reservationId: reservation.id }, reservation, duplicate: false };
  });
}

export async function markSubmissionAttempt(jobId: string, userId: string) {
  const [job] = await getDb().update(generationJobs).set({
    status: "running",
    submissionState: "attempted",
    submittedAt: new Date(),
    attempt: sql`${generationJobs.attempt} + 1`,
    updatedAt: new Date(),
  }).where(
    and(
      eq(generationJobs.id, jobId),
      eq(generationJobs.userId, userId),
      eq(generationJobs.submissionState, "not_submitted"),
      inArray(generationJobs.status, ["queued", "running"]),
    ),
  ).returning();
  if (job) return job;
  await markSubmissionUncertain(jobId, userId);
  return null;
}

export async function markSubmissionUncertain(jobId: string, userId: string, code = "submission_uncertain") {
  await getDb().update(generationJobs).set({
    status: "reconciliation_required",
    submissionState: "uncertain",
    errorCode: code,
    errorMessage: "A provider submission may have occurred. Automatic retry and hold release are blocked pending reconciliation.",
    updatedAt: new Date(),
  }).where(
    and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId), notInArray(generationJobs.status, ["succeeded", "cancelled"])),
  );
}

/**
 * Persists the provider's own references.
 *
 * OpenRouter generation IDs (`gen-`) and Gateway IDs (`gen_`) are written to separate columns. If a
 * value were stored in whichever column happened to be free, settlement would later have to guess
 * which provider to ask, and a Gateway ID sent to OpenRouter's lookup would simply 404.
 */
export async function recordProviderReference(input: {
  jobId: string;
  userId: string;
  generationId?: string | null;
  providerJobId?: string | null;
  providerOperation?: Record<string, unknown>;
  awaitingProvider?: boolean;
}) {
  const origin = input.generationId ? classifyGenerationId(input.generationId) : null;
  const [job] = await getDb().update(generationJobs).set({
    submissionState: "completed",
    // A generation ID we cannot classify is not silently written into a provider column.
    providerGenerationId: origin === "openrouter" ? input.generationId ?? null : null,
    gatewayGenerationId: origin === "legacy_gateway" ? input.generationId ?? null : null,
    providerJobId: input.providerJobId ?? null,
    provider: "openrouter",
    providerOperation: input.providerOperation,
    status: input.awaitingProvider ? "awaiting_provider" : "running",
    updatedAt: new Date(),
  }).where(
    and(eq(generationJobs.id, input.jobId), eq(generationJobs.userId, input.userId), eq(generationJobs.submissionState, "attempted")),
  ).returning();
  if (!job) throw new AppError("conflict", 409, "The generation submission state changed unexpectedly.");
  return job;
}


/**
 * Looks up the authoritative cost, tolerating OpenRouter's short propagation delay.
 *
 * The documentation does not promise that the usage record exists the instant a stream ends, and a
 * video job only reports its generation ID at completion. Treating "not yet available" as failure
 * would push ordinary traffic into reconciliation, while treating it as success would invent a
 * cost. The middle ground is a short bounded retry; after that the job genuinely needs a human.
 */
async function lookupCostWithGrace(generationId: string, attempts = 3): Promise<UsageEvidence> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await lookupOpenRouterGenerationCost(generationId);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 1_500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function settleGeneration(input: {
  jobId: string;
  userId: string;
  result?: Record<string, unknown>;
  status?: "succeeded" | "failed";
}) {
  const [job] = await getDb().select().from(generationJobs).where(
    and(eq(generationJobs.id, input.jobId), eq(generationJobs.userId, input.userId)),
  ).limit(1);
  if (!job) throw new AppError("not_found", 404, "The generation was not found.");
  const generationReference = job.providerGenerationId ?? job.gatewayGenerationId;
  if (!generationReference || !job.reservationId) {
    await markSubmissionUncertain(job.id, job.userId, "actual_cost_unavailable");
    return { status: "reconciliation_required" as const };
  }
  // Preserve completed post-processing output before an external metering lookup. Recovery may
  // settle only this evidence; an AI call with incomplete asset/source processing stays manual.
  if (input.result !== undefined) {
    await getDb().update(generationJobs).set({ result: input.result, updatedAt: new Date() }).where(and(eq(generationJobs.id, job.id), eq(generationJobs.userId, input.userId)));
  }
  let actual;
  try {
    actual = await lookupCostWithGrace(generationReference);
  } catch {
    // Deliberately not settled on a lookup failure: an unknown cost is not a zero cost, and
    // charging the reservation would guess. The reservation stays held for reconciliation.
    await markSubmissionUncertain(job.id, job.userId, "actual_cost_unavailable");
    return { status: "reconciliation_required" as const };
  }
  return getDb().transaction(async (tx) => {
    const settlement = await settleReservation(tx, {
      reservationId: job.reservationId!,
      actualCostUsd: actual.actualCostUsd,
      // The historical column is only populated for genuinely historical Gateway references;
      // writing an OpenRouter ID there would blur two different ID spaces.
      gatewayGenerationId: job.gatewayGenerationId ?? undefined,
      providerGenerationId: job.providerGenerationId ?? undefined,
      provider: actual.provider,
      providerEndpoint: actual.providerEndpoint,
      costSource: actual.costSource,
      usageEvidence: actual,
      usage: actual.usage,
      correlationId: job.id,
    });
    const intendedStatus = input.status ?? ((job.result as Record<string, unknown> | null)?.providerFailure === true ? "failed" : "succeeded");
    const finalStatus = settlement.status === "settled" ? intendedStatus : "reconciliation_required";
    await tx.update(generationJobs).set({
      status: finalStatus,
      result: input.result,
      errorCode: finalStatus === "reconciliation_required" ? "insufficient_settlement_balance" : null,
      errorMessage: finalStatus === "reconciliation_required" ? "Actual usage exceeds the available balance and requires reconciliation." : null,
      completedAt: finalStatus === "reconciliation_required" ? null : new Date(),
      updatedAt: new Date(),
    }).where(eq(generationJobs.id, job.id));
    return { status: finalStatus, actualCredits: settlement.actualCredits, actualCostUsd: actual.actualCostUsd };
  });
}

export async function getOwnedGeneration(userId: string, jobId: string) {
  const [job] = await getDb().select({
    id: generationJobs.id,
    kind: generationJobs.kind,
    modelId: generationJobs.modelId,
    status: generationJobs.status,
    result: generationJobs.result,
    errorCode: generationJobs.errorCode,
    createdAt: generationJobs.createdAt,
    updatedAt: generationJobs.updatedAt,
    completedAt: generationJobs.completedAt,
    estimatedCredits: creditReservations.estimatedCredits,
    actualCredits: creditReservations.actualCredits,
  }).from(generationJobs).leftJoin(creditReservations, eq(generationJobs.reservationId, creditReservations.id)).where(
    and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId)),
  ).limit(1);
  if (!job) throw new AppError("not_found", 404, "The generation was not found.");
  return job;
}
