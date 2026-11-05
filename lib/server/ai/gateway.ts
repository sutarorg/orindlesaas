import { createGateway } from "ai";
import { requireEnvironment } from "@/lib/server/env";

export function getGateway() {
  const { AI_GATEWAY_API_KEY: apiKey } = requireEnvironment(["AI_GATEWAY_API_KEY"], "Vercel AI Gateway");
  return createGateway({ apiKey });
}

export function extractGatewayGenerationId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || !("gateway" in metadata)) return null;
  const gateway = metadata.gateway;
  if (!gateway || typeof gateway !== "object" || !("generationId" in gateway)) return null;
  return typeof gateway.generationId === "string" && gateway.generationId.startsWith("gen_")
    ? gateway.generationId
    : null;
}

export function decimalCostFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value >= 1e15) {
    throw new RangeError("Gateway returned an invalid actual cost.");
  }
  return value.toFixed(8);
}

export async function lookupActualGenerationCost(generationId: string) {
  if (!generationId.startsWith("gen_")) throw new RangeError("Invalid Gateway generation ID.");
  const info = await getGateway().getGenerationInfo({ id: generationId });
  return {
    actualCostUsd: decimalCostFromNumber(info.totalCost),
    usage: {
      promptTokens: info.promptTokens,
      completionTokens: info.completionTokens,
      reasoningTokens: info.reasoningTokens,
      cachedTokens: info.cachedTokens,
    },
    provider: info.providerName,
    model: info.model,
  };
}
