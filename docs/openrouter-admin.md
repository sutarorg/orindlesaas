# Admin: endpoint approval and the enablement gate

Sources: `lib/server/admin/queries.ts`, `lib/server/admin/mutations.ts`, `lib/server/ai/models.ts`.

## The new two-step approval

On Gateway, a model was selectable once it had a current price row. On OpenRouter a model is only
sellable if some provider endpoint is **approved, enabled and priced**, so administration is two steps:

1. **Approve endpoints.** Each endpoint row shows provider name and slug, its exact rates, and whether it
   is approved and enabled.
2. **Enable the model.** `assertModelCanBeEnabled` now refuses to enable an OpenRouter model that has no
   approved endpoint, with:

   > Approve and enable at least one priced serving endpoint before enabling this model.

Without that check an operator could enable a model whose every generation then fails at quote time,
because `resolveGenerationModel` correctly refuses to price an endpoint-less model. A model that appears
selectable and always fails is worse than one that is visibly not ready.

Two further gates had the same flaw and were fixed together:

- The enablement check itself still demanded a `model_prices` row, so an OpenRouter model with an
  approved, priced endpoint was refused with "a current exact price is required".
- Editing the compatibility policy of an **enabled** model validated against `model_prices` alone, so
  changing durations or resolutions on a live model always returned `409`.

Both now go through `validateModelQuote`, which quotes the model the same way a real generation does:
through its approved endpoints for OpenRouter, through the price row for historical Gateway models.

The publisher must also be enabled; the wording changed from "provider" to "publisher" to match
OpenRouter's model, where a model author publishes models that providers serve.

## Dashboard additions

`endpointTable` lists, per endpoint: model, endpoint (provider name), prompt rate, completion rate,
approved, enabled, last seen. Two metrics were added:

- **Approved endpoints**
- **Endpoints awaiting approval**

and the models table gained an **Endpoints** column showing `approved/total`, so the operator's queue is
visible without opening each model.

## Price validation

`validateModelPrice` still runs an end-to-end quote through `quoteForProduct` rather than checking fields
in isolation: a price is valid only if it can actually quote the product exactly. That remains the
strongest available check, and it now shares its code path with the real quote.

Note the asymmetry, deliberately kept: `validateModelPrice` validates a **manual price row**, while
endpoint pricing is validated by the same quote machinery from endpoint rates. Both fail closed.

## What admin cannot do

- Approve a model automatically, or approve what sync discovered. Discovery never approves anything.
- Bypass the endpoint requirement by enabling a model first.
- Choose a provider from the browser. Routing is server-side only.

## Related

- Discovery that populates the queue: `openrouter-catalog-sync.md`
- Rate semantics shown to operators: `openrouter-pricing.md`
