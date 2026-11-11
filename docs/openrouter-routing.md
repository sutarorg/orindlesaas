# Routing: server-only provider selection

Source: `lib/server/ai/routing.ts`.

## Why routing is a safety mechanism, not a convenience

Because OpenRouter falls back by default, one customer request can be served by any of several
providers at different prices. Unmanaged, that means the price Orindle quoted and the price it pays can
diverge — and the customer is the party that cannot see it coming.

Routing is therefore decided entirely on the server from database state:

1. Collect approved, enabled endpoints for the model.
2. Compute the maximum rate per dimension across them (`worstCaseRates`).
3. Emit `provider` settings with `only` (the approved slugs), `allow_fallbacks` and `max_price`.

A browser never supplies a provider, a slug or a routing plan. There is no API surface that accepts one,
so a customer cannot steer a request toward a cheaper provider that would under-bill, nor toward an
expensive one to force a loss.

## The routing body

```ts
providerRoutingBody(plan) // {
//   only: string[]            // approved endpoint slugs, omitted when empty
//   allow_fallbacks: boolean
//   max_price: Record<string, string>   // mirrors the quoted worst case
// }
```

`max_price` is the enforcement point. The quote and the ceiling are computed from the same maximum
rates, so the provider physically cannot spend more than the customer was charged for. When the model
is pinned, `allow_fallbacks` is `false` and the bound is the pinned endpoint's own rate.

`planRouting` returns the plan plus a human-readable `reason`, which the admin dashboard shows so an
operator can see why a model is bounded the way it is.

## Pinning

A model's `routingPlan.pinnedSlug` pins one endpoint. Pinning is an operator decision, used when quality
or behaviour must not vary between requests. It narrows the quote: a pinned plan does not need to cover
the worst case across endpoints, only the pinned rate.

## Failure modes

| Situation | Result |
|---|---|
| No approved, enabled endpoint | `AppError conflict 409` — "cannot be used for a paid generation" |
| Missing dimension on any approved endpoint | unquotable (`null`) — not an estimate |
| Operator ceiling set | bound is tightened, never widened (scale-aware comparison) |
| Pinned slug no longer approved | no plan; the model cannot be quoted until an operator resolves it |

## Verified

With two approved endpoints at `0.000001/0.000003` and `0.000004/0.000009`, the plan pinned neither,
listed both slugs, kept `allowFallbacks: true`, and set both `maximumRates` and `maxPrice` to
`{prompt: "0.000004", completion: "0.000009"}`. The quote matched that bound exactly.

## Related

- How the bound becomes a quote: `openrouter-pricing.md`
- Why the ceiling comparison had to be rewritten: `openrouter-lessons.md`
