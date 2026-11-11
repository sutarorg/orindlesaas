import { z } from "zod";
import { formatActualUsd, parseExactDecimal, parseGatewayJson, requireNonnegative } from "@/lib/server/ai/pricing";
import { requireEnvironment } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";
import { OPENROUTER_BASE_URL } from "@/lib/server/ai/openrouter";

/**
 * OpenRouter generation identifiers.
 *
 * Verified against the official generation-lookup reference, whose example ID is
 * `gen-3bhGkxlo4XFrqiabUM7NDtwDzWwG`: OpenRouter uses a HYPHEN after `gen`. The Gateway identifiers
 * this codebase previously stored used an underscore. Accepting only one of the two would silently
 * send every generation to reconciliation, so both are recognised explicitly and the prefix is
 * recorded, which keeps historical and new evidence distinguishable.
 */
export const OPENROUTER_GENERATION_ID = /^gen-[A-Za-z0-9_-]{4,160}$/;
export const LEGACY_GATEWAY_GENERATION_ID = /^gen_[A-Za-z0-9_-]{4,160}$/;

export type GenerationIdOrigin = "openrouter" | "legacy_gateway";

export function classifyGenerationId(value: string): GenerationIdOrigin | null {
  if (OPENROUTER_GENERATION_ID.test(value)) return "openrouter";
  if (LEGACY_GATEWAY_GENERATION_ID.test(value)) return "legacy_gateway";
  return null;
}

export function isOpenRouterGenerationId(value: string): boolean {
  return OPENROUTER_GENERATION_ID.test(value);
}

/**
 * Where an exact cost figure came from. The ledger records this so an auditor can tell a provider
 * lookup apart from a response-side cost, and so a token estimate can never masquerade as actual.
 */
export type CostEvidenceSource =
  | "openrouter_generation_lookup"
  | "openrouter_image_response"
  | "openrouter_video_completion"
  | "legacy_gateway_lookup";

export type UsageEvidence = {
  provider: "openrouter" | "vercel_ai_gateway";
  providerGenerationId: string;
  providerJobId: string | null;
  providerEndpoint: string | null;
  model: string | null;
  actualCostUsd: string;
  usage: Record<string, number>;
  costSource: CostEvidenceSource;
  verified: boolean;
  retrievedAt: string;
};

const tokenCount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullish();

/**
 * The generation-lookup record. Deliberately loose on fields Orindle does not consume, strict on the
 * ones it does: `id` must match the requested ID and `total_cost` must be present and non-negative,
 * otherwise the record is treated as unverified rather than as a zero cost.
 */
const generationResponseSchema = z.looseObject({
  data: z.looseObject({
    id: z.string().min(1).max(200),
    total_cost: z.union([z.string().max(1100), z.number().nonnegative().max(Number.MAX_SAFE_INTEGER)]),
    usage: z.union([z.string().max(1100), z.number().nonnegative().max(Number.MAX_SAFE_INTEGER)]).nullish(),
    upstream_inference_cost: z.union([z.string().max(1100), z.number().nonnegative().max(Number.MAX_SAFE_INTEGER)]).nullish(),
    native_tokens_prompt: tokenCount,
    native_tokens_completion: tokenCount,
    native_tokens_cached: tokenCount,
    native_tokens_reasoning: tokenCount,
    provider_name: z.string().max(240).nullish(),
    model: z.string().max(320).nullish(),
    cancelled: z.boolean().nullish(),
    is_byok: z.boolean().nullish(),
  }),
});

export type GenerationLookupResult = UsageEvidence & {
  cancelled: boolean;
  upstreamCostUsd: string | null;
};

/**
 * Fetches the authoritative cost for one generation.
 *
 * `total_cost` is parsed with the lossless JSON reader and carried as an exact decimal string all
 * the way to the NUMERIC(24,8) column — it is never routed through a JavaScript float, because a
 * binary float cannot represent these values exactly and the ledger charges `ceil(cost × 200)`.
 *
 * Errors are surfaced as `AppError` with `integration_unavailable` so the settlement path treats a
 * failed lookup as "not yet known" rather than as a zero charge.
 */
export async function lookupOpenRouterGenerationCost(
  generationId: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<GenerationLookupResult> {
  const origin = classifyGenerationId(generationId);
  if (!origin) throw new RangeError("Invalid OpenRouter generation ID format.");
  const { OPENROUTER_API_KEY: apiKey } = requireEnvironment(["OPENROUTER_API_KEY"], "OpenRouter");
  const url = new URL(`${OPENROUTER_BASE_URL}/generation`);
  url.searchParams.set("id", generationId);
  const response = await (options.fetchImpl ?? fetch)(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AppError(
      "integration_unavailable",
      response.status === 404 ? 502 : 503,
      `OpenRouter generation lookup failed with HTTP ${response.status}; settlement requires reconciliation.`,
    );
  }
  const body = await response.text();
  if (body.length > 2_000_000) throw new AppError("integration_unavailable", 502, "OpenRouter generation lookup exceeded the response safety bound.");
  let payload: unknown;
  try {
    payload = parseGatewayJson(body);
  } catch {
    throw new AppError("integration_unavailable", 502, "OpenRouter generation lookup returned invalid JSON; settlement requires reconciliation.");
  }
  const parsed = generationResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.data.id !== generationId) {
    throw new AppError("integration_unavailable", 502, "OpenRouter generation lookup returned an invalid or mismatched record; settlement requires reconciliation.");
  }
  const data = parsed.data.data;
  const exact = requireNonnegative(parseExactDecimal(String(data.total_cost)));
  if (exact.units >= 1_000_000_000_000_000n * 10n ** BigInt(exact.scale)) {
    throw new AppError("integration_unavailable", 502, "OpenRouter actual cost exceeds the ledger safety bound.");
  }
  const upstream = data.upstream_inference_cost == null
    ? null
    : formatActualUsd(requireNonnegative(parseExactDecimal(String(data.upstream_inference_cost))));
  const usage = Object.fromEntries(Object.entries({
    promptTokens: data.native_tokens_prompt,
    completionTokens: data.native_tokens_completion,
    reasoningTokens: data.native_tokens_reasoning,
    cachedTokens: data.native_tokens_cached,
  }).filter((entry): entry is [string, number] => typeof entry[1] === "number"));

  return {
    provider: origin === "openrouter" ? "openrouter" : "vercel_ai_gateway",
    providerGenerationId: generationId,
    providerJobId: null,
    providerEndpoint: data.provider_name ?? null,
    model: data.model ?? null,
    actualCostUsd: formatActualUsd(exact),
    usage,
    costSource: origin === "openrouter" ? "openrouter_generation_lookup" : "legacy_gateway_lookup",
    verified: true,
    retrievedAt: new Date().toISOString(),
    cancelled: data.cancelled === true,
    upstreamCostUsd: upstream,
  };
}

/**
 * Cost evidence taken from a completed provider response.
 *
 * The image API reports `usage.cost` and a completed video job reports `usage.cost`. Those values
 * arrive as JSON numbers, so they are re-parsed from their shortest round-trip decimal form and
 * marked `verified: false`: the generation lookup remains the authoritative source, and this is the
 * fallback only when a lookup cannot be made.
 */
export function evidenceFromProviderResponse(input: {
  costUsd: number | string | null | undefined;
  generationId?: string | null;
  jobId?: string | null;
  model?: string | null;
  endpointName?: string | null;
  usage?: Record<string, number>;
  source: Extract<CostEvidenceSource, "openrouter_image_response" | "openrouter_video_completion">;
}): UsageEvidence | null {
  if (input.costUsd == null) return null;
  const raw = typeof input.costUsd === "number"
    ? (Number.isFinite(input.costUsd) && input.costUsd >= 0 ? input.costUsd.toFixed(12) : null)
    : input.costUsd;
  if (raw == null) return null;
  let exact;
  try {
    exact = requireNonnegative(parseExactDecimal(String(raw)));
  } catch {
    return null;
  }
  return {
    provider: "openrouter",
    providerGenerationId: input.generationId ?? "",
    providerJobId: input.jobId ?? null,
    providerEndpoint: input.endpointName ?? null,
    model: input.model ?? null,
    actualCostUsd: formatActualUsd(exact),
    usage: input.usage ?? {},
    costSource: input.source,
    verified: false,
    retrievedAt: new Date().toISOString(),
  };
}
