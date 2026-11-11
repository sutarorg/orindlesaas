import { describe, expect, it } from "vitest";
import { hashCatalogValue, normalizeOpenRouterCatalog, pricingForQuote, endpointRates } from "@/lib/server/ai/catalog-sync";

/**
 * Catalogue normalisation against the OpenRouter contract.
 *
 * These assertions encode facts that differ from the Gateway shape, so they are the ones that would
 * catch a migration that merely renamed things: the author is not the endpoint provider, the product
 * comes from output modalities, and `output_modalities` must be requested explicitly or image and
 * video models vanish from the catalogue entirely.
 */
function entry(partial: Record<string, unknown> = {}) {
  return {
    id: "openai/example",
    name: "Example",
    architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    pricing: { prompt: "0.000001", completion: "0.000002" },
    context_length: 128_000,
    supported_parameters: ["max_tokens", "response_format"],
    ...partial,
  };
}

describe("OpenRouter catalogue normalisation", () => {
  it("uses the canonical ID as identity and derives the product from output modalities", () => {
    const result = normalizeOpenRouterCatalog([entry()]);
    expect(result.invalid).toBe(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      id: "openai/example",
      providerModelId: "openai/example",
      author: "openai",
      kind: "chat",
      catalogType: "language",
      inputNano: 1000,
      outputNano: 2000,
    });
    // A sync must never carry an enablement decision.
    expect(result.rows[0]).not.toHaveProperty("enabled");
  });

  it("does not confuse the model author with the serving provider", () => {
    // The author is who published the model; the endpoint is who runs it. They differ constantly:
    // a Meta model served by Together has author "meta-llama", not "together".
    const result = normalizeOpenRouterCatalog([entry({ id: "meta-llama/llama-3-70b" })]);
    expect(result.rows[0]).toMatchObject({ author: "meta-llama" });
    expect(result.rows[0]).not.toHaveProperty("providerName");
    expect(result.rows[0]!.capabilities).not.toHaveProperty("providerName");
  });

  it("maps image and video models to their products and invents no operation price", () => {
    const result = normalizeOpenRouterCatalog([
      entry({ id: "vendor/image-model", architecture: { input_modalities: ["text"], output_modalities: ["image"] }, pricing: { image: "0.04" } }),
      entry({ id: "vendor/video-model", architecture: { input_modalities: ["text"], output_modalities: ["video"] }, pricing: null }),
    ]);
    expect(result.rows.map((row) => [row.kind, row.catalogType])).toEqual([["image", "image"], ["video", "video"]]);
    expect(result.rows[1]!.operationNano).toBeNull();
  });

  it("keeps categories Orindle has no product for, without making them selectable", () => {
    const result = normalizeOpenRouterCatalog([
      entry({ id: "vendor/embedding", architecture: { input_modalities: ["text"], output_modalities: ["embeddings"] }, pricing: null }),
      entry({ id: "vendor/speech", architecture: { input_modalities: ["text"], output_modalities: ["speech"] }, pricing: null }),
    ]);
    expect(result.rows.map((row) => [row.id, row.kind])).toEqual([["vendor/embedding", null], ["vendor/speech", null]]);
    // Catalogue type is preserved so an administrator can still see what was discovered.
    expect(result.rows.map((row) => row.catalogType)).toEqual(["embeddings", "speech"]);
  });

  it("quarantines malformed entries and de-duplicates canonical IDs", () => {
    const result = normalizeOpenRouterCatalog([
      entry({ id: "vendor/precise", pricing: { prompt: "0.0000000015", completion: "0.000001" } }),
      entry({ id: "no-slash" }),
      entry({ id: "vendor/precise" }),
      entry({ id: "vendor/gap", architecture: undefined, pricing: undefined }),
    ]);
    expect(result.invalid).toBe(2);
    // A price not representable at the nano-dollar boundary keeps raw evidence but no projection.
    expect(result.rows.find((row) => row.id === "vendor/precise")!).toMatchObject({ inputNano: null });
    expect(result.rows.map((row) => row.id).sort()).toEqual(["vendor/gap", "vendor/precise"]);
  });

  it("keeps unknown modalities rather than dropping the model", () => {
    const result = normalizeOpenRouterCatalog([entry({ id: "vendor/future", architecture: { input_modalities: ["text"], output_modalities: ["hologram"] } })]);
    expect(result.rows[0]).toMatchObject({ kind: null, catalogType: "hologram" });
    expect(result.rows[0]!.modalities).toContain("hologram");
  });
});

describe("pricing translation", () => {
  it("maps OpenRouter token keys onto the quote engine's dimensions", () => {
    expect(pricingForQuote({ prompt: "0.0000005", completion: "0.0000015" })).toMatchObject({
      input: "0.0000005",
      output: "0.0000015",
    });
  });

  it("never coerces a price through a float", () => {
    // A long decimal must arrive as the identical string, or the exact-arithmetic engine would be
    // fed a value that has already lost precision.
    const exact = "0.000000001234567890123";
    expect(pricingForQuote({ prompt: exact })?.input).toBe(exact);
  });

  it("returns null for absent or unusable pricing instead of assuming zero", () => {
    expect(pricingForQuote(null)).toBeNull();
    expect(pricingForQuote({})).toBeNull();
    expect(pricingForQuote({ prompt: "" })).toBeNull();
  });

  it("retains unrecognised dimensions as raw evidence", () => {
    expect(pricingForQuote({ prompt: "0.1", audio: "0.5" })).toMatchObject({ input: "0.1", raw_audio: "0.5" });
  });

  it("normalises endpoint rates into exact strings", () => {
    expect(endpointRates({ prompt: "0.000001", completion: 0.000002 })).toEqual({ prompt: "0.000001", completion: "0.000002" });
    expect(endpointRates({})).toBeNull();
  });
});

describe("stable hashing", () => {
  it("hashes stably regardless of key order", () => {
    expect(hashCatalogValue({ b: 1, a: 2 })).toBe(hashCatalogValue({ a: 2, b: 1 }));
  });

  it("changes when a price changes, so a re-sync is detectable", () => {
    expect(hashCatalogValue({ prompt: "0.1" })).not.toBe(hashCatalogValue({ prompt: "0.2" }));
  });
});
