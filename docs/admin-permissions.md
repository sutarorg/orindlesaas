# Admin permissions and authorization contract

Status: **proposed for Prompt 5; not implemented or enforced in Prompt 4**. The admin demo has no authenticated actor, active role or authorization result. Route visibility and form availability are presentation only.

## Principles

1. Verify identity and current admin membership on the server for every request.
2. Deny by default. Require an explicit permission for each route, field set and operation.
3. Enforce least privilege independently of seniority or job title; re-check object scope and current permission version.
4. Never trust browser role claims, hidden controls, fixture ownership or client-side validation.
5. Require a recent step-up authentication for high-impact financial, account, provider and configuration operations.
6. Validate intent, use idempotency keys and write the operational mutation plus append-only audit event in an authorized server transaction where applicable.
7. Return only display-safe fields. Restrict internal costs, security details, customer content and deployment metadata separately from basic read access.

OWASP Authorization and Logging guidance informs least privilege, deny-by-default, attributable audit records and separation of operational/security logs. Prompt 5 must re-read current guidance and translate it into tested server controls.

## Proposed permission names

| Permission | Intended scope |
|---|---|
| `admin:read` | Enter the admin read shell; does not grant every dataset |
| `users:read` / `users:manage` | Read safe user operations data / approved account actions |
| `catalog:read` / `catalog:manage` | Read models/providers / change availability configuration |
| `pricing:read` / `pricing:manage` | Read restricted price configuration / version model prices and packs |
| `payments:read` / `payments:reconcile` | Read payment operations / perform reviewed reconciliation actions |
| `credits:read` / `credits:adjust` | Read balances/ledger / create audited credit adjustments |
| `disputes:read` / `disputes:manage` | Read disputes / reviewed dispute workflow actions |
| `usage:read` | Read restricted provider-cost and usage aggregates |
| `jobs:read` / `jobs:retry` | Read redacted jobs / request safe server retry |
| `websites:read` | Read safe project/deployment metadata, not customer code |
| `settings:read` / `settings:manage` | Read admin preferences / change authorized admin configuration |
| `audit:read` | Read permitted append-only audit records |

These are contract names, not implemented enum claims from a database. Prompt 5 may version/rename them after reviewing the actual authorization model, but must preserve least-privilege separation.

## Proposed roles

Roles are convenient permission bundles, not hardcoded client checks. Exact production role names and assignment approval remain an owner decision.

| Role | Typical permissions | Explicit exclusions |
|---|---|---|
| Support analyst | `admin:read`, safe `users:read`, `payments:read`, `jobs:read`, `websites:read`, `disputes:read` | No provider costs, customer code/files, pricing changes, credit adjustment, retries or account suspension |
| AI operations | Support-safe reads plus `catalog:read/manage`, `usage:read`, `jobs:retry` | No payment reconciliation, credit adjustment, role management or unrelated user actions |
| Finance operations | `admin:read`, `users:read`, `pricing:read/manage`, `payments:read/reconcile`, `credits:read/adjust`, `disputes:read/manage`, `usage:read`, `audit:read` | No provider/model availability, job retry, customer code or role administration |
| Security administrator | `admin:read`, `users:read/manage`, `settings:read/manage`, `audit:read` | No payment/credit/pricing operations by default; role assignment requires a separate approved flow |
| Break-glass administrator | Time-bound, individually approved superset with mandatory step-up and enhanced audit | Never a persistent shared browser role; not a substitute for scoped service access |

No user receives a break-glass role from this frontend. A production role-assignment UI is outside Prompt 4.

## Route permission map

| Route | Minimum read permission | Additional restricted fields/actions |
|---|---|---|
| `/admin` | `admin:read` | Financial/cost cards require their related read permissions |
| `/admin/users` | `users:read` | `users:manage` for approved account/session actions |
| `/admin/models` | `catalog:read` | `catalog:manage` for availability |
| `/admin/providers` | `catalog:read` | `catalog:manage`; secret-safe health detail only |
| `/admin/model-pricing` | `pricing:read` | `pricing:manage`; provider costs remain restricted |
| `/admin/credit-packages` | `pricing:read` | `pricing:manage` |
| `/admin/payments` | `payments:read` | `payments:reconcile` |
| `/admin/transactions` | `payments:read` or `credits:read` as defined server-side | No mutation from ledger view |
| `/admin/usage` | `usage:read` | Internal cost requires field-level authorization |
| `/admin/jobs` | `jobs:read` | `jobs:retry`; redacted diagnostics |
| `/admin/websites` | `websites:read` | No generated code/file access implied |
| `/admin/adjustments` | `disputes:read` for disputes; `credits:read` for ledger context | `credits:adjust` or `disputes:manage` per action |
| `/admin/settings` | `settings:read` | `settings:manage`; role assignment not included |

## High-impact operation controls

| Operation | Permission | Step-up | Reason | Additional server controls |
|---|---|---:|---:|---|
| Suspend/restore account or invalidate sessions | `users:manage` | Required | Required | Object scope, current-state check, idempotency, safe user notification policy |
| Provider/model availability change | `catalog:manage` | Required for disabling/production impact | Required | Versioned config, dependency/capability validation, staged rollout |
| Model/package price change | `pricing:manage` | Required | Required | Server price validation, effective dates, immutable versions, no retroactive rewrite |
| Payment reconciliation | `payments:reconcile` | Required | Required | Verified provider records, idempotency, no browser-selected fulfillment |
| Credit adjustment | `credits:adjust` | Required | Required + ticket/reference | Non-zero bounded integer, dual-review policy if required, transactional append-only ledger + audit |
| Dispute action | `disputes:manage` | Required for financial effect | Required | Provider/legal workflow, evidence access control, idempotency |
| Retry generation job | `jobs:retry` | Policy-based | Required | Ownership/scope, retry budget, provider idempotency, no duplicate credit deduction |
| Admin configuration | `settings:manage` | Required | Required | Allowlisted keys only; never browser-supplied secrets/roles |

## Audit-event contract

A real privileged mutation should produce an append-only event with:

- Event ID, actor ID and actor role/permission snapshot/version.
- Action, target type and safe target ID.
- Substantive reason and optional support/change reference.
- Allowlisted before/after diff; never secrets, raw payment payloads, customer prompts/files/code or tokens.
- UTC timestamp, correlation ID, idempotency key, outcome and safe failure code.
- Step-up evidence reference where applicable, without exposing the credential itself.

Audit writes must be attributable, tamper-resistant and access-controlled. Prompt 4's local `auditPreview` is only a visual example and always has `persisted: false`.

## Backend enforcement expectations

Use current Supabase SSR verified claims plus a server-owned admin membership/permission repository. Apply authorization in Server Components/route handlers and again in mutation services/database policies as appropriate. Service-role credentials, if ever needed, remain server-only with narrowly scoped operations. Do not rely on Proxy, noindex, robots or React rendering.

Test anonymous, authenticated non-admin, wrong-role, expired-membership, cross-object, field-level and direct-endpoint bypass cases. Test replay, stale state, concurrent adjustments, insufficient step-up and audit failure. A failed audit write must not be presented as a completed privileged mutation.
