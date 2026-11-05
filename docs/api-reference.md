# API reference and versioning

Status: **implemented Prompt 5 route inventory; live-provider behavior remains unverified**. This document lists routes that actually exist under `app/api/`; it does not describe planned endpoints as implemented.

## Common protocol

JSON requests use `Content-Type: application/json`, bounded bodies and Zod validation. IDs are UUIDs unless a documented slug is used. Cookie-authenticated mutations require a production HTTPS same-origin `Origin`; Dodo and Inngest callbacks use provider signature verification instead. Sensitive operations use scoped idempotency keys and reject key reuse with different input.

Errors use a safe envelope with `error.code`, `error.message`, and `requestId`; validation may include safe field errors. Responses carry `x-request-id`, and private responses use `Cache-Control: no-store`. Common statuses include 400 malformed input, 401 unauthenticated/invalid webhook, 403 forbidden/origin/step-up, 404 missing or inaccessible object, 409 idempotency/state/credit conflict, 413 too large, 422 semantic validation, 429 rate limit, 500 safe internal failure, and 503 required integration unavailable. With auth/persistence absent, a private dependency may fail closed as 503 rather than manufacturing a 401/authorized result.

## Authentication boundary

There are **no `/api/v1/auth/*` route handlers**. Browser auth components call the Supabase publishable-key integration in `lib/auth/supabase-service.ts`; `proxy.ts` maintains SSR cookies and `app/(site)/auth/callback/page.tsx` plus `components/auth/auth-callback.tsx` perform real code exchange/recovery handling. Private server routes independently verify claims and active profile state. Auth routes are noindex and query parameters cannot select fake success/expiry states.

## Workspace and catalog

- `GET /api/v1/workspace`: verified owner’s display-safe workspace snapshot.
- `GET /api/v1/catalog/models`: enabled provider/model display metadata; no internal cost or price-version fields.
- `POST /api/v1/catalog/estimate`: authenticated/same-origin/rate-limited `{ kind, modelId, prompt, maxOutputTokens? }`; returns server estimate/credits and explicitly separates actual billing.
- `POST /api/v1/contact`: bounded public contact fields/honeypot, abuse controls, durable contact/email/outbox acceptance. Acceptance is not inbox delivery.

There is no implemented `/api/v1/health` or `/api/v1/catalog/credit-packs` endpoint. Public pack content comes from the fixed server/shared pricing source; checkout revalidates the database pack.

## Chat and generations

- `POST /api/v1/chat`: authenticated/same-origin/rate-limited chat request with model/message and idempotency; creates/uses owned conversation state and returns a real Gateway stream when configured.
- `GET /api/v1/chat`: owner conversation list/snapshot supported by the current service.
- `GET /api/v1/chat/:conversationId`: owned conversation/messages; foreign or missing IDs are not exposed.
- `POST /api/v1/generations`: authenticated/same-origin/rate-limited `image|video|website` request; returns the created/recovered job ID, status, estimated credits and duplicate marker after durable job/hold/outbox commit.
- `GET /api/v1/generations/:jobId`: owner-safe status/result asset or project references, estimate/actual charged credits and safe error; no provider operation or internal actual cost.

There is no public charged-job retry/cancel endpoint. Unknown post-submission state requires reconciliation rather than a browser retry.

## Payments

- `POST /api/v1/payments/checkout`: authenticated/same-origin/rate-limited `{ packId, idempotencyKey }`; validates enabled exact server/database pack and returns a validated Dodo HTTPS checkout URL. It does not grant credits.
- `POST /api/webhooks/dodo`: exact raw-body SDK signature verification and transactional idempotent fulfillment. It is deliberately not a cookie-authenticated/same-origin browser endpoint.

There are no implemented `/api/v1/wallet`, `/api/v1/wallet/checkout`, browser fulfillment, refund, dispute, or payment-reconciliation routes. Wallet/purchase history is included in authorized server workspace/admin projections.

## Assets and account

- `GET /api/v1/assets/:assetId/download`: owner/status/key checks and short-lived R2 download URL response; no unrestricted storage key in the DTO.
- `PATCH /api/v1/account/profile`: authenticated/same-origin validated display-profile update.
- `POST /api/v1/account/deletion`: authenticated/same-origin exact confirmation; creates a deletion request rather than claiming retention-sensitive data was erased.

There are no implemented asset list/delete or generic settings routes in this revision.

## Websites and preview deployment

- `GET /api/v1/websites/:projectId`: owned safe project/source/build/deployment presentation.
- `PATCH /api/v1/websites/:projectId`: authenticated/same-origin/rate-limited rename **or** validated static source update. Source update creates a validation build/outbox record; it does not execute source on the app server.
- `GET /api/v1/websites/:projectId/preview`: owned static preview HTML with restrictive CSP and no customer network/form capabilities.
- `GET /api/v1/websites/builds/:buildId`: owner-through-project safe build status/timestamps.
- `POST /api/v1/websites/:projectId/deployments`: authenticated/same-origin/rate-limited idempotency input; requires a passed build for current source and queues preview-only deployment.
- `GET /api/v1/websites/deployments/:deploymentId`: owner-through-project status with bounded/rate-limited provider polling; no unrestricted provider ID in the response.

The earlier planned `/publish` naming is not an implemented route; use the actual `/deployments` boundary. Production targets and arbitrary team/project/domain input are not accepted.

## Administration

Admin page reads are Server Component/query projections guarded by explicit permissions; separate public `/api/v1/admin/users`, `/overview`, `/payments`, etc. route handlers are **not implemented**.

- `POST /api/v1/admin/actions`: discriminated `set_user_status`, `set_provider_enabled`, `set_model_enabled`, `set_pack_enabled`, or `create_price_version`; explicit permission, recent AAL2/TOTP, reason, expected state where applicable, stable idempotency and transactional audit.
- `POST /api/v1/admin/credits/adjust`: bounded signed credit adjustment with `credits:adjust`, recent step-up, substantive reason/reference, idempotent ledger and audit behavior.

Account session invalidation, payment reconciliation, dispute resolution and post-submission charged-job retry are not accepted actions in this revision. Browser-selected roles, balances, payment success, provider costs or fulfillment states are never authoritative.

## Internal jobs

`/api/inngest` exports the official GET/POST/PUT `serve()` handlers for generation, website validation, email, deployment, outbox recovery and metering recovery functions. Production invocation/sync requires Inngest signing configuration. Event payloads use internal IDs and safe metadata, not credentials or unnecessary private content.
