# Handoff to Prompt 6 — Live verification, reconciliation and release gates

Status: **Prompt 5 backend source implementation and credential-free local validation completed on 2026-11-05. Live backend/production readiness remains blocked.** Start from the actual source and this evidence boundary, not from the historical demo-stage handoffs. No paid provider, live deployment, migration, seed/catalog write, or destructive action was authorized or performed.

## Exact final local evidence

| Check | Observed result | Meaning / limit |
|---|---|---|
| `npm run typecheck` | Pass | Strict TypeScript; no errors. |
| `npm run lint` | Pass | ESLint; no warnings/errors. |
| `npm run test:unit` | **21 files, 106/106 tests** | Unit/component/security fakes; not live PostgreSQL or provider evidence. |
| `npx drizzle-kit check` | Pass | Migration-chain/snapshot consistency only; no SQL executed. |
| `npm run build` | Pass; **45 generated pages** | Next 16.4.5 compiled all public/auth/customer/admin/API routes and ran TypeScript. |
| Production Playwright | **50/50 tests** | 17 public, 24 authentication, 5 workspace-authorization, 4 admin-authorization tests against the rebuilt production server. |
| Responsive/axe subset | Pass within tested states | Public/auth scans and private login handoff passed; not WCAG certification or credentialed workspace coverage. |
| Live infrastructure | Not run | No real Supabase, PostgreSQL, Dodo, Gateway, R2, Inngest, E2B, Vercel, Upstash or Resend journey. |

Browser execution in this sandbox used `LD_LIBRARY_PATH=/tmp/al2023/lib`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium`, and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`; see `quality-assurance.md`. These are local test settings, not runtime requirements.

Credential-free APIs intentionally return 503 `integration_unavailable` when required server dependencies are absent. This is fail-closed behavior, not a substitute for 401/403 tests with a configured auth service. Production same-origin mutation tests simulate a secure HTTPS Origin; insecure/cross-origin writes correctly return 403.

## Implemented source boundaries

### Identity, sessions and authorization

- `proxy.ts`, `lib/supabase/`, `lib/auth/supabase-service.ts`, and `components/auth/` implement Supabase cookie refresh, password signup/login/logout, recovery/update, resend, optional OAuth and real callback exchange. Query parameters cannot spoof success, expiry, cancellation or an authenticated account.
- `lib/server/auth/guards.ts` uses verified `getClaims()` plus current active-profile lookup. Admin reads require active/unexpired explicit permissions. Sensitive implemented mutations require AAL2 and a TOTP `amr` timestamp within 10 minutes (60-second future-skew tolerance).
- `/app` and `/admin` pages query real owner/permission-scoped data. The routed fixture customer/admin workspaces, preview search and fake mutation dialogs were removed. Private routes remain noindex and outside sitemap discovery.
- There is no default admin, public role grant or implemented admin-bootstrap script. Session invalidation, payment reconciliation, dispute resolution, post-submission charged-job retry, browser job cancellation and automatic compensation/reversal are not exposed as working mutations.

### API and abuse controls

- Versioned handlers under `app/api/v1/` use runtime validation, bounded JSON bodies/pagination, safe error envelopes, request correlation, no-store private responses and same-origin mutation checks.
- Upstash is required for sensitive production limits; missing production configuration fails closed. A bounded memory limiter is only an explicit non-production fallback.
- `app/api/v1/contact/route.ts` stores contact + email + outbox atomically. “Accepted” means durable queue acceptance, not inbox delivery. Resend support/receipt templates use stable idempotency and actual email recipients.

### Database, packs, payments and ledger

- `lib/server/db/schema.ts` and three reviewed SQL migrations define auth-owned profiles, roles, wallets/ledger/reservations, exact packs, purchases/payments/webhook claims, catalog/prices, generations/usage, conversations/assets/websites, contact/email/outbox/idempotency/audit records.
- `drizzle/0001_integrity_and_bootstrap.sql` adds the circular generation/reservation FK after table creation, auth-user bootstrap, exact packs, browser-write revocations, restricted Data API reads, append-only ledger/audit triggers, controlled price closure and a single-open-price partial unique index.
- `drizzle/0002_outstanding_ultimates.sql` backfills request hashes/submission states without making legacy non-queued jobs blindly resubmittable.
- Checkout locks and validates the enabled server pack, exact values and environment-specific Dodo product. Browser prices and checkout returns never grant credits.
- Dodo webhook verification uses the exact raw body and SDK `webhooks.unwrap()`. Fulfillment validates purchase/user/pack metadata, one-time product/cart, checkout session, succeeded status, USD, no subscription and expected pre-tax cents. Event claim, payment/purchase, wallet, receipt and outbox changes share a transaction.
- Hold `H`: available `-H`, reserved `+H`. Settlement at actual charge `A`: reserved `-H`, available `H-A`, lifetime usage `+A`. `A = ceil(actual_cost_usd × 200)` using integer decimal arithmetic. Overdrafts enter reconciliation rather than creating negative balances.
- Duplicate/reconciliation settlement requires matching exact stored cost, not merely the same rounded credit total. Usage evidence survives both reconciliation and later settlement.

### AI, jobs, assets and websites

- `lib/server/ai/catalog-sync.ts` reads real Gateway metadata when explicitly invoked. New providers/models remain disabled; language prices must be exactly representable and media operation prices are never invented. Internal model IDs are distinct from Gateway execution IDs.
- Chat uses owned conversations and synchronous Gateway streaming. Image/video/website jobs use canonical request hashes, per-user idempotency, wallet locking, three-active-job limits, transactional job/hold/outbox records and submission-state guards.
- Actual cost comes from Gateway generation lookup, not catalog estimates. Provider fakes cover attempted/lost/unknown submission behavior. No production fallback silently selects a fake model/payment/storage/provider.
- R2 keys are `users/{userId}/...`; API downloads recheck ownership and issue five-minute signatures. Provider downloads enforce HTTPS/exact hosts/no redirects/100-MiB streaming caps. Owned R2 reads use length checks, bounded streams and checksum verification.
- Website sources reject unsafe paths/dependencies/external execution patterns. E2B performs isolated static validation without app-server execution. Vercel deployment requires a passed current-source build and `VERCEL_DEPLOY_TARGET=preview`; production targets are rejected. Unknown create acceptance blocks blind retry.

### Administration

- `lib/server/admin/queries.ts` provides limited safe projections and permission-filtered aggregates; internal cost requires `usage:read` and customer prompts/files/source are not default admin DTOs.
- `lib/server/admin/mutations.ts`, the admin action/credit-adjustment routes and `components/admin/admin-actions.tsx` implement expected-state toggles, user status, price versions and audited credit adjustment with stable idempotency and recent step-up.
- Price rates/history are not freely editable. Only the first valid interval closure is allowed; a new version is appended. Audit failure rolls back the local privileged mutation.

## Final local test coverage that matters

- Auth validation/components, fail-closed unconfigured forms/callbacks, query spoof resistance and no unconfigured session-policy cookie/storage writes.
- Mocked malformed identity, missing/suspended profile, expired/wrong-permission membership, stale/fresh AAL2/TOTP, and production limiter fail-closed behavior.
- Exact decimal parsing/rounding, same-rounded-credit/different-exact-cost rejection, duplicate settled-result recovery and direct overdraft rejection before mutation.
- Dodo raw-body/header/hash/signature-failure/size-limit adapter behavior and wrong metadata/product/cart/currency/subscription/session/pre-tax amount cases.
- Provider submission fakes, website source validation, catalog normalization/estimate lookup and inherited public/auth/admin/dashboard component behavior.
- Anonymous private-page/API denial, robots/sitemap exclusion, insecure/cross-origin writes and safe correlated errors in production Chromium.

## Not verified — release blockers

1. **No applied database:** no PostgreSQL/Supabase runtime was available. Migrations, auth bootstrap trigger, seed and catalog sync have never run.
2. **No real RLS/grant evidence:** reviewed policies/revocations require actual `anon`, `authenticated`, owner, cross-user and direct-role tests. Fakes/PGlite must not be reported as PostgreSQL RLS or lock proof.
3. **No real race evidence:** concurrent wallet holds/settlements/adjustments, checkout creation, webhook replay/duplicate fulfillment, admin expected-state/idempotency and audit rollback still require disposable PostgreSQL tests.
4. **No credentialed auth/admin journey:** signup/verification/login/OAuth/recovery/MFA, active/suspended users, role bundles, expiry and recent step-up require Supabase verification. First admin provisioning needs security-owner approval.
5. **No live payment/email:** Dodo test products/webhook, taxes, reconciliation, refunds/disputes and Resend support/receipt delivery/suppression remain unverified.
6. **No live AI/storage/jobs:** actual model IDs/capabilities, cost lookup, media hosts, R2 signatures/checksums, outbox/Inngest retries and failure recovery remain unverified.
7. **No live sandbox/deployment:** E2B isolation and Vercel preview creation/polling/unknown outcomes remain unverified. No production target is permitted by current code.
8. **Operational gaps:** monitoring/alerts, backup restoration, reconciliation drills, spending quotas, retention/deletion, legal/finance review and production incident ownership remain open.
9. **Dependency risk:** the earlier audit reported 11 findings (9 moderate, 2 high), including nested `inngest@4.26.2 -> zod@3.25.76` / GHSA-mrhx-c7xc-m3w5. Re-audit and test a supported remediation; do not blind-force upgrades or apply an untested major Zod override.
10. **Storage/provider partial effects:** R2 and external providers are not transactional with PostgreSQL. Orphan/duplicate postprocessing objects and uncertain external acceptance need live failure-injection and reconciliation procedures.

## Prompt 6 execution order

Follow `deployment-runbook.md` and use disposable/test-mode resources first.

1. Re-read target provider documentation and the three SQL files; reconcile any target drift and establish backup/forward recovery.
2. Apply migrations to a disposable database. Verify every constraint/trigger/grant/policy and run two-user RLS plus direct privileged-role ownership tests.
3. Add and run real concurrency suites for wallet/purchase/webhook/admin operations. Assert actual persisted rows and ledger-derived balances, not merely returned status codes.
4. Seed exact packs, configure Supabase Auth/SMTP/redirects/TOTP, and run complete auth negatives/positives. Provision a tightly scoped test admin through an approved explicit operator procedure.
5. Configure Dodo test mode and verify exact product/pre-tax expectations, signatures, replay, same-ID/different-body conflict, duplicate fulfillment, reconciliation and receipt outbox.
6. Run authorized Gateway catalog sync; review and selectively enable models/prices. Test chat/image/video/website actual-cost and uncertain-state journeys with strict spend limits.
7. Configure/test Inngest, Upstash, R2 and Resend. Inject outbox, provider, storage and email failures; verify stable retries and no false success.
8. Test E2B and Vercel preview only, including source mismatch, sandbox isolation, polling bounds and lost-create reconciliation.
9. Repeat credentialed customer/admin browser accessibility/responsive/security suites, dependency/secret scans, operational drills and full static/build regressions.
10. Only after all P0/P1 gates and legal/finance/operations approvals should a separately authorized production release be considered.

## Commands and evidence discipline

Local static commands are safe:

```bash
npm run env:check
npm run typecheck
npm run lint
npm run test:unit
npx drizzle-kit check
npm run build
```

Real-write/external commands require explicit target authorization:

```bash
npm run db:migrate
npm run db:seed
npm run catalog:sync
```

Update `task.md`, `progress.md`, `quality-assurance.md`, `production-readiness.md`, both synchronized risk files and this handoff with actual results. Never convert a blocked `[~]` item to complete based on source inspection, a fake, a 503 denial response, or build success alone.
