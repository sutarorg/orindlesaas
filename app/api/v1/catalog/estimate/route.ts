import { z } from "zod";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { resolveGenerationModel } from "@/lib/server/ai/models";
import { creditsForActualCost } from "@/lib/server/credits/arithmetic";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";
const estimateSchema = z.object({
  kind: z.enum(["chat", "image", "video", "website"]),
  modelId: z.string().min(1).max(200),
  prompt: z.string().max(48_000),
  maxOutputTokens: z.number().int().min(64).max(5000).optional(),
  size: z.string().regex(/^\d{2,5}x\d{2,5}$/).optional(),
  aspectRatio: z.string().regex(/^\d{1,3}:\d{1,3}$/).optional(),
  seed: z.number().int().nonnegative().max(2_147_483_647).optional(),
  duration: z.number().int().min(1).max(30).optional(),
  resolution: z.string().regex(/^\d{2,5}x\d{2,5}$/).optional(),
  generateAudio: z.boolean().optional(),
  name: z.string().trim().min(2).max(80).optional(),
}).strict();

export const POST = apiHandler(async (request) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  await enforceRateLimit({ name: "catalog-estimate", identifier: requestIdentifier(request, identity.userId), limit: 30 });
  const input = await readJson(request, estimateSchema);
  const { kind, modelId, prompt, ...options } = input;
  const model = await resolveGenerationModel({ modelId, kind, prompt, options });
  return json({ estimatedCostUsd: model.estimatedCostUsd, estimatedCredits: Number(creditsForActualCost(model.estimatedCostUsd)), actualBilledSeparately: true });
});
