import { createGateway } from "ai";
import { z } from "zod";
import { formatActualUsd, parseExactDecimal, parseGatewayJson, requireNonnegative } from "@/lib/server/ai/pricing";
import { requireEnvironment } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";

export function getGateway() {
  const { AI_GATEWAY_API_KEY: apiKey } = requireEnvironment(["AI_GATEWAY_API_KEY"], "Vercel AI Gateway");
  return createGateway({ apiKey });
}

export function extractGatewayGenerationId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || !("gateway" in metadata)) return null;
  const gateway = metadata.gateway;
  if (!gateway || typeof gateway !== "object" || !("generationId" in gateway)) return null;
  return typeof gateway.generationId === "string" && gateway.generationId.startsWith("gen_") ? gateway.generationId : null;
}

/** Legacy test/helper only. Settlement never converts a floating-point provider cost. */
export function decimalCostFromNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value >= 1e15) throw new RangeError("Gateway returned an invalid actual cost.");
  return value.toFixed(8);
}

const tokenCount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullish();
const generationResponseSchema = z.looseObject({
  data: z.looseObject({
    id: z.string().min(1).max(160),
    total_cost: z.union([z.string().max(1100), z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)]),
    tokens_prompt: tokenCount,
    tokens_completion: tokenCount,
    native_tokens_reasoning: tokenCount,
    native_tokens_cached: tokenCount,
    provider_name: z.string().max(240).nullish(),
    model: z.string().max(320).nullish(),
  }),
});

export async function lookupActualGenerationCost(generationId: string, options: { fetchImpl?: typeof fetch } = {}) {
  if (!/^gen_[A-Za-z0-9_-]{4,160}$/.test(generationId)) throw new RangeError("Invalid Gateway generation ID.");
  const { AI_GATEWAY_API_KEY: apiKey } = requireEnvironment(["AI_GATEWAY_API_KEY"], "Vercel AI Gateway");
  const url = new URL("https://ai-gateway.vercel.sh/v1/generation");
  url.searchParams.set("id", generationId);
  const response = await (options.fetchImpl ?? fetch)(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok) throw new AppError("integration_unavailable", 503, `Gateway generation lookup failed with HTTP ${response.status}; settlement requires reconciliation.`);
  const body = await response.text();
  if (body.length > 2_000_000) throw new AppError("integration_unavailable", 502, "Gateway generation lookup exceeded the response safety bound.");
  let payload: unknown;
  try {
    payload = parseGatewayJson(body);
  } catch {
    throw new AppError("integration_unavailable", 502, "Gateway generation lookup returned invalid JSON; settlement requires reconciliation.");
  }
  const parsed = generationResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.data.id !== generationId) throw new AppError("integration_unavailable", 502, "Gateway generation lookup returned an invalid or mismatched record; settlement requires reconciliation.");
  const data = parsed.data.data;
  const exact = requireNonnegative(parseExactDecimal(String(data.total_cost)));
  if (exact.units >= 1_000_000_000_000_000n * 10n ** BigInt(exact.scale)) throw new AppError("integration_unavailable", 502, "Gateway actual cost exceeds the ledger safety bound.");
  const actualCostUsd = formatActualUsd(exact);
  return {
    actualCostUsd,
    usage: Object.fromEntries(Object.entries({
      promptTokens: data.tokens_prompt,
      completionTokens: data.tokens_completion,
      reasoningTokens: data.native_tokens_reasoning,
      cachedTokens: data.native_tokens_cached,
    }).filter((entry): entry is [string, number] => typeof entry[1] === "number")),
    provider: data.provider_name ?? null,
    model: data.model ?? null,
  };
}
