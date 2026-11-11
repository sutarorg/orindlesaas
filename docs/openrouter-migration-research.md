# OpenRouter migration — research findings

Phase 1 output. Every claim below was verified against the live OpenRouter documentation, the
published npm metadata, or the installed package tarball at the time of writing. Where a claim
could not be verified, it is marked **unverified** rather than assumed.

## 1. What the baseline actually is

Verified by reading the repository, not by trusting the brief:

| Claim in the brief | Reality in the repository |
|---|---|
| Background jobs: Inngest | **Already removed.** Replaced by the in-process outbox runner and `GET /api/v1/jobs/tick`. Nothing to migrate. |
| Rate limiting: Upstash | **Already removed.** Replaced by the `rate_limits` Postgres table. Nothing to migrate. |
| AI provider: Vercel AI Gateway | Present, and the subject of this migration. |
| Website deployment: Vercel API | Present. **Untouched by this migration.** `VERCEL_API_TOKEN` stays. |

Baseline at commit `517d97f`: `tsc --noEmit` clean, ESLint clean, 177 unit tests across 34 files
passing, production build succeeds. Integration suite requires a live PostgreSQL and is gated by
`DATABASE_URL` + `QA_DISPOSABLE`; it is not part of the default `npm run check`.

Gateway touch points located by exhaustive search (not just the filenames in the brief):
`lib/server/ai/{gateway,models,pricing,catalog-sync,compatibility}.ts`,
`lib/server/{chat/service,generations/runners,generations/service,credits/ledger}`,
`lib/server/admin/{queries,mutations}.ts`, `lib/server/{db/schema,env}.ts`,
`lib/server/jobs/{runner,recovery}.ts`, `scripts/{catalog-sync.mts,setup-guided.ts}`,
`app/(site)/privacy/page.tsx`, several dashboard components, and six test files.

## 2. SDK compatibility — verified from the npm registry

`@openrouter/ai-sdk-provider` dist-tags at time of writing: `latest = 3.1.0`.

| Version | Peer `ai` | Peer `zod` | Node |
|---|---|---|---|
| 2.x | `^6.0.0` | `^3.25.0 \|\| ^4.0.0` | `>=18` |
| **3.1.0** | **`^7.0.0`** | **`^3.25.76 \|\| ^4.1.8`** | **`>=22`** |

The repository has `ai@^7.0.163`, `zod@^4.6.7`, `engines.node >=22.13.0`. Version 3.1.0 is
therefore the correct and only major that fits. **No upgrade of `ai`, `react`, `next` or `zod` is
required or performed.** This is the single most useful finding: the migration is additive.

Package exports are ESM-only (`"./dist/index.js"`, no CJS entry). The project is ESM-native
through Next 16, and `vitest` resolves it; nothing needs a `require` shim.

## 3. Chat / text generation contract

Source: `https://openrouter.ai/docs/api_reference/overview`, and the installed tarball.

- `POST /api/v1/chat/completions`, OpenAI-shaped. `Authorization: Bearer <key>`.
- The SDK's `OpenRouterChatLanguageModel.doGenerate` returns
  `response: { id, modelId, headers, body }`. **`response.id` is the OpenRouter generation ID.**
  This is the documented path to the ID used for cost lookup — there is no
  `providerMetadata.gateway.generationId` equivalent, and the brief is correct to warn about that.
- `providerMetadata.openrouter` contains `{ provider, reasoning_details?, usage }` where `usage` is
  `OpenRouterUsageAccounting`: `promptTokens`, `completionTokens`, `totalTokens`, optional
  `cost: number`, optional `costDetails.upstreamInferenceCost`, optional
  `promptTokensDetails.cachedTokens`, `completionTokensDetails.reasoningTokens`.
- Usage accounting is included by **default** on this provider (the AI SDK `includeUsage` flag is
  not needed; the provider always requests it).
- Streaming: `doStream` exists and carries the same `response.id` metadata.

**Financial consequence:** `usage.cost` is a JavaScript `number`. Per the brief's own rule (never
trust a float for a financial figure) it is treated as *evidence*, not as the ledger amount. The
authoritative amount comes from the generation lookup (§5). `cost` is persisted only in the raw
usage JSON for audit.

## 4. Model catalogue contract

Source: `https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties`.

- `GET /api/v1/models`. Query params verified: `offset` (default 0), `limit` (default 500, **max
  1000**), `output_modalities` (comma list of `text,image,embeddings,audio,video,rerank,decisions,
  speech,transcription`, or `all`; **defaults to `text` only**), `input_modalities`, `endpoints`,
  `supported_parameters`, `category`, `sort`, `q`, `context`, `min_price`/`max_price`, and more.
- Because the default is `text`, image, video and other non-text models are **invisible unless
  `output_modalities` is set explicitly**. The brief is correct on this point, and it matters:
  a naive URL swap would silently empty Image Studio and Video Studio.
- Pagination is offset/limit, not cursor. With `limit` omitted the full list is returned, but the
  safe and documented approach is explicit paging. Max page size is 1000.
- Model fields used: `id` (canonical `author/slug`), `name`, `description`, `created`,
  `architecture.{input_modalities,output_modalities}`, `context_length`, `pricing`,
  `supported_parameters`, `top_provider`.
- Endpoint discovery: `GET /api/v1/models/{author}/{slug}/endpoints`.

## 5. Generation lookup — the ID format trap

Source: `https://openrouter.ai/docs/api/api-reference/generations/get-request-&-usage-metadata-for-a-generation`.

- `GET /api/v1/generation?id=<id>`.
- Response `data` includes: `id` (example `gen-3bhGkxlo4XFrqiabUM7NDtwDzWwG`), `model`,
  `provider_name`, `total_cost`, `usage`, `upstream_inference_cost`, `native_tokens_prompt`,
  `native_tokens_completion`, `native_tokens_cached`, `native_tokens_reasoning`, `created_at`,
  `finish_reason`, `cancelled`, `is_byok`.
- Documented errors: 400, 401, 402, 403, 404, 429, 500, 502, 524, 529.

**Critical difference:** OpenRouter generation IDs are `gen-` (**hyphen**). Vercel AI Gateway used
`gen_` (**underscore**). The existing `lookupActualGenerationCost` validates
`/^gen_[A-Za-z0-9_-]{4,160}$/` and would reject **every** OpenRouter ID with a `RangeError`, which
the settlement path would swallow into `reconciliation_required` for every single generation.
Renaming the function without changing the validator would have produced a silent, total metering
failure that only shows up as unreconciled jobs — and no unit test would have caught it, because
the tests assert on the Gateway format. This is the highest-value finding of the research phase.

Timing: the docs do not guarantee the record exists at the instant the stream ends. Settlement
therefore must tolerate a short "not yet available" window instead of immediately declaring
reconciliation. Combined with the fact that a video job returns its `generation_id` only at
completion, the settlement path needs a bounded retry that treats "absent" as *retry*, and only
turns into *reconcile* after the window closes or the provider reports a hard failure.

## 6. Image generation

Source: `https://openrouter.ai/docs/guides/overview/multimodal/image-generation`.

- Discovery: `GET /api/v1/images/models`, per-endpoint `GET /api/v1/images/models/{author}/{slug}/endpoints`.
- Generation: `POST /api/v1/images`.
- Response: `{ created, data: [{ b64_json, media_type? }], usage: { prompt_tokens,
  completion_tokens, total_tokens, cost } }`.
- Output is **base64 bytes**, not a URL. `media_type` may be absent; non-PNG formats (JPEG, WebP,
  SVG) must be handled. Endpoint pricing is a list of billable lines:
  `{ billable: "output_image"|"input_image"|"input_reference", unit: "image"|"megapixel"|"token",
  cost_usd, variant? }`.
- Supported parameters are capability descriptors: `enum` / `range` / `boolean`. An absent key means
  unsupported by that endpoint.

SDK reality (from the tarball, `OpenRouterImageModel.doGenerate`): it returns
`images: string[]` of **base64** and `usage: { inputTokens, outputTokens, totalTokens }` — it
**discards `media_type` and `usage.cost`**. Therefore the image money path uses the native
`POST /api/v1/images` through a server-only adapter, exactly as the brief permits. Using the SDK
here would lose both the MIME type (needed for correct R2 storage) and the cost evidence.

## 7. Video generation

Source: `https://openrouter.ai/docs/guides/overview/multimodal/video-generation`.

- `POST /api/v1/videos` → `{ id, polling_url, status, generation_id? }` (asynchronous).
- `GET /api/v1/videos/{id}` → `{ id, status, unsigned_urls?, usage: { cost, is_byok }, error?,
  generation_id? }`. Terminal statuses observed in the SDK schema: `completed`, `failed`, `dead`,
  `cancelled`, `expired`, plus interim `pending`/in progress.
- `GET /api/v1/videos/{id}/content` for the media itself.
- Model capabilities: `supported_durations`, `supported_resolutions`, `supported_aspect_ratios`,
  `supported_sizes`, `pricing_skus` (e.g. `per-video-second`, `per-video-second-1080p`),
  `allowed_passthrough_parameters`.
- The SDK's `OpenRouterVideoModel.doGenerate` **blocks internally with `pollUntilComplete`
  (default 10-minute cap, 2-second interval)** and throws on failure statuses.

**Decision:** Orindle does not use the SDK's blocking video model. A serverless request must not be
held open for a render, and Orindle's own outbox/polling already owns that lifecycle. Orindle uses
the native endpoints, persists the job `id` at submission, and polls from the job runner. The SDK's
internal poller is exactly the "keep a request open" pattern the brief forbids.

## 8. Error contract

Source: `https://openrouter.ai/docs/api_reference/errors-and-debugging`.

- Body: `{ error: { code, message, metadata? } }`; HTTP status equals `error.code` for request-level
  failures. **An error during generation can still arrive on HTTP 200**, as an SSE event or in the
  body — so "HTTP 200" is not proof of success.
- Codes: 400 bad request, 401 invalid credentials, 402 insufficient credits, 403 forbidden/budget/
  guardrail, 408 timeout, 429 rate limited, 502 model down/bad upstream response, 503 no provider
  meets routing requirements, 524 timeout, 529 overloaded.
- `Retry-After` is sent on 429 and 503, and on 402 only when `metadata.limit_source` is
  `openrouter_in_flight_budget`. A 402 without it is **not** a wait-and-retry case.

## 9. Provider routing and price safety

- Chat/image/video settings accept `provider: { order?, only?, allow_fallbacks?, require_parameters?,
  sort?, max_price?: { prompt, completion, image, audio, request }, zdr? }`.
- `allow_fallbacks` defaults to `true`. **This is the financial hazard:** a model may be quoted from
  one endpoint's price and then served by a different, dearer endpoint.

**Chosen approach (option 2 of the brief):** quote from the *worst-case* price across the endpoints
that routing is permitted to use, and pin routing server-side. Concretely, when a model has multiple
priced endpoints Orindle quotes the maximum per-unit rates across all of them and sends
`provider.max_price` derived from the same figure with `allow_fallbacks: true`, so any route
OpenRouter picks is covered by the reservation. Customers can never supply `provider` — routing is
built server-side only. If no safe maximum exists, the model is unquotable and cannot be purchased.

This avoids the operational fragility of pinning to one `only: [slug]` endpoint (which would break
every generation whenever that provider has an outage) while still bounding the maximum cost.

## 10. Things deliberately *not* changed

- Vercel hosting, `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_PREFIX`,
  `VERCEL_DEPLOY_TARGET`, the E2B sandbox, and website publishing. The word "Vercel" is not
  globally replaced anywhere.
- The credit formula `credits = ceil(actual_cost_usd × 200)` and the $19/$49/$99 packs.
- Historical Gateway rows, prices and generation IDs. They remain readable and are labelled as
  historical.

## 11. Documentation sources used

| Topic | URL |
|---|---|
| API overview / request schema | https://openrouter.ai/docs/api_reference/overview |
| Generation lookup | https://openrouter.ai/docs/api/api-reference/generations/get-request-&-usage-metadata-for-a-generation |
| Models list + `output_modalities` | https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties |
| Image generation | https://openrouter.ai/docs/guides/overview/multimodal/image-generation |
| Video generation | https://openrouter.ai/docs/guides/overview/multimodal/video-generation |
| Errors, `Retry-After` | https://openrouter.ai/docs/api_reference/errors-and-debugging |
| AI SDK provider | https://github.com/OpenRouterTeam/ai-sdk-provider (verified via published tarball 3.1.0) |
