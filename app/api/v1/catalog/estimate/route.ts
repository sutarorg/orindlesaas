import { z } from "zod";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { estimateCost, getPricedModel } from "@/lib/server/ai/models";
import { creditsForActualCost } from "@/lib/server/credits/arithmetic";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";
const estimateSchema = z.object({ kind: z.enum(["chat", "image", "video", "website"]), modelId: z.string().min(1).max(200), prompt: z.string().max(48_000), maxOutputTokens: z.number().int().min(64).max(5000).optional() }).strict();

export const POST = apiHandler(async (request) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  await enforceRateLimit({ name: "catalog-estimate", identifier: requestIdentifier(request, identity.userId), limit: 30 });
  const input = await readJson(request, estimateSchema);
  const model = await getPricedModel(input.modelId, input.kind);
  const estimatedCostUsd = estimateCost({ ...model, kind: input.kind, prompt: input.prompt, maxOutputTokens: input.maxOutputTokens });
  return json({ estimatedCostUsd, estimatedCredits: Number(creditsForActualCost(estimatedCostUsd)), actualBilledSeparately: true });
});
