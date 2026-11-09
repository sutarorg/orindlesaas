import { after } from "next/server";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { mediaGenerationSchema } from "@/lib/server/generations/schemas";
import { createGeneration } from "@/lib/server/generations/service";
import { dispatchOutboxEvent } from "@/lib/server/jobs/outbox";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";

export const POST = apiHandler(async (request, { requestId }) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  await enforceRateLimit({ name: "generation-create", identifier: requestIdentifier(request, identity.userId), limit: 10 });
  const input = await readJson(request, mediaGenerationSchema);
  const { kind, modelId, prompt, idempotencyKey, ...options } = input;
  const created = await createGeneration({
    userId: identity.userId,
    kind,
    modelId,
    prompt,
    request: { prompt, ...options },
    idempotencyKey,
    correlationId: requestId,
    dispatch: true,
  });
  if (!created.duplicate) after(() => dispatchOutboxEvent(`generation:${created.job.id}`, { inline: true }));
  return json({
    id: created.job.id,
    status: created.job.status,
    estimatedCredits: created.reservation?.estimatedCredits,
    duplicate: created.duplicate,
  }, created.duplicate ? 200 : 202);
});
