import { describe, expect, it } from "vitest";
import { normalizeGatewayCatalog, type GatewayCatalogEntry } from "@/lib/server/ai/catalog-sync";

function entry(partial: Partial<GatewayCatalogEntry>): GatewayCatalogEntry {
  return {
    id: "openai/example",
    name: "Example",
    modelType: "language",
    specification: { specificationVersion: "v4", provider: "openai", modelId: "example" },
    pricing: { input: "0.000001", output: "0.000002" },
    ...partial,
  };
}

describe("Gateway catalog normalization", () => {
  it("uses exact provider prices and keeps enablement outside sync mapping", () => {
    const result = normalizeGatewayCatalog([entry({})]);
    expect(result.skipped).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      providerId: "openai",
      modelId: "gateway:openai/example",
      gatewayModelId: "openai/example",
      kind: "chat",
      inputNanoUsdPerToken: 1000,
      outputNanoUsdPerToken: 2000,
    });
    expect(result.rows[0]).not.toHaveProperty("enabled");
  });

  it("retains media mappings without inventing operation prices", () => {
    const result = normalizeGatewayCatalog([
      entry({ id: "provider/image", name: "Image", modelType: "image", pricing: null }),
      entry({ id: "provider/video", name: "Video", modelType: "video", pricing: null }),
    ]);
    expect(result.rows.map((row) => [row.kind, row.inputNanoUsdPerToken, row.outputNanoUsdPerToken])).toEqual([["image", null, null], ["video", null, null]]);
  });

  it("skips unsupported types and prices exceeding exact storage precision", () => {
    const result = normalizeGatewayCatalog([
      entry({ id: "provider/embedding", modelType: "embedding", pricing: null }),
      entry({ id: "provider/precise", pricing: { input: "0.000000001", output: "0.000001" } }),
    ]);
    expect(result.rows).toEqual([]);
    expect(result.skipped.map((row) => row.reason)).toEqual(["unsupported_or_invalid_metadata", "language_price_precision_unsupported"]);
  });
});
