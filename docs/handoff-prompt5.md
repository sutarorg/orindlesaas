# Handoff to Prompt 5 — Backend, AI, payments, integrations and admin authorization

Status: **Prompt 4 administration frontend implemented and validated on 2026-11-05**. Prompt 5 must research current official SDK/provider APIs and the actual database design before coding. This document is a UI/security contract, not verification of Supabase, Drizzle, Dodo, AI Gateway, Inngest, R2, E2B, Vercel, Upstash or Resend fields.

## Inherited stage boundary

Prompts 1–3 provide the public site, authentication frontend and customer demo workspace. Prompt 4 adds a separate noindex `/admin` operations demo with clearly fictional data and non-persistent preview actions. No admin route is protected, no admin record is real and no preview result proves an operational mutation.

Prompt 5 owns real Supabase SSR sessions, database/repository access, role/permission enforcement, payment and wallet behavior, AI metering/jobs, storage/deployment and persistent auditing. Do not infer authorization from a visible menu, client role, noindex route or fixture actor.

## Implemented Prompt 4 UI map

- `app/admin/layout.tsx` supplies inherited `noindex, nofollow` metadata and `components/admin/admin-shell.tsx`. `app/robots.ts` disallows `/admin` and `/admin/`; the sitemap contains no admin URLs. `app/admin/[...slug]/page.tsx` preserves real unknown-route 404s without a parent streaming boundary.
- Thirteen route pages exist: `/admin`, `/admin/users`, `/admin/models`, `/admin/providers`, `/admin/model-pricing`, `/admin/credit-packages`, `/admin/payments`, `/admin/transactions`, `/admin/usage`, `/admin/jobs`, `/admin/websites`, `/admin/adjustments` and `/admin/settings`.
- `lib/contracts/admin.ts` defines fixture DTOs, intents, permissions and `AdminService`. `lib/admin/fixtures.ts`, `metrics.ts`, `search.ts`, `format.ts`, `navigation.ts` and `permissions.ts` own deterministic demo data and pure presentation calculations.
- `components/admin/` contains the shell, local search, native tables/pagination, accessible SVG trends, dialogs/status primitives and all feature workspaces. `components/admin/admin-overview.tsx` is the overview; other workspace filenames match their domains, with payments and transactions sharing `payments-workspace.tsx`.
- Import the current adapter as `mockAdminService` from `@/lib/mocks/admin-preview`. Every method returns `status: "preview"`, `persisted: false`, `auditPersisted: false`, `paymentChanged: false` and `creditsChanged: 0`. Only `adjustCredits` additionally returns a safe ephemeral `auditPreview`; it never changes the fixture or a wallet.
- Model configuration can edit enabled/products in form state; pricing, package, user, provider, payment, dispute, job and settings operations similarly validate a local intent. None writes localStorage, cookies, a database or a provider. No admin API routes or server mutation handlers exist.

Prompt 5 should replace the adapter at the UI boundary rather than making fixture objects authoritative. Preserve explicit loading/empty/error/unavailable states and do not remove demo disclaimers until every visible value and action comes from an authorized server result.

## Universal backend requirements

- Re-research current official SDKs, model IDs, provider metering and payment webhook fields before implementation.
- Verify identity, current admin membership and explicit permission on the server for every admin read and mutation; deny by default and enforce object/field scope.
- Runtime-validate all request and response DTOs. Browser fixture values never become authoritative prices, costs, balances, statuses, ownership or permissions.
- Use safe error codes/messages and correlation IDs. Never serialize secrets, raw webhooks, access/refresh tokens, payment instrument details, customer prompts/files/code or unrestricted storage/deployment IDs.
- Apply CSRF/origin defenses where applicable, rate limits, idempotency, current-state checks and bounded pagination.
- Require recent step-up authentication for high-impact operations. Record a reference to that evidence, not the credential.
- Write privileged changes and attributable append-only audit events transactionally where appropriate. If the audit cannot be written, do not report the privileged operation as complete.
- Preserve public SEO and private noindex. Robots and hidden navigation do not protect data.

## Proposed admin permission model

`admin-permissions.md` is canonical. The UI contract separates:

- `users:read/manage`
- `catalog:read/manage`
- `pricing:read/manage`
- `payments:read/reconcile`
- `credits:read/adjust`
- `disputes:read/manage`
- `usage:read`
- `jobs:read/retry`
- `websites:read`
- `settings:read/manage`
- `audit:read` and baseline `admin:read`

Proposed bundles are Support analyst, AI operations, Finance operations, Security administrator and tightly controlled break-glass access. These are design contracts, not active roles. Role assignment itself requires a separately approved, highly privileged flow and is not part of the Prompt 4 UI.

## Administrative operations and backend expectations

| UI operation | Proposed permission | Browser intent | Required real behavior |
|---|---|---|---|
| View admin overview | `admin:read` plus dataset-specific reads | Range/filter only | Server aggregates authorized data with timezone/range definitions; omit unauthorized financial/cost fields rather than leaking them |
| Search admin operations | Each returned resource’s read permission | Bounded local query only in Prompt 4 | Server-side type/query/page limits and per-resource/object scope; never reveal the existence of an unauthorized user/payment/job/model |
| Read/clear admin notifications | Source-specific reads plus per-admin notification state | Local read/clear state only | Return only notifications whose underlying data the admin may read; persist per-admin state idempotently without hiding required audit/events |
| Sign out of admin | Authenticated session; no admin mutation permission | Explicit unavailable preview only | Use current Supabase/server sign-out semantics and clear the actual session safely; never treat a client menu action as proof of sign-out |
| Search/view users | `users:read` | Bounded query/page/filter | Server search and safe DTO; object scope; no credentials/tokens/private content |
| Suspend/restore user | `users:manage` + step-up | User ID, requested status, reason | Validate current state and allowed transition; idempotent mutation; policy-safe notification; audit actor/target/reason/outcome |
| Invalidate user sessions | `users:manage` + step-up | User ID, reason | Current Supabase/server session revocation semantics; never browser cookie claims; audit without token data |
| View providers/models | `catalog:read` | Filters only | Server catalogue/configuration joined with allowlisted provider metadata; health data remains secret-safe |
| Configure provider | `catalog:manage` + step-up for impact | Provider ID, enabled state, reason | Versioned server configuration, dependency checks and staged rollout; never accept API keys through this UI |
| Configure model/products | `catalog:manage` + step-up for disabling | Model ID, enabled state, allowed products, reason | Validate model ID and actual per-model capabilities/modalities; version and audit availability changes |
| View/edit model pricing | `pricing:read/manage` + step-up | Model ID, meter/config values, effective time, reason | Authoritative server unit prices and versioning; validate decimal/minor-unit conversion; never retroactively alter usage history |
| View/edit credit packs | `pricing:read/manage` + step-up | Pack ID, price/credits/enabled state, reason | Exact active server configuration, version/effective date, checkout reconciliation and audit; browser price never starts checkout |
| View payments/transactions | `payments:read` and/or `credits:read` | Bounded filters/page | Safe payment/ledger DTOs; field-level restrictions; stable ordering; no card/bank/raw webhook data |
| Reconcile payment | `payments:reconcile` + step-up | Payment ID, reason | Re-read verified provider/webhook records; idempotent fulfillment/reconciliation; no browser-selected success or credit grant |
| Create credit adjustment | `credits:adjust` + step-up | User ID, signed non-zero integer credits, category, ticket/reference, reason | Bounds/policy/dual review as required; transactional append-only ledger and audit; balance derived/reconciled; idempotency and concurrency tests |
| Review dispute | `disputes:manage` + step-up for financial effect | Dispute ID, requested state, reason | Verified provider/legal workflow, restricted evidence, idempotent state transition, ledger implications and audit |
| View AI usage/costs | `usage:read` | Range/product/model filters | Authorized reconciled provider cost and metered usage; stable metric definitions; internal cost never reaches public/customer DTOs |
| View generation jobs | `jobs:read` | Filters/page/job ID | Redacted diagnostics and safe provider correlation; no prompts, files, code, signed URLs, secrets or raw responses |
| Retry generation job | `jobs:retry` + policy-based step-up | Job ID, reason | Verify scope/state/retry budget; provider idempotency; no duplicate charge/credit deduction; verified queued result and audit |
| View website projects | `websites:read` | Filters/project ID | Safe owner/status/domain/deployment metadata only; customer code/files require a separate explicit permission and are not in this UI |
| Change admin preferences | `settings:read/manage` as applicable | Allowlisted display/notification values | Validated per-admin persistence; no roles, secrets or organization security settings through preference controls |
| View audit records | `audit:read` | Bounded filters | Append-only, access-controlled safe events with actor/action/target/reason/time/correlation and allowlisted diff |

## Financial contract and reconciliation

Money is integer minor units (USD cents in the initial UI). Credits are integers. `100 credits = $1` **customer-facing usage value**, not $1 of cash receipts.

- Demo “Total revenue” maps in production to a precisely defined captured-payment aggregate, not automatically to accounting-recognized revenue.
- Customer usage value derives from actual server credit deductions.
- Provider cost derives from verified/reconciled provider metering or invoices and remains restricted.
- Gross contribution = customer usage value − provider cost; it excludes payment fees, infrastructure, support, taxes, refunds and other operating expenses.
- Failed generation cost includes only verified provider charges associated with failed generation outcomes; some failures may cost zero.
- Unreconciled usage is an explicit server state requiring investigation, not a browser guess.

Prompt 5 must get finance/product approval for final metric names, time zones, taxes, refunds/chargebacks and recognition rules. Never describe modeled usage value as actual received revenue.

## Database and API conceptual mapping

The repository currently has no implemented Drizzle schema or route handlers. Expected server-owned entities include admin memberships/roles/permissions, user/account status records, provider/model configuration and immutable price versions, credit packs, payments/webhook events, wallet ledger entries, credit adjustments, disputes, usage/cost records, background jobs, website/deployment metadata and append-only admin audit events.

A payment provider event/payment ID maps to exactly one idempotent fulfillment path. A usage event references the applicable server model-price version and verified metered quantity. A credit adjustment references actor, reason, ticket and ledger/audit IDs. Every record has explicit ownership/scope, retention and redaction rules.

## Existing customer/public operations to integrate without regression

`api-contracts.md`, `data-model.md`, `handoff-prompt4.md` and the existing frontend contracts remain authoritative for customer auth, generation, projects, library, wallet, settings and website behavior. Preserve safe constrained Markdown/code, signed media ownership, server generation estimates, job status/cancellation semantics, append-only wallet behavior and verified idempotent payment fulfillment.

Real callback/auth work replaces the existing presentation placeholder using current Supabase SSR guidance. Do not copy legacy Auth Helpers or treat Next Proxy as complete authorization.

## Required security and integration tests

- Anonymous, non-admin, wrong-role, expired-membership, object-scope and field-level authorization bypass for every admin route/endpoint.
- Direct endpoint access when navigation/actions are hidden; browser role/price/balance/status tampering.
- Step-up expiry, replay/idempotency, stale state, concurrent adjustment and audit-write failure.
- Payment webhook signature/replay and fulfillment exactly once; dispute/chargeback reconciliation.
- Credit insufficient-balance/concurrency and adjustment ledger invariants.
- Provider/model capability mismatch, price-version effective dates and cost reconciliation.
- Job retry/cancel budgets and duplicate-charge prevention; redaction of prompts/files/code/secrets.
- Website deployment isolation and no customer-code exposure through project metadata.
- CSRF/origin, rate limits, runtime validation, safe error mapping and secret scans.

No live production deployment, destructive migration, paid provider call or real administrative mutation is authorized by this handoff.

## Observed Prompt 4 frontend evidence

On 2026-11-05 the final frontend passed strict TypeScript, ESLint with no warnings, 57/57 unit/component tests and the Next 16.4.5 production build with all 13 admin routes. Production Chromium passed 91/91 Playwright tests, including 14 admin tests and every inherited public/auth/customer regression. All 13 admin routes passed the selected axe WCAG A/AA tags and 49 route/viewport overflow combinations passed. Desktop Overview/Users/Usage and mobile Overview were visually inspected; all routes had no browser console/page errors.

These checks demonstrate frontend behavior only. They do not test or prove admin authentication, authorization, database integrity, actual payment/provider cost, persistent audit, job retry, real deployment or security readiness.

## Prompt 5 delivery evidence

Replace each mock only with a tested server adapter and update UI copy from actual validated results. Keep a visible unavailable/error state where an integration is not configured. Record exact tests and remaining limits in `progress.md`, `quality-assurance.md`, `production-readiness.md` and both synchronized risk documents. Frontend build success or a visible admin fixture is never administration-security sign-off.
