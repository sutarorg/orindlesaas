# Endpoint-aware exact pricing

Sources: `lib/server/ai/routing.ts`, `lib/server/ai/models.ts`, `lib/server/ai/pricing.ts`.

## The rule

**A quote is the worst-case cost across every endpoint that could serve the request.**

OpenRouter defaults `allow_fallbacks` to `true`: one request may be served by any approved endpoint.
If the quote used the cheapest endpoint while a fallback served the request at a higher rate, Orindle
would under-charge and absorb the difference. So the quote takes the maximum rate per dimension across
approved endpoints, and that same figure is sent upstream as `provider.max_price` so the provider
cannot spend more than the customer was quoted.

A pinned endpoint is the exception: with `allow_fallbacks: false` the bound is exactly the pinned
rate.

Consequences, all intentional:

- Any dimension missing from any approved endpoint makes the model unquotable (`null`), not
  optimistically priced.
- No approved endpoint produces `AppError conflict 409`, never a zero or estimated price.
- A quote is never a guess dressed as a number.

## Money is never a float

Rates are decimal strings (`"0.000004"`). Sums and comparisons go through `ExactDecimal`
(`{ units: bigint, scale: number }`), and conversion back to text is a string operation. A rate of
`0.0000123456789` round-trips as `"0.00001235"` — truncated at the documented precision, never via a
`Number` constructor that could introduce binary error.

`worstCaseRates` returns `Record<string, string>` or `null`. `null` means "cannot be bounded", which
callers must treat as unquotable.

### Scale alignment

`addExactStrings` and the comparison helpers align scales before operating, through private
`alignExact` and `compareExact`. This is not incidental.

The operator price **ceiling** originally compared raw `units` across differing scales. Two decimals
`0.5` and `0.000009` have units `5` and `9`; compared raw, the ceiling of `0.5` looked *smaller* than
the rate `0.000009`, so the ceiling **widened** the bound instead of tightening it. An operator setting
a spending ceiling could have made Orindle quote more than the ceiling allowed.

The ceiling is now scale-aware and can only ever tighten a bound. See `openrouter-lessons.md`.

## Per-product rate selection

An endpoint declares different dimensions for different products, and a product must not be blocked
by a dimension belonging to another product:

| Product | Rate keys accepted | Notes |
|---|---|---|
| Chat, Website | `prompt`, `completion` | Both required. |
| Image | `output_image`, else `image` | Billed per generated image. |
| Video | `per_video_second`, `per-video-second` | Billed per second of output; a tiered SKU such as `per-video-second-1080p` is also selected as the maximum. |

Requiring `prompt` for an image endpoint produced a real, silent failure: every image model became
unquotable because image endpoints have no prompt rate. Each product now selects only the dimensions it
uses.

## Video resolution labels

OpenRouter prices video per second and labels resolutions as quality tiers: `720p`, `1080p`, `2K`,
`4K`. Two Gateway-era assumptions had to change:

1. `lib/contracts/catalog.ts` accepted resolutions only as pixel dimensions (`WxH`), so a `"720p"`
   policy failed validation with "the reviewed compatibility policy is invalid". The schema now accepts
   both a pixel size and a quality label.
2. The quote engine resolved a label through `parameters.resolutionPricing[resolution]`, a Gateway SKU
   mapping that OpenRouter endpoints do not have. The label is now used directly when no mapping
   exists, and the `resolutionPricing` requirement is enforced only for historical Gateway rows.

The pricing map is built per approved label, so a caller selecting `720p` finds an exact rate rather
than a placeholder.

## Verified end to end

Against real PostgreSQL, with one model served by `CheapServe` (`0.000001` / `0.000003`) and
`DearServe` (`0.000004` / `0.000009`):

- A 400-token prompt with a 100-token output quota quoted **`0.00130000`** — computed from the
  *dearest* endpoint, with `maximumRates` and `maxPrice` both `{prompt: "0.000004", completion:
  "0.000009"}` and `allowFallbacks: true`.
- An image endpoint at `0.05` per image quoted **`0.05000000`**.
- A video endpoint at `0.5` per second, five seconds, quoted **`2.50000000`**.
- An unapproved endpoint did not quote at all: `AppError conflict 409`.

## Related

- Routing body and pinning: `openrouter-routing.md`
- Turning actual cost into credits: `openrouter-cost-reconciliation.md`
- Admin price validation: `openrouter-admin.md`
