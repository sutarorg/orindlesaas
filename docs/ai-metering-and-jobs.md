# AI, metering and durable jobs

Status: **Prompt 5 source implemented with provider fakes; live model execution and durable-job verification remain credential-dependent**.

## SDK and model rules

The target is `ai` 7.x. AI SDK 5 is deprecated for Gateway and AI SDK 7 lifecycle/stream helpers differ from v6. Chat uses `streamText`; images use `generateImage`; asynchronous video uses `experimental_startVideo` and `experimental_getVideoStatus`; website source uses structured text output. No method from an older major is assumed.

Initial server allowlist candidates are taken from official current examples: `anthropic/claude-sonnet-5` for text, `openai/gpt-image-2` for image-only generation and `google/veo-3.1-fast-generate-001` for video. The authenticated Gateway catalog is authoritative for availability/capabilities/pricing at setup/runtime. Existing unverified fixture IDs are not sent to a provider.

## Quotes and reservations

The catalog sync stores exact decimal price rates in immutable model price versions. A quote applies server operation caps (input tokens, output tokens, image count/size, video duration/aspect ratio or website file budget) to those rates. It returns an estimate and expiry, never an authoritative final charge. If a current rate cannot price the operation safely, the operation is rejected as `pricing_unavailable`.

The generation transaction creates the owned job, validates the idempotency request hash, locks the wallet and appends the reservation hold. Insufficient available credits returns 409 `insufficient_credits` without a provider call; request-rate limits separately use 429. The generation/outbox commit happens before Inngest notification.

## Actual metering

OpenRouter identifies a generation with an ID of the form `gen-…` (hyphen). For chat it is taken from `step.response.id`; for media it is the ID returned by the submission. The server reconciles that ID with `GET /api/v1/generation`, whose `data.total_cost` is the authoritative actual cost, converted to an eight-decimal string without a float step. Catalogue prices are never substituted for actual metering. Legacy Vercel AI Gateway IDs (`gen_…`, underscore) are stored in a separate `gateway_generation_id` column, still resolve, and remain labelled `vercel_ai_gateway` / `legacy_gateway_lookup`. Usage quantities are recorded separately from money, and conflicting stored cost/generation evidence is rejected during settlement. See `openrouter-cost-reconciliation.md`.

AI cost is parsed to non-negative integer nanodollars. Final credits use exact integer ceiling arithmetic equivalent to `ceil(actual_cost_usd × 200)`. Internal actual cost is never sent to the customer. If actual cost is not yet available, the generation enters reconciliation rather than substituting an estimate and calling it actual.

## Chat lifecycle

The route creates an owned conversation/user message/generation and reservation, then streams provider text. It loads history from the database rather than trusting a client transcript. Normal completion persists the assistant message before usage settlement. Abort/error states mark reconciliation and do not persist partial text as a completed assistant message or represent disconnect as successful provider cancellation. There is no automatic retry after a possibly charged stream.

## Image/video lifecycle

A single guarded worker step marks image/video submission before the provider call and disables SDK retries. It does not claim checkpointed storage/resume behavior that is not implemented: an attempted/completed/uncertain submission is never generated again automatically, and missing post-processing evidence can require manual reconciliation. Video start persists the JSON-serializable operation/reference; subsequent status calls are read-only and durable sleeps avoid holding normal HTTP requests open. Hosted video URLs are untrusted fetch inputs and must pass protocol/host/SSRF validation before download.

Outputs are uploaded to server-generated owner-scoped R2 keys with opaque asset IDs. Only after asset/source persistence and successful settlement does the job become succeeded; empty media outputs remain failed even if actual provider cost is settled. A charged output with missing cost or insufficient settlement funds is retained privately in `reconciliation_required`; it is not falsely reported as free or successfully billed.

## Website lifecycle

Website generation is also asynchronous. The model returns bounded structured static source files. The server permits only `index.html`, `styles.css` and optional `script.js`, with no package/dependency recipe; it validates and stores the source, runs fixed validation in E2B and only then allows preview deployment. AI generation, build and Vercel deployment are separate checkpoint states so retrying a build never repeats a charged source generation.

## Inngest and outbox

The official `inngest/next` `serve({ client, functions })` GET/POST/PUT handler is mounted at `/api/inngest`. Production requires `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`. Functions use stable event IDs, per-user concurrency, bounded retries and non-retriable validation errors. Function-level 24-hour idempotency is only supplemental; database unique keys remain authoritative.

The transactional outbox covers Inngest notification and email. A scheduled sweep publishes due unsent records. Side effects that cannot be made idempotent are not blindly retried. Safe error codes and attempt counts are persisted; prompts, source, signed URLs and raw provider responses are excluded from job logs.

## Compensation and reconciliation

Validation fails before provider submission where possible. The current worker does not automatically release a hold after a possibly submitted provider call: unknown/post-submission failures require actual-cost lookup and reconciliation. A general release helper and ledger compensation kind exist, but no browser/job cancellation or automatic compensation policy is exposed. Periodic recovery is intentionally limited to reconciliation jobs with a Gateway generation ID and stored result evidence; unknown submissions without that evidence remain manual. Every automatic repair uses the original generation/reservation ID and exact cost evidence.

## Dynamic registry and lossless-cost amendment — planned

The 2026 research in `ai-metering-and-reconciliation.md` retains every rule above but identifies two required implementation corrections before the dynamic ecosystem can be accepted: generation lookup must parse the REST cost decimal losslessly rather than rely on SDK `number` plus `toFixed`, and the estimate/submission resolver must include complete media parameters and model-specific compatibility. BYOK evidence requires review rather than being interpreted as free usage.

Catalogue scheduling will join the existing Inngest function list and call the one catalog-sync service with run leases/history. It will not create a second scheduler or execute external discovery inside a DB transaction. These are planned controls, not new tested behavior. Source A and the documentation/source gate are complete; implementation and hosted verification remain open.
