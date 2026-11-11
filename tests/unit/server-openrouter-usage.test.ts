import { describe, expect, it } from "vitest";
import { classifyGenerationId, evidenceFromProviderResponse, isOpenRouterGenerationId, lookupOpenRouterGenerationCost } from "@/lib/server/ai/usage";

/**
 * The generation ID format is the highest-consequence detail in this migration.
 *
 * OpenRouter uses `gen-` (hyphen); the Vercel AI Gateway used `gen_` (underscore). The previous
 * lookup validator accepted only the underscore form, so a straight rename of the Gateway function
 * would have rejected every OpenRouter ID, and settlement would have silently routed *all* traffic
 * to reconciliation. These tests exist so that mistake cannot be reintroduced quietly.
 */
describe("generation ID classification", () => {
  it("accepts the documented OpenRouter form", () => {
    // Taken from the official generation-lookup reference.
    expect(isOpenRouterGenerationId("gen-3bhGkxlo4XFrqiabUM7NDtwDzWwG")).toBe(true);
    expect(classifyGenerationId("gen-3bhGkxlo4XFrqiabUM7NDtwDzWwG")).toBe("openrouter");
  });

  it("still recognises the historical Gateway form, as a different thing", () => {
    expect(classifyGenerationId("gen_abcDEF123_-x")).toBe("legacy_gateway");
    expect(isOpenRouterGenerationId("gen_abcDEF123")).toBe(false);
  });

  it("rejects malformed or ambiguous identifiers", () => {
    expect(classifyGenerationId("")).toBeNull();
    expect(classifyGenerationId("gen-")).toBeNull();
    expect(classifyGenerationId("gen-abc")).toBeNull(); // too short to be real
    expect(classifyGenerationId("not-a-generation")).toBeNull();
    expect(classifyGenerationId("gen-abc def")).toBeNull();
    expect(classifyGenerationId(`gen-${"a".repeat(200)}`)).toBeNull();
  });

  it("refuses an unclassifiable ID instead of guessing which provider to ask", async () => {
    await expect(lookupOpenRouterGenerationCost("garbage")).rejects.toThrow(/format/);
    await expect(lookupOpenRouterGenerationCost("gen-")).rejects.toThrow(/format/);
  });

  it("labels a historical Gateway ID as Gateway evidence, not as OpenRouter usage", async () => {
    // The legacy form is still looked up (older rows must remain auditable), but the evidence is
    // stamped with the provider that actually served it and a legacy cost source. Relabelling it as
    // OpenRouter would corrupt the audit trail for historical generations.
    await withKey(async () => {
      const result = await lookupOpenRouterGenerationCost("gen_abcDEF123", {
        fetchImpl: fetchReturning(generationBody({ id: "gen_abcDEF123" })),
      });
      expect(result).toMatchObject({ provider: "vercel_ai_gateway", costSource: "legacy_gateway_lookup" });
    });
  });
});

const generationBody = (overrides: Record<string, unknown> = {}) => JSON.stringify({
  data: {
    id: "gen-abc123XYZ",
    model: "openai/gpt-5.2",
    provider_name: "OpenAI",
    total_cost: 0.0015,
    usage: 0.0015,
    upstream_inference_cost: 0.0012,
    native_tokens_prompt: 10,
    native_tokens_completion: 25,
    native_tokens_cached: 3,
    native_tokens_reasoning: 5,
    cancelled: false,
    ...overrides,
  },
});

function fetchReturning(body: string, init?: ResponseInit) {
  return (async () => new Response(body, { status: 200, ...init })) as unknown as typeof fetch;
}

const withKey = <T,>(run: () => Promise<T>) => {
  const previous = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "test-key";
  return run().finally(() => {
    if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previous;
  });
};

describe("authoritative cost lookup", () => {
  it("returns the exact upstream cost and token evidence", async () => {
    await withKey(async () => {
      const result = await lookupOpenRouterGenerationCost("gen-abc123XYZ", { fetchImpl: fetchReturning(generationBody()) });
      expect(result).toMatchObject({
        provider: "openrouter",
        providerGenerationId: "gen-abc123XYZ",
        providerEndpoint: "OpenAI",
        model: "openai/gpt-5.2",
        actualCostUsd: "0.00150000",
        costSource: "openrouter_generation_lookup",
        verified: true,
      });
      expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 25, reasoningTokens: 5, cachedTokens: 3 });
    });
  });

  it("preserves precision instead of routing the cost through a float", async () => {
    await withKey(async () => {
      // 0.0000123456789 is not exactly representable in binary floating point; a Number round-trip
      // would silently change the charged credit count.
      const result = await lookupOpenRouterGenerationCost("gen-abc123XYZ", {
        fetchImpl: fetchReturning(generationBody({ total_cost: "0.0000123456789" })),
      });
      expect(result.actualCostUsd).toBe("0.00001235");
      expect(result.verified).toBe(true);
    });
  });

  it("rejects a record whose id does not match the requested generation", async () => {
    await withKey(async () => {
      await expect(lookupOpenRouterGenerationCost("gen-abc123XYZ", {
        fetchImpl: fetchReturning(generationBody({ id: "gen-someoneElse" })),
      })).rejects.toThrow(/invalid or mismatched/);
    });
  });

  it("does not fabricate a cost when the field is missing or negative", async () => {
    await withKey(async () => {
      const missing = generationBody();
      const withoutCost = JSON.parse(missing);
      delete withoutCost.data.total_cost;
      await expect(lookupOpenRouterGenerationCost("gen-abc123XYZ", {
        fetchImpl: fetchReturning(JSON.stringify(withoutCost)),
      })).rejects.toThrow();
      await expect(lookupOpenRouterGenerationCost("gen-abc123XYZ", {
        fetchImpl: fetchReturning(generationBody({ total_cost: -1 })),
      })).rejects.toThrow();
    });
  });

  it("surfaces an HTTP failure rather than treating it as a zero charge", async () => {
    await withKey(async () => {
      await expect(lookupOpenRouterGenerationCost("gen-abc123XYZ", {
        fetchImpl: (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch,
      })).rejects.toMatchObject({ code: "integration_unavailable" });
    });
  });
});

describe("response-side cost evidence", () => {
  it("is recorded but marked unverified, so it cannot pass as the ledger figure", () => {
    const evidence = evidenceFromProviderResponse({
      costUsd: 0.04,
      model: "openai/gpt-image-2",
      source: "openrouter_image_response",
      usage: { completionTokens: 4175 },
    });
    expect(evidence).toMatchObject({
      actualCostUsd: "0.04000000",
      costSource: "openrouter_image_response",
      verified: false,
    });
  });

  it("returns null when the provider supplied no cost at all", () => {
    expect(evidenceFromProviderResponse({ costUsd: null, source: "openrouter_video_completion" })).toBeNull();
    expect(evidenceFromProviderResponse({ costUsd: undefined, source: "openrouter_video_completion" })).toBeNull();
    expect(evidenceFromProviderResponse({ costUsd: Number.NaN, source: "openrouter_video_completion" })).toBeNull();
    expect(evidenceFromProviderResponse({ costUsd: -5, source: "openrouter_video_completion" })).toBeNull();
  });
});
