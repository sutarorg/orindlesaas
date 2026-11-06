import { describe, expect, it } from "vitest";
import { hashCatalogValue, normalizeGatewayCatalog, type GatewayCatalogEntry } from "@/lib/server/ai/catalog-sync";

function entry(partial: Partial<GatewayCatalogEntry>): GatewayCatalogEntry {
  return {
    id: "openai/example",
    name: "Example",
    type: "language",
    pricing: { input: "0.000001", output: "0.000002" },
    ...partial,
  };
}

describe("Gateway catalog normalization", () => {
  it("maps discovery metadata without enabling or projecting inexact prices", () => {
    const result = normalizeGatewayCatalog([entry({})]);
    expect(result.invalid).toBe(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      providerId: "openai",
      id: "gateway:openai/example",
      gatewayModelId: "openai/example",
      kind: "chat",
      inputNano: 1000,
      outputNano: 2000,
      pricingData: { input: "0.000001", output: "0.000002" },
    });
    expect(result.rows[0]).not.toHaveProperty("enabled");
  });

  it("retains media mappings without inventing operation prices", () => {
    const result = normalizeGatewayCatalog([
      entry({ id: "provider/image", name: "Image", type: "image", pricing: null }),
      entry({ id: "provider/video", name: "Video", type: "video", pricing: null }),
    ]);
    expect(result.rows.map((row) => [row.kind, row.operationNano])).toEqual([["image", null], ["video", null]]);
  });

  it("keeps unknown types and raw-only precision as quarantined or projected records", () => {
    const result = normalizeGatewayCatalog([
      entry({ id: "provider/embedding", type: "embedding", pricing: null }),
      entry({ id: "provider/precise", pricing: { input: "0.0000000015", output: "0.000001" } }),
      entry({ id: "bad id" }),
    ]);
    expect(result.invalid).toBe(1);
    expect(result.rows.map((row) => [row.id, row.kind, row.inputNano])).toEqual([
      ["gateway:provider/embedding", null, null],
      ["gateway:provider/precise", "chat", null],
    ]);
  });

  it("hashes stably regardless of key order", () => {
    expect(hashCatalogValue({ b: 1, a: 2 })).toBe(hashCatalogValue({ a: 2, b: 1 }));
  });
});
