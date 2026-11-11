import { describe, expect, it } from "vitest";
import { addExactStrings, planRouting, providerRoutingBody, worstCaseRates, type EndpointPrice } from "@/lib/server/ai/routing";
import { classifyOpenRouterError, normalizeProviderError, openRouterErrorFromBody } from "@/lib/server/ai/errors";

/**
 * Routing is where a migration like this quietly loses money.
 *
 * OpenRouter defaults `allow_fallbacks` to true and each endpoint prices differently, so quoting the
 * cheapest route while permitting fallbacks means the request can land on a dearer one and the
 * reservation is too small. The tests below pin the rule that closes that gap.
 */
const endpoint = (providerName: string, providerSlug: string | null, rates: Record<string, string>): EndpointPrice =>
  ({ providerName, providerSlug, rates });

describe("worst-case rate derivation", () => {
  it("takes the maximum across endpoints, not the first or the cheapest", () => {
    const rates = worstCaseRates([
      endpoint("Cheap", "cheap", { prompt: "0.000001", completion: "0.000002" }),
      endpoint("Dear", "dear", { prompt: "0.000004", completion: "0.000009" }),
      endpoint("Middle", "middle", { prompt: "0.000003", completion: "0.000005" }),
    ]);
    expect(rates).toEqual({ prompt: "0.000004", completion: "0.000009" });
  });

  it("compares exact decimals rather than string lengths or parse order", () => {
    // 0.0000009 < 0.000001, despite being a longer string.
    expect(worstCaseRates([
      endpoint("A", "a", { prompt: "0.0000009" }),
      endpoint("B", "b", { prompt: "0.000001" }),
    ])).toEqual({ prompt: "0.000001" });
  });

  it("refuses to bound a route when one endpoint has no price for a dimension", () => {
    // A missing dimension is a hole in the bound, not a zero: the other endpoint could hide any cost.
    expect(worstCaseRates([
      endpoint("Priced", "priced", { prompt: "0.000001", completion: "0.000002" }),
      endpoint("Gappy", "gappy", { prompt: "0.000001" }),
    ])).toBeNull();
  });

  it("rejects negative and unparseable rates", () => {
    expect(worstCaseRates([endpoint("Bad", "bad", { prompt: "-1" })])).toBeNull();
    expect(worstCaseRates([endpoint("Bad", "bad", { prompt: "free" })])).toBeNull();
    expect(worstCaseRates([])).toBeNull();
  });

  it("preserves precision through the maximum", () => {
    expect(worstCaseRates([endpoint("A", "a", { prompt: "0.000000000123456789" })])).toEqual({ prompt: "0.000000000123456789" });
  });
});

describe("routing plans", () => {
  const endpoints = [
    endpoint("Cheap", "cheap", { prompt: "0.000001", completion: "0.000002" }),
    endpoint("Dear", "dear", { prompt: "0.000004", completion: "0.000009" }),
  ];

  it("allows fallbacks only within the worst-case bound", () => {
    const plan = planRouting({ endpoints })!;
    expect(plan.allowFallbacks).toBe(true);
    expect(plan.maximumRates).toEqual({ prompt: "0.000004", completion: "0.000009" });
    // The same figure is sent upstream, so the provider cannot exceed what was reserved.
    expect(plan.maxPrice).toEqual({ prompt: "0.000004", completion: "0.000009" });
    expect(plan.only).toEqual(["cheap", "dear"]);
  });

  it("disables fallbacks when an administrator pins one endpoint", () => {
    const plan = planRouting({ endpoints, pinnedSlug: "cheap" })!;
    expect(plan.allowFallbacks).toBe(false);
    expect(plan.only).toEqual(["cheap"]);
    // A pin makes the pinned price the only reachable price, so the bound is that endpoint's rate.
    expect(plan.maximumRates).toEqual({ prompt: "0.000001", completion: "0.000002" });
  });

  it("returns null for a pin that matches no approved endpoint", () => {
    expect(planRouting({ endpoints, pinnedSlug: "does-not-exist" })).toBeNull();
  });

  it("lets an operator ceiling tighten the bound but never loosen it", () => {
    const tighter = planRouting({ endpoints, priceCeiling: { prompt: "0.000002", completion: "0.5" } })!;
    expect(tighter.maxPrice).toEqual({ prompt: "0.000002", completion: "0.000009" });
  });

  it("returns null when no safe maximum exists", () => {
    expect(planRouting({ endpoints: [] })).toBeNull();
    expect(planRouting({ endpoints: [endpoint("Gappy", "gappy", { prompt: "0.1", completion: "0.2" }), endpoint("Partial", "partial", { prompt: "0.1" })] })).toBeNull();
  });

  it("emits a provider body with no client-supplied fields", () => {
    const body = providerRoutingBody(planRouting({ endpoints })!);
    expect(Object.keys(body).sort()).toEqual(["allow_fallbacks", "max_price", "only"]);
  });
});

describe("exact decimal summation", () => {
  it("adds without floating-point drift", () => {
    // 0.1 + 0.2 in floating point is 0.30000000000000004.
    expect(addExactStrings(["0.1", "0.2"])).toBe("0.3");
    expect(addExactStrings(["0.00000001", "0.00000002"])).toBe("0.00000003");
    expect(addExactStrings([])).toBe("0");
  });
});

describe("error normalisation", () => {
  it("reads the documented error envelope", () => {
    expect(openRouterErrorFromBody({ error: { code: 402, message: "Insufficient credits" } }))
      .toEqual({ code: 402, message: "Insufficient credits", limitSource: undefined });
    expect(openRouterErrorFromBody({ nope: true })).toBeNull();
  });

  it("maps the documented status codes to honest categories", () => {
    expect(normalizeProviderError({ status: 400 })).toMatchObject({ kind: "bad_request", retryableReadOnly: false });
    expect(normalizeProviderError({ status: 401 })).toMatchObject({ kind: "unauthorized", retryableReadOnly: false });
    expect(normalizeProviderError({ status: 402 })).toMatchObject({ kind: "insufficient_credit", retryableReadOnly: false });
    expect(normalizeProviderError({ status: 429 })).toMatchObject({ kind: "rate_limited", retryableReadOnly: true });
    expect(normalizeProviderError({ status: 502 })).toMatchObject({ kind: "provider_unavailable", retryableReadOnly: true });
    expect(normalizeProviderError({ status: 503 })).toMatchObject({ kind: "provider_unavailable", retryableReadOnly: true });
    expect(normalizeProviderError({ status: 524 })).toMatchObject({ kind: "timeout" });
    expect(normalizeProviderError({ status: 529 })).toMatchObject({ kind: "overloaded", retryableReadOnly: true });
  });

  it("exposes retry permission for reads only, never a blanket `retryable` flag", () => {
    // The field is named `retryableReadOnly` precisely so it cannot be reached for from a paid
    // submission: a 500/502/524 can arrive after the provider has already billed the request.
    const normalized = normalizeProviderError({ status: 502 });
    expect(normalized).not.toHaveProperty("retryable");
    expect(normalized.retryableReadOnly).toBe(true);
  });

  it("marks a definite pre-flight rejection as non-retryable", () => {
    for (const status of [400, 401, 402, 403, 404]) {
      expect(normalizeProviderError({ status }).retryableReadOnly).toBe(false);
    }
  });

  it("allows a bounded read retry only for transient conditions", () => {
    for (const status of [429, 500, 502, 503, 524, 529]) {
      expect(normalizeProviderError({ status }).retryableReadOnly).toBe(true);
    }
  });

  it("treats the in-flight-budget 402 as retryable, but a plain 402 as not", () => {
    expect(normalizeProviderError({ status: 402 })).toMatchObject({ kind: "insufficient_credit", retryableReadOnly: false });
    expect(normalizeProviderError({
      body: { error: { code: 402, message: "budget", metadata: { limit_source: "openrouter_in_flight_budget" } } },
    })).toMatchObject({ kind: "rate_limited", retryableReadOnly: true });
  });

  it("distinguishes a content rejection from a permission failure on 403", () => {
    expect(normalizeProviderError({ status: 403, body: { error: { code: 403, message: "Request blocked: moderation" } } }))
      .toMatchObject({ kind: "content_rejected" });
    expect(normalizeProviderError({ status: 403, body: { error: { code: 403, message: "Management key does not have permission" } } }))
      .toMatchObject({ kind: "forbidden" });
  });

  it("honours Retry-After when supplied and ignores nonsense values", () => {
    expect(normalizeProviderError({ status: 429, headers: new Headers({ "retry-after": "60" }) }).retryAfterSeconds).toBe(60);
    expect(normalizeProviderError({ status: 429, headers: new Headers({ "retry-after": "soon" }) }).retryAfterSeconds).toBeUndefined();
    expect(normalizeProviderError({ status: 429, headers: new Headers({ "retry-after": "999999" }) }).retryAfterSeconds).toBeUndefined();
  });

  it("never leaks an upstream message into the public field", () => {
    const normalized = normalizeProviderError({
      status: 502,
      body: { error: { code: 502, message: "upstream sk-abc123 failed at internal-host-7" } },
    });
    expect(normalized.publicMessage).not.toMatch(/sk-abc123|internal-host-7/);
    // The raw detail is retained for logs only.
    expect(normalized.providerMessage).toMatch(/sk-abc123/);
  });

  it("classifies a thrown SDK error by its status code", () => {
    const error = Object.assign(new Error("boom"), { name: "APICallError", statusCode: 429, responseHeaders: { "retry-after": "5" } });
    expect(classifyOpenRouterError(error)).toMatchObject({ kind: "rate_limited", retryableReadOnly: true, retryAfterSeconds: 5 });
  });

  it("classifies an abort as a timeout rather than a provider failure", () => {
    const aborted = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    expect(classifyOpenRouterError(aborted)).toMatchObject({ kind: "timeout" });
  });

  it("parses a string response body to find the documented envelope", () => {
    const error = Object.assign(new Error("bad"), { name: "APICallError", statusCode: 502, responseBody: JSON.stringify({ error: { code: 402, message: "Insufficient credits" } }) });
    expect(classifyOpenRouterError(error)).toMatchObject({ kind: "insufficient_credit" });
  });
});
