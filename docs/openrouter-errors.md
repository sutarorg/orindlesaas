# Errors, retries and uncertain paid work

Source: `lib/server/ai/errors.ts`. Consumers: `openrouter-api.ts`, `chat/service.ts`,
`generations/runners.ts`.

## Failure kinds

```ts
type OpenRouterFailureKind =
  | "bad_request" | "unauthorized" | "insufficient_credit" | "forbidden"
  | "timeout" | "rate_limited" | "provider_unavailable" | "model_unavailable"
  | "content_rejected" | "overloaded" | "malformed_response" | "unknown";
```

`normalizeProviderError` maps a status or streamed error object onto one of these, an Orindle error
code, a status and a customer-safe message. Upstream internals are kept in `providerStatus` /
`providerMessage` for logs only and never returned to a browser.

Two mappings are worth calling out:

- `402` is `insufficient_credit` — the **Orindle account** is out of credits with OpenRouter. It is an
  operator problem, not the customer's, and the public message must not imply the customer's balance is
  empty.
- `insufficient_credit` detected as an *in-flight budget* rejection is reclassified to `rate_limited`,
  because the request was refused before any spend occurred and may legitimately be retried by the
  caller later.

## `retryableReadOnly` — the naming is the safety property

The flag is deliberately **not** called `retryable`:

```ts
retryableReadOnly: boolean;
```

A `500`, `502` or `524` can arrive *after* the upstream provider has accepted and billed the request.
The failure describes the connection to Orindle, not necessarily the absence of spend. Retrying such a
request charges the customer twice for one click.

The name encodes the rule: only read-only calls — catalogue reads, generation lookup, job status polling
— may consult this flag. Paid submissions use `maxRetries: 0` and `streamRetries: 0` and reconcile an
uncertain outcome instead of repeating it.

`withRetry` in `openrouter-api.ts` follows this: it stops on `!normalized.retryableReadOnly`, honours
`Retry-After` as `retryAfterSeconds`, and is only used by read-only paths.

## Streaming errors

OpenRouter can return `HTTP 200` and emit the failure *inside* the stream. `classifyOpenRouterError`
therefore accepts streamed objects as well as HTTP responses.

When chat fails mid-stream, `chat/service.ts` records a usage event of `stream_${kind}` so the failure
is attributable rather than invisible. A mid-stream failure never settles the reservation, even if some
text already reached the user: partial output is not a completed generation, and settling it would
silently charge for a truncated answer.

## Polling errors

For video, a poll error does not fail the job. The job stays `awaiting_provider` and is retried on the
next tick, because polling is read-only and a transient network error says nothing about the generation.

## Terminal outcomes never charge

A terminal non-success (`failed`, `dead`, `cancelled`, `expired`) settles at no charge. A lookup that
cannot be completed keeps the reservation held for reconciliation; it is never converted to a zero-cost
settlement, because "we could not determine the cost" and "the cost was zero" are different facts.

## Verified

- `retryableReadOnly` is true for read-only kinds and never consulted by a paid path.
- A mid-stream error classified as `stream_*` records nothing settleable.
- Poll errors keep `awaiting_provider`.
- Terminal failures charge nothing.

## Related

- How actual cost is established after success: `openrouter-cost-reconciliation.md`
- Streaming chat specifics: `openrouter-chat.md`
