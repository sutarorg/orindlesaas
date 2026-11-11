# OpenRouter migration

Status: **implemented and verified against disposable PostgreSQL; no paid OpenRouter call, hosted
sync or production deployment has been performed.** This document is the index for the
`openrouter-*` set and states exactly what changed, what is verified and what remains outstanding.

## Why the provider changed

Orindle originally reached every model through Vercel AI Gateway. OpenRouter replaces it as the
single access path for all four products. The Gateway SDK client (`lib/server/ai/gateway.ts`) is
deleted; `lib/server/ai/openrouter.ts` replaces it.

The migration was not a key swap. Three Gateway assumptions were load-bearing and each one silently
broke a different part of the product when left in place; they are recorded in
`openrouter-lessons.md` because each looked like working code.

## Scope delivered

| Area | Change | Document |
|---|---|---|
| Provider client | `@openrouter/ai-sdk-provider@3.1.0`, `getOpenRouterProvider`, `openRouterLanguageModel` | `openrouter-provider.md` |
| Model catalogue | `GET /api/v1/models` discovery, normalisation, per-endpoint registry | `openrouter-catalog-sync.md` |
| Pricing | Endpoint-aware exact quotes, worst-case ceilings, `max_price` body | `openrouter-pricing.md` |
| Routing | Server-only provider pinning and fallbacks | `openrouter-routing.md` |
| Chat | Streaming, `stream_*` error classification, ID from `step.response.id` | `openrouter-chat.md` |
| Image Studio | `POST /api/v1/images`, base64 + `media_type`, per-image rates | `openrouter-image.md` |
| Video Studio | `POST /api/v1/videos`, polling, per-second SKUs | `openrouter-video.md` |
| Website builder | Unchanged E2B/`VERCEL_API_TOKEN` pipeline on an OpenRouter chat model | `openrouter-website-builder.md` |
| Actual cost | `GET /api/v1/generation`, `total_cost`, reconciliation | `openrouter-cost-reconciliation.md` |
| Errors & retries | `retryableReadOnly`, no retry of uncertain paid work | `openrouter-errors.md` |
| Admin | Endpoint approval table, endpoint metrics, enablement gate | `openrouter-admin.md` |
| Database | `0005_openrouter_provider_neutral.sql`, preserved Gateway history | `openrouter-database.md` |
| Testing | 234 unit tests, 11 integration tests on real PostgreSQL | `openrouter-testing.md` |
| Security | Key handling, no client routing, no key exposure | `openrouter-security.md` |
| Operations | Sync cadence, approval workflow, tick scheduling | `openrouter-operations.md` |
| Lessons | The three Gateways-only assumptions that broke silently | `openrouter-lessons.md` |

## Preserved business rules

These were explicit constraints and remain true:

- `credits = ceil(actual_usd × 200)` is unchanged, and credit packs remain `$19 / $49 / $99`.
- Money never passes through a float. All rates are decimal strings; arithmetic is exact.
- A newly discovered model is created **disabled**. Sync never enables a model.
- Provider routing is decided server-side. A browser cannot choose or pin a provider.
- An estimate is never recorded as an actual cost. Unverified figures stay unverified.
- A paid generation is never retried automatically.

## What is verified, and how

Verified by execution, not inspection:

- `npx tsc --noEmit` clean, including test files.
- `npx eslint .` — 0 errors, 0 warnings.
- `npx vitest run` — **234 passed across 36 files**.
- Integration suite — **11/11** against a real PostgreSQL 55440 instance, applying `0000`–`0005`
  and synchronising a realistic OpenRouter catalogue.
- `0005` re-runs cleanly three times (idempotent).
- End-to-end, against the real database: catalogue sync → endpoint approval → exact chat, image and
  video quotes → selector visibility, including that revoking an endpoint immediately removes the
  model from the customer selector.

Not verified, and not claimed: any paid OpenRouter request, the hosted database, a real image or
video generation, and production behaviour. See `openrouter-operations.md` for the deploy steps
still outstanding.

## Outstanding deploy steps

1. Apply `0005` to the hosted database. This requires owner authorisation; it has **not** been run.
2. Schedule `GET /api/v1/jobs/tick?task=outbox`, `?task=metering` and `?task=catalog` with
   `JOBS_TICK_SECRET`, so settlement and catalogue refresh run without a manual trigger.
3. Run `npm run catalog:sync` against the live key, then approve serving endpoints in the admin
   dashboard before enabling any model.
