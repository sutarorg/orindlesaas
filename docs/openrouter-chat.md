# Chat on OpenRouter

Source: `lib/server/chat/service.ts`, plus `lib/server/ai/openrouter.ts`.

## Execution

Chat streams through the AI SDK against an OpenRouter model:

```ts
openRouterLanguageModel(modelId, { provider: providerRoutingBody(plan) })
// …streamText({ …, maxRetries: 0, streamRetries: 0 })
```

`maxRetries: 0` and `streamRetries: 0` are not tuning. A stream that fails part-way may already have been
billed upstream; the SDK's default retry would submit a second paid request for one customer click. The
failure is recorded and reconciled instead.

## The generation ID

The ID used for cost lookup comes from **`step.response.id`**, not from a header, a locally generated
value or a guess. That ID is what `GET /api/v1/generation` accepts, so identifying it correctly is the
first link in the chain that ends in an actual charge.

OpenRouter uses `gen-…` (hyphen). Legacy Gateway IDs used `gen_…` (underscore). They are stored in
separate columns and never converted between each other; see `openrouter-cost-reconciliation.md`.

## Errors

OpenRouter can return `HTTP 200` and emit the failure inside the stream. `onError` therefore classifies
the streamed error via `classifyOpenRouterError` and records a usage event of `stream_${kind}`.

A mid-stream failure **never settles** the reservation, even if the user already received some text.
Partial output is not a completed generation; settling it would charge for a truncated answer.

## Quotes

A chat quote requires both `prompt` and `completion` rates from the approved endpoints, taken at their
maximum across endpoints (fallbacks are enabled by default upstream). Any missing dimension makes the
model unquotable rather than cheaply estimated.

## Verified

- Chat quotes bound to the dearest approved endpoint and mirrored into `max_price`.
- A text model appears in the customer selector for `chat` **and** `website`.
- Disabling or unapproving its endpoints removes it from the selector immediately.
- A mid-stream error produces no settlement.

Total token counts are estimate-only inputs; only the provider's `total_cost` is an actual.
