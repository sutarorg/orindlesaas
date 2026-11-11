# OpenRouter provider client

Source: `lib/server/ai/openrouter.ts`. Replaces the deleted `lib/server/ai/gateway.ts`.

## Package and compatibility

`@openrouter/ai-sdk-provider@3.1.0`, peer-compatible with `ai@7` and `zod@4`. The repository pins
`ai@7.0.163` and `zod@4.6.7`, and requires Node 22 or newer.

The provider is created lazily and cached per process. `resetOpenRouterProvider()` clears the cache so
tests and key rotation do not hold a stale client.

```ts
getOpenRouterProvider(): OpenRouterProvider
openRouterLanguageModel(modelId: string, routing?: { provider?: Record<string, unknown> })
resetOpenRouterProvider(): void
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
```

`openRouterLanguageModel` takes the routing fragment produced by `planRouting`. The settings object is
typed loosely by the provider package; routing is always assembled server-side from database state and
is never accepted from a caller.

## One key, server-only

`OPENROUTER_API_KEY` is read through `lib/server/env.ts` and is server-only. It is never prefixed
`NEXT_PUBLIC_`, never returned to a browser, and never placed in a client bundle, error message or log
line. `makePublicError` strips provider internals before a customer sees anything.

The common image and video discovery endpoints are public: they serve the same catalogue to anonymous
callers. `requestJson` therefore accepts `publicRead: true`, which omits the bearer token for those
reads. This matters operationally — catalogue discovery and QA work without credentials, so a missing
key degrades discovery rather than breaking the admin dashboard.

Anything that spends money requires the key: generation, `GET /api/v1/generation` cost lookup, and
endpoint-enriched catalogue reads.

## Why HTTP is used for media, not the SDK

The SDK's `imageModel` and `videoModel` helpers were evaluated and rejected:

- **Image:** `imageModel` discards the response's `media_type` and the `usage.cost` object. Orindle
  validates the returned bytes against their magic signature and needs the declared media type to do
  it; dropping it would mean guessing how to decode the payload.
- **Video:** `videoModel` blocks until completion (up to ten minutes). Video generation must return a
  job handle and poll, so a request cannot be pinned to a worker for that long.

Both paths therefore call the documented HTTP endpoints directly in `lib/server/ai/openrouter-api.ts`.
Language generation (chat, website builder) uses the SDK.

## Related

- Catalogue and endpoint discovery: `openrouter-catalog-sync.md`
- Errors, retries and `retryableReadOnly`: `openrouter-errors.md`
- Key handling and exposure rules: `openrouter-security.md`
