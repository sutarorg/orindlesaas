import { parse as parseLosslessJson } from "lossless-json";
import { z } from "zod";

export type ExactDecimal = { units: bigint; scale: number };
export type PricingData = Record<string, unknown>;

const decimalPattern = /^([+-]?)(?:(0|[1-9]\d*)(?:\.(\d+))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;
const integerPattern = /^-?(0|[1-9]\d*)$/;

/** Parse Gateway JSON without ever converting a non-integer through a float. */
export function parseGatewayJson(text: string): unknown {
  return parseLosslessJson(text, null, {
    parseNumber: (value: string) => {
      if (integerPattern.test(value)) {
        const parsed = Number(value);
        if (Number.isSafeInteger(parsed)) return parsed;
      }
      return value;
    },
  });
}

export function parseExactDecimal(input: string): ExactDecimal {
  const match = decimalPattern.exec(input);
  if (!match) throw new Error("Invalid exact decimal.");
  const [, sign = "", whole = "", fraction = "", leadingFraction, exponent = "0"] = match;
  const digits = `${whole || "0"}${fraction || leadingFraction || ""}`;
  const exponentValue = Number(exponent);
  if (!Number.isSafeInteger(exponentValue) || Math.abs(exponentValue) > 1000) throw new Error("Decimal exponent is outside the supported bound.");
  let scale = (fraction || leadingFraction || "").length - exponentValue;
  let units = BigInt(digits);
  if (scale < 0) {
    units *= 10n ** BigInt(-scale);
    scale = 0;
  }
  if (scale > 1000) throw new Error("Decimal scale is outside the supported bound.");
  if (sign === "-") units = -units;
  return { units, scale };
}

export function addExact(a: ExactDecimal, b: ExactDecimal): ExactDecimal {
  const scale = Math.max(a.scale, b.scale);
  return {
    units: a.units * 10n ** BigInt(scale - a.scale) + b.units * 10n ** BigInt(scale - b.scale),
    scale,
  };
}

export function multiplyExact(value: ExactDecimal, quantity: bigint | number): ExactDecimal {
  const factor = typeof quantity === "bigint" ? quantity : BigInt(quantity);
  return { units: value.units * factor, scale: value.scale };
}

export function requireNonnegative(value: ExactDecimal): ExactDecimal {
  if (value.units < 0n) throw new Error("A price cannot be negative.");
  return value;
}

/** Convert only values exactly representable at the legacy nano-USD boundary. */
export function exactDecimalToNano(input: string | null | undefined): bigint | null {
  if (input == null) return null;
  const value = requireNonnegative(parseExactDecimal(input));
  if (value.scale <= 9) return value.units * 10n ** BigInt(9 - value.scale);
  const divisor = 10n ** BigInt(value.scale - 9);
  if (value.units % divisor !== 0n) throw new Error("Price is not exactly representable in nano-USD; raw pricing is still retained.");
  return value.units / divisor;
}

export function nanoToDecimal(value: bigint | number | null): string | null {
  if (value == null) return null;
  const units = BigInt(value);
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function formatScaledNonnegative(value: ExactDecimal, roundUp: boolean): string {
  if (value.units < 0n) throw new Error("A monetary value cannot be negative.");
  const targetScale = 8;
  let units: bigint;
  if (value.scale <= targetScale) {
    units = value.units * 10n ** BigInt(targetScale - value.scale);
  } else {
    const factor = 10n ** BigInt(value.scale - targetScale);
    const quotient = value.units / factor;
    const remainder = value.units % factor;
    units = quotient + (roundUp ? (remainder > 0n ? 1n : 0n) : (remainder * 2n >= factor ? 1n : 0n));
  }
  const whole = units / 100_000_000n;
  const fraction = (units % 100_000_000n).toString().padStart(8, "0");
  return `${whole}.${fraction}`;
}

/** Actual provider cost uses explicit half-up rounding at NUMERIC(24,8). */
export function formatActualUsd(value: ExactDecimal): string {
  return formatScaledNonnegative(value, false);
}

/** The existing reservation NUMERIC(24,8) boundary rounds upward, never downward. */
export function formatEstimatedUsd(value: ExactDecimal): string {
  return formatScaledNonnegative(value, true);
}

function exactRate(value: unknown, field: string): ExactDecimal {
  if (typeof value !== "string") throw new Error(`${field} must be an exact decimal string; the operation is unquotable.`);
  return requireNonnegative(parseExactDecimal(value));
}

const tierSchema = z.array(z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative().nullable().optional(),
  cost: z.string(),
})).max(100);

function tokenRate(pricing: PricingData, channel: "input" | "output", inputTokens: number): ExactDecimal {
  if (pricing.varies_by_provider === true) throw new Error("Provider-variable pricing needs an explicit exact provider quote.");
  const tiersValue = pricing[`${channel}_tiers`];
  if (tiersValue !== undefined) {
    const tiers = tierSchema.parse(tiersValue);
    const matches = tiers.filter((tier) => inputTokens >= tier.min && (tier.max == null || inputTokens < tier.max));
    if (matches.length !== 1) throw new Error(`Expected one ${channel} tier for the estimated input context.`);
    return exactRate(matches[0]!.cost, `${channel}_tiers.cost`);
  }
  return exactRate(pricing[channel], channel);
}

const videoRateSchema = z.array(z.object({
  resolution: z.string().min(1).max(80),
  audio: z.boolean().optional(),
  cost_per_second: z.string(),
}).loose()).max(500);

export type PriceVersionLike = {
  inputNanoUsdPerToken: number | null;
  outputNanoUsdPerToken: number | null;
  operationNanoUsd: number | null;
  pricingData?: PricingData | null;
};

export type QuoteInput = {
  kind: "chat" | "image" | "video" | "website";
  price: PriceVersionLike;
  inputTokens?: number;
  outputTokens?: number;
  durationSeconds?: number;
  pricingResolution?: string;
  generateAudio?: boolean;
};

export function effectivePricing(price: PriceVersionLike): PricingData {
  if (price.pricingData) return price.pricingData;
  return Object.fromEntries(Object.entries({
    input: nanoToDecimal(price.inputNanoUsdPerToken),
    output: nanoToDecimal(price.outputNanoUsdPerToken),
    image: nanoToDecimal(price.operationNanoUsd),
  }).filter((entry): entry is [string, string] => entry[1] != null));
}

/** Exact estimate for one explicitly supported product operation. */
export function quoteExactOperation(input: QuoteInput): { usd: string; exact: ExactDecimal } {
  const pricing = effectivePricing(input.price);
  let exact: ExactDecimal;
  if (input.kind === "chat" || input.kind === "website") {
    const inputTokens = input.inputTokens;
    const outputTokens = input.outputTokens;
    if (!Number.isSafeInteger(inputTokens) || !Number.isSafeInteger(outputTokens) || inputTokens! < 0 || outputTokens! < 0) {
      throw new Error("Token estimates must be bounded nonnegative integers.");
    }
    exact = addExact(
      multiplyExact(tokenRate(pricing, "input", inputTokens!), BigInt(inputTokens!)),
      multiplyExact(tokenRate(pricing, "output", outputTokens!), BigInt(outputTokens!)),
    );
  } else if (input.kind === "image") {
    exact = exactRate(pricing.image, "image");
  } else {
    if (!Number.isSafeInteger(input.durationSeconds) || input.durationSeconds! <= 0 || !input.pricingResolution) {
      throw new Error("Video quotes require an allowed duration and pricing resolution.");
    }
    const rates = videoRateSchema.parse(pricing.video_duration_pricing);
    const audio = input.generateAudio === true;
    const matches = rates.filter((rate) => rate.resolution === input.pricingResolution && (rate.audio ?? false) === audio);
    if (matches.length !== 1) throw new Error("No unique exact video rate matches the requested resolution and audio option.");
    exact = multiplyExact(exactRate(matches[0]!.cost_per_second, "video_duration_pricing.cost_per_second"), input.durationSeconds!);
  }
  return { exact, usd: formatEstimatedUsd(exact) };
}
