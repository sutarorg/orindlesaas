# Database schema and invariants

Status: **implemented in Drizzle and reviewed SQL, but not applied or verified against PostgreSQL/Supabase in this environment**. `lib/server/db/schema.ts` plus `drizzle/0000_initial_backend.sql`, `0001_integrity_and_bootstrap.sql`, and `0002_outstanding_ultimates.sql` are the source of truth. `npx drizzle-kit check` passes; that is a migration-chain/static check, not SQL execution, RLS evidence, or production approval.

## Conventions

- Supabase `auth.users.id` is the customer identity UUID. `profiles.id` references it.
- Wallet balances, credit movements, reservations, pack values, and purchase amounts use integer columns. Payment amounts are USD cents.
- Actual/estimated AI cost uses `numeric(24,8)`. TypeScript parses decimal strings into integer nanodollars without floating-point ledger arithmetic; the storage scale is eight decimal places.
- Timestamps are UTC `timestamptz`. JSON fields are written by server services with allowlisted payloads; raw webhook bodies, secrets, access/refresh tokens, and payment-instrument data are not stored.
- Every customer repository query includes a verified owner predicate even when the direct database role bypasses RLS.

## Identity and authorization

- `profiles`: auth-user PK/FK, normalized-unique email, display/avatar fields, and `active|suspended|deleted` status. No passwords, sessions, or browser-supplied roles.
- `admin_roles`: `(user_id, role)` PK, explicit permission JSON, permission version, active flag, and optional expiry. Role labels do not replace permission checks. Server guards reject inactive/expired memberships and unknown permissions.
- `account_deletion_requests`: owner, request status/reason, and processing timestamps. Financial and audit records intentionally restrict deletion rather than being erased by a convenience cascade.

Sensitive admin mutations require an active permission plus AAL2 with a recent Supabase TOTP `amr` claim (10-minute window, 60-second future-skew tolerance). This is implemented and unit-tested with claim fakes; live Supabase MFA behavior remains unverified.

## Wallet, reservations, and ledger

- `wallets`: `user_id` PK, non-negative available/reserved/lifetime counters, and a bigint version.
- `wallet_ledger`: signed available/reserved deltas, resulting counters, actor/reference/correlation, safe metadata, and unique `(user_id, kind, idempotency_key)`. SQL triggers reject update/delete.
- `credit_reservations`: owner, unique job, exact estimated/actual cost, estimated/actual credits, `held|settled|released|reconciliation_required`, and unique `(user_id, idempotency_key)`.

The service locks a wallet before balance changes. A hold of `H` writes available `-H`, reserved `+H`. Settlement at actual charge `A` writes reserved `-H`, available `H-A`, lifetime usage `+A`. Actual charge is exactly `ceil(actual_cost_usd × 200)` from integer decimal arithmetic. If available funds plus the hold cannot cover the actual charge, the hold remains and the reservation enters reconciliation; the wallet is not overdrawn.

Settled/reconciliation retries must match both rounded credits **and exact stored decimal cost**. `usage_events` preserves Gateway actual-cost evidence in both required and settled states; a later valid settlement updates the same generation’s evidence row rather than ignoring it through a blind conflict skip.

These algorithms and same-cost cases have unit coverage. Real row-lock behavior, concurrent holds/settlements/adjustments, and append-only trigger enforcement still require disposable real PostgreSQL tests.

## Purchases, payments, and verified webhooks

- `credit_packs`: fixed `creator|pro|studio` PK with SQL-enforced exact values: 1,900/$19, 4,900/$49, and 9,900/$99. Only enablement is mutable through the admin action.
- `purchases`: owner, exact pack expectation, environment-specific Dodo product ID, unique checkout session, safe status/reconciliation reason, and unique `(user_id, idempotency_key)`.
- `payments`: one per purchase, unique provider payment/checkout IDs where present, expected subtotal and actual tax/total/currency, status, and fulfillment timestamp.
- `webhook_events`: provider/event ID uniqueness, event type, SHA-256 of the exact raw body, processing timestamp/error. Signatures and raw payloads are not persisted.

Checkout locks the active pack row and verifies database/static values before creating a purchase. It uses server prices and a stable provider idempotency key. Fulfillment claims the verified webhook and updates payment, purchase, wallet ledger, receipt email, and outbox in one transaction. Validation requires the expected purchase/user/pack metadata, one-time product/cart, checkout session, succeeded status, USD, no subscription, and exact pre-tax cents. Checkout return URLs never grant credits.

Real Dodo signature delivery, replay under concurrency, duplicate fulfillment, tax behavior, refunds/disputes, and receipt delivery remain unverified without credentials and PostgreSQL.

## Catalog and immutable pricing

- `providers`: server-managed ID/name and disabled-by-default state.
- `models`: internal ID distinct from `gateway_model_id`, provider FK, kind, modalities/capabilities, disabled-by-default state, and catalog sync time.
- `model_prices`: model FK, nullable input/output token or per-operation integer nano-USD rates, source, and effective interval.

`0001` adds a trigger allowing only the first valid `effective_to` closure; IDs, rates, source, model, start, and creation time cannot be changed and rows cannot be deleted. A partial unique index permits only one open interval per model. Catalog sync locks the model, closes/replaces a changed current Gateway language price, and skips a model with a future open admin version instead of creating overlap. Newly discovered providers/models remain disabled; media operation prices are never invented.

## Generations, metering, and durable events

- `generation_jobs`: owner/kind/model, private request/result, canonical request SHA-256, per-user idempotency key, submission state, provider operation/Gateway ID, reservation FK, attempts, safe errors, and timestamps.
- `usage_events`: unique generation, Gateway generation ID, numeric usage JSON, source, actual cost, charged credits, and reconciliation state. Internal cost is not exposed through customer DTOs or direct Data API grants.
- `outbox_events`: unique event key/name, versioned JSON payload, pending/processing/published/failed state, attempts, lease/due timestamps, and safe error.
- `idempotency_records`: actor/operation/key uniqueness, request hash, stored safe response, and timestamps for admin and credit-adjustment recovery.

`0002` safely backfills request hashes and derives legacy submission state before adding constraints; legacy non-queued work is not defaulted to resubmittable. Automatic retries never blindly resubmit `attempted`, `completed`, or `uncertain` provider work.

## Customer content, assets, and website execution

- `conversations` and `messages`: owner or owner-through-conversation content; messages remain private customer content.
- `assets`: owner/job, bucket/object key, file metadata, byte size, SHA-256, and state. Keys use `users/{userId}/...`; API downloads recheck ownership and issue five-minute signatures.
- `website_projects`, `website_builds`, and `deployments`: owner or owner-through-project relationships, source/build hashes, restricted sandbox/provider identifiers, safe status/URL, build diagnostics, target, and idempotency.

R2 reads use early length checks and bounded streams before size/checksum validation. Website deployment requires a passed build for the current source and an explicit `preview` target. Provider deployment IDs, sandbox IDs, storage keys, actual cost, and unrestricted generation fields are server-only.

## Contact, email, and audit

- `contact_messages`: validated public request, stable idempotency, safe topic/status, and timestamps.
- `email_outbox`: template, actual recipient email, stable idempotency key, safe payload, delivery status/provider ID/error. Support and purchase-receipt templates are explicitly allowlisted.
- `audit_events`: append-only actor/action/target/reason/request and allowlisted before/after JSON. SQL rejects update/delete. Privileged mutations and their audit row commit together.

## RLS and direct Data API grants

All application tables enable RLS. The reviewed migrations do **not** claim `FORCE ROW LEVEL SECURITY`; direct Drizzle roles may bypass RLS, so server ownership/permission predicates remain mandatory. Browser write grants are revoked from financial, authorization, evidence, content, job, and operational tables.

After `0001`, authenticated direct reads are limited to owner-safe `profiles`, own `admin_roles`, `wallets`, `wallet_ledger`, `purchases`, `payments`, `conversations`, and `messages`, plus catalog tables. Anonymous reads are limited to enabled `credit_packs`/`models` and `providers` according to their policies. Server catalog queries additionally require the provider to be enabled.

Direct `SELECT` is explicitly revoked for `credit_reservations`, `generation_jobs`, `usage_events`, `assets`, `website_projects`, `website_builds`, and `deployments`, preventing Data API bypass of display-safe DTOs for internal costs, provider operations, storage keys, diagnostics, and deployment identifiers. Server-only tables have no public read grant.

RLS policy behavior, negative cross-user cases, column/grant verification, and service-role behavior have **not** been executed against Supabase. Unit/browser authorization tests are not a substitute for that launch gate.

## Migration/setup gate

1. Review all three SQL files against the target, including existing data and the `auth.users` trigger.
2. Apply to a disposable Supabase/PostgreSQL environment first; never run a destructive production migration from this handoff.
3. Verify constraints, append-only triggers, the single-open-price index, grants, RLS negative tests, auth-user bootstrap, and rollback/backup procedures.
4. Run `npm run db:seed` only in the intended non-production environment, then use an authorized `npm run catalog:sync`; both are real writes and were not run here.
5. Record real concurrency/replay/RLS evidence before marking the live backend complete.
