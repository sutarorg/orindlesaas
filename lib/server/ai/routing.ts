import { parseExactDecimal, addExact, type ExactDecimal } from "@/lib/server/ai/pricing";

/**
 * Provider routing policy — the financial heart of the migration.
 *
 * OpenRouter defaults `allow_fallbacks` to true, so one request can be served by any of several
 * endpoints at *different* prices. If Orindle quoted the cheapest endpoint and the request landed on
 * the dearest one, the reservation would be too small and the customer would settle into
 * reconciliation on ordinary traffic. That is the specific failure this module exists to prevent.
 *
 * The rule: a quote is the worst-case unit price across every endpoint routing may select, and the
 * same figure is then sent upstream as `provider.max_price`, so the provider cannot spend more than
 * Orindle reserved. Pricing is therefore bounded from both ends by one number.
 */
export type EndpointPrice = {
  /** Human-readable serving provider (e.g. "OpenAI", "Together"). Never the model author. */
  providerName: string;
  providerSlug: string | null;
  /** Per-token or per-unit rates as exact decimal strings, keyed by the dimension they price. */
  rates: Record<string, string>;
};

export type RoutingPlan = {
  /** `only` allowlist sent upstream. Empty means "any approved endpoint". */
  only: string[];
  /** Whether OpenRouter may fall back to another approved endpoint. */
  allowFallbacks: boolean;
  /** Worst-case unit rates the quote was computed from, keyed by dimension. */
  maximumRates: Record<string, string>;
  /** `max_price` body fragment mirroring `maximumRates`, or null when unbounded. */
  maxPrice: Record<string, string> | null;
  /** Why this plan was chosen; persisted for audit. */
  reason: string;
};

/** Aligns two exact decimals to a shared scale; never converts through a float. */
function alignExact(a: ExactDecimal, b: ExactDecimal): [bigint, bigint, number] {
  const scale = Math.max(a.scale, b.scale);
  return [
    a.units * 10n ** BigInt(scale - a.scale),
    b.units * 10n ** BigInt(scale - b.scale),
    scale,
  ];
}

function compareExact(a: ExactDecimal, b: ExactDecimal): number {
  const [left, right] = alignExact(a, b);
  return left < right ? -1 : left > right ? 1 : 0;
}

function maxExact(a: ExactDecimal, b: ExactDecimal): ExactDecimal {
  const [left, right, scale] = alignExact(a, b);
  return left >= right ? { units: left, scale } : { units: right, scale };
}

function formatExact(value: ExactDecimal): string {
  const negative = value.units < 0n;
  const absolute = negative ? -value.units : value.units;
  if (value.scale === 0) return `${negative ? "-" : ""}${absolute}`;
  const digits = absolute.toString().padStart(value.scale + 1, "0");
  const whole = digits.slice(0, digits.length - value.scale);
  const fraction = digits.slice(digits.length - value.scale).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

/**
 * Worst-case rate for each priced dimension across the endpoints that may serve the request.
 * Returns null when any endpoint is missing a rate for a dimension another endpoint prices, because
 * that gap could hide an unbounded cost.
 */
export function worstCaseRates(endpoints: EndpointPrice[]): Record<string, string> | null {
  if (endpoints.length === 0) return null;
  const dimensions = new Set<string>();
  for (const endpoint of endpoints) for (const key of Object.keys(endpoint.rates)) dimensions.add(key);
  const result: Record<string, string> = {};
  for (const dimension of dimensions) {
    let best: ExactDecimal | null = null;
    for (const endpoint of endpoints) {
      const raw = endpoint.rates[dimension];
      // A missing dimension on one endpoint is a hole in the bound, not a zero.
      if (raw == null) return null;
      let exact: ExactDecimal;
      try {
        exact = parseExactDecimal(raw);
      } catch {
        return null;
      }
      if (exact.units < 0n) return null;
      best = best === null ? exact : maxExact(best, exact);
    }
    if (best) result[dimension] = formatExact(best);
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Builds the server-side routing plan for a model's approved endpoints.
 *
 * `pinnedSlug` is used only when an administrator has explicitly restricted a model to one endpoint;
 * in that case fallbacks are disabled so the pinned price is the only price that can be charged.
 */
export function planRouting(input: {
  endpoints: EndpointPrice[];
  pinnedSlug?: string | null;
  /** Absolute ceiling the operator is willing to pay per unit, as an exact decimal string. */
  priceCeiling?: Record<string, string> | null;
}): RoutingPlan | null {
  const approved = input.pinnedSlug
    ? input.endpoints.filter((endpoint) => endpoint.providerSlug === input.pinnedSlug)
    : input.endpoints;
  if (approved.length === 0) return null;

  const maximumRates = worstCaseRates(approved);
  if (!maximumRates) return null;

  // An operator ceiling can only tighten the bound; it can never loosen it above the worst case.
  const maxPrice: Record<string, string> = {};
  for (const [dimension, rate] of Object.entries(maximumRates)) {
    const ceiling = input.priceCeiling?.[dimension];
    if (ceiling == null) { maxPrice[dimension] = rate; continue; }
    let ceilingExact: ExactDecimal;
    try { ceilingExact = parseExactDecimal(ceiling); } catch { return null; }
    const rateExact = parseExactDecimal(rate);
    // Compare at a shared scale. Comparing raw `units` would treat 0.5 (units 5, scale 1) as
    // smaller than 0.000009 (units 9, scale 6) and silently widen the bound instead of tightening it.
    maxPrice[dimension] = formatExact(compareExact(ceilingExact, rateExact) < 0 ? ceilingExact : rateExact);
  }

  return {
    only: approved.flatMap((endpoint) => (endpoint.providerSlug ? [endpoint.providerSlug] : [])),
    // A pinned endpoint must not fall back, or the pin is meaningless.
    allowFallbacks: !input.pinnedSlug,
    maximumRates,
    maxPrice,
    reason: input.pinnedSlug
      ? `Pinned to endpoint "${input.pinnedSlug}" by administrator policy; fallbacks disabled.`
      : `Worst-case rates across ${approved.length} approved endpoint(s); fallbacks bounded by max_price.`,
  };
}

/**
 * The `provider` fragment sent upstream. Deliberately contains only fields Orindle controls:
 * no client input reaches this object.
 */
export function providerRoutingBody(plan: RoutingPlan) {
  return {
    ...(plan.only.length > 0 ? { only: plan.only } : {}),
    allow_fallbacks: plan.allowFallbacks,
    // Bound every billable dimension so the upstream spend cannot exceed the reservation.
    max_price: plan.maxPrice,
  };
}

/** Sums exact decimal strings without touching floating point. */
export function addExactStrings(values: string[]): string {
  const total = values.reduce<ExactDecimal | null>((accumulator, value) => {
    const exact = parseExactDecimal(value);
    return accumulator === null ? exact : addExact(accumulator, exact);
  }, null);
  return total === null ? "0" : formatExact(total);
}
