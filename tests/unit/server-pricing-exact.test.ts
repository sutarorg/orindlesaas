import { describe, expect, it } from "vitest";
import {
  exactDecimalToNano,
  formatActualUsd,
  formatEstimatedUsd,
  parseExactDecimal,
  parseGatewayJson,
  quoteExactOperation,
  type PriceVersionLike,
} from "@/lib/server/ai/pricing";

describe("exact Gateway pricing", () => {
  it("keeps non-integer JSON numbers as lossless strings and integers as numbers", () => {
    const parsed = parseGatewayJson('{"id":"x","context_window":200000,"input":"0.000003","cost":0.0000035}') as Record<string, unknown>;
    expect(parsed.context_window).toBe(200000);
    expect(parsed.input).toBe("0.000003");
    expect(parsed.cost).toBe("0.0000035");
  });

  it("selects exactly one inclusive/exclusive token tier", () => {
    const price: PriceVersionLike = {
      inputNanoUsdPerToken: null,
      outputNanoUsdPerToken: null,
      operationNanoUsd: null,
      pricingData: {
        input_tiers: [
          { min: 0, max: 200_000, cost: "0.000001" },
          { min: 200_000, max: null, cost: "0.000002" },
        ],
        output: "0.000004",
      },
    };
    // 199,999 × 0.000001 + 1 × 0.000004 = 0.200003 in the first tier.
    expect(quoteExactOperation({ kind: "chat", price, inputTokens: 199_999, outputTokens: 1 }).usd).toBe("0.20000300");
    // The 200,000 boundary is exclusive to the first tier: 200,000 × 0.000002 = 0.4.
    expect(quoteExactOperation({ kind: "chat", price, inputTokens: 200_000, outputTokens: 0 }).usd).toBe("0.40000000");
  });

  it("refuses provider-variable, ambiguous and unquotable pricing", () => {
    const base = { inputNanoUsdPerToken: null, outputNanoUsdPerToken: null, operationNanoUsd: null };
    expect(() => quoteExactOperation({ kind: "chat", price: { ...base, pricingData: { varies_by_provider: true, input: "0.000001", output: "0.000001" } }, inputTokens: 1, outputTokens: 1 })).toThrow(/provider quote/);
    expect(() => quoteExactOperation({ kind: "chat", price: { ...base, pricingData: { input_tiers: [{ min: 0, max: null, cost: "0.000001" }, { min: 0, max: null, cost: "0.000002" }], output: "0.000001" } }, inputTokens: 1, outputTokens: 1 })).toThrow(/one input tier/);
    expect(() => quoteExactOperation({ kind: "image", price: { ...base, pricingData: {} } })).toThrow(/image/);
    expect(() => quoteExactOperation({ kind: "video", price: { ...base, pricingData: { video_duration_pricing: [{ resolution: "1280x720", cost_per_second: "0.0001" }] } }, durationSeconds: 4, pricingResolution: "1920x1080" })).toThrow(/unique exact video rate/);
  });

  it("prices video only from an exact matching resolution and audio rate", () => {
    const price: PriceVersionLike = {
      inputNanoUsdPerToken: null,
      outputNanoUsdPerToken: null,
      operationNanoUsd: null,
      pricingData: {
        video_duration_pricing: [
          { resolution: "1280x720", audio: false, cost_per_second: "0.0001" },
          { resolution: "1280x720", audio: true, cost_per_second: "0.0002" },
        ],
      },
    };
    expect(quoteExactOperation({ kind: "video", price, durationSeconds: 4, pricingResolution: "1280x720", generateAudio: false }).usd).toBe("0.00040000");
    expect(quoteExactOperation({ kind: "video", price, durationSeconds: 4, pricingResolution: "1280x720", generateAudio: true }).usd).toBe("0.00080000");
  });

  it("rounds reservations up and actuals half-up only at the eight-decimal ledger boundary", () => {
    expect(formatEstimatedUsd({ units: 1n, scale: 9 })).toBe("0.00000001");
    expect(formatEstimatedUsd({ units: 1n, scale: 12 })).toBe("0.00000001");
    expect(formatActualUsd({ units: 4n, scale: 9 })).toBe("0.00000000");
    expect(formatActualUsd({ units: 5n, scale: 9 })).toBe("0.00000001");
    expect(formatActualUsd({ units: 6n, scale: 9 })).toBe("0.00000001");
    expect(formatActualUsd({ units: 15n, scale: 9 })).toBe("0.00000002");
    expect(formatEstimatedUsd({ units: 6n, scale: 9 })).toBe("0.00000001");
  });

  it("projects legacy nano only when exact and rejects negative prices", () => {
    expect(exactDecimalToNano("0.000001")).toBe(1_000n);
    expect(exactDecimalToNano("0.000000001000")).toBe(1n);
    expect(() => exactDecimalToNano("0.0000000015")).toThrow(/not exactly representable/);
    expect(() => exactDecimalToNano("-0.000001")).toThrow(/negative/);
    expect(() => parseExactDecimal("abc")).toThrow(/Invalid/);
  });
});
