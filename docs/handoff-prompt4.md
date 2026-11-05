# Handoff to Prompt 4 — Workspace refinement and administration UI

Status: **Prompt 3 implemented and validated on 2026-11-05**. This is the actual customer-workspace baseline for Prompt 4 refinement and a separate future administration UI. Real backend behavior remains Prompt 5 work.

## Prompt 3 completion evidence

- All 16 required customer routes are implemented under `/app`, plus a workspace-safe catch-all 404. Public/auth URLs retain their original chrome through `(site)`.
- Strict TypeScript and ESLint pass. Vitest passes **40/40 tests in 10 files**, and the Next 16.4.5 production build passes its 46-page generation phase.
- Production Playwright passes **77/77 tests**, including all 40 Prompt 1/2 regressions and 37 dashboard tests. Sixteen workspace axe scans report zero violations for the selected WCAG 2/2.1/2.2 A/AA tags.
- All 16 workspace routes pass 320, 390 and 1440px overflow checks (**48/48 combinations**). Mobile drawer Escape/focus return, dynamic/unknown IDs, noindex/robots/sitemap, product controls, dialogs and no-operation claims are covered. A rendered-link audit checked 49 internal URLs and 21 fragments with zero broken targets.
- Representative production screenshots were inspected for desktop overview, mobile chat, desktop Image Studio, desktop/mobile website editor and mobile Credits. No browser console errors occurred in that review.
- `npm audit --audit-level=high` reports zero vulnerabilities. Secret-pattern and dashboard network/storage scans report no matches.

These are frontend-fixture results only. They do not demonstrate authentication, authorization, persistence, AI output, payment, credit mutation, email, deployment or administration readiness.

## Shared dashboard shell to inherit

The canonical customer workspace is `/app`; earlier root-level `/dashboard` suggestions are superseded. Preserve the URL-neutral `app/(site)/` group for public/auth chrome and the independent `app/app/layout.tsx` for the customer shell.

The unified DashboardShell provides:

- Persistent desktop sidebar and accessible mobile drawer with Escape/focus return.
- Main, Workspace and Account groups only: Overview, Chat, Image Studio, Video Studio, Websites; Projects, Library, History; Credits & Wallet, Settings, Help & Support.
- Contextual top bar/breadcrumbs, universal fixture-labelled balance, notifications and demo profile menu.
- Persistent demo-workspace disclosure, noindex metadata and no marketing header/footer.
- Responsive page/panel composition and explicit empty/loading/error/session-state presentations.

Do not add a generic dark admin theme or move every setting into the sidebar. `/admin` is a separate future shell, not a customer-sidebar item.

## Mock data and interaction structures

`lib/contracts/dashboard.ts` defines display-safe DTOs and mutation-like service methods. `lib/dashboard/` contains typed fixtures, navigation, model registry, estimates and formatting/filter helpers. `lib/mocks/dashboard-preview.ts` is the only Prompt 3 mutation adapter.

Every fixture workspace is explicitly illustrative. `DashboardPreviewResult` returns `status: "preview" | "unavailable"`, a safe message, `persisted: false` and `creditsChanged: 0`. No fixture or adapter result is proof of authentication, payment, generation, storage, entitlement, save, deployment or deletion.

The model registry includes documented model ID, display name, provider, product, capabilities, modalities, context where verified, pricing display, availability and feature tags. `availability: "catalog-fixture"` means the ID was researched, not that Orindle can call it. Auto is a UI routing option, not a model ID. Revalidate the date-sensitive registry before real integration.

Chat uses typed message DTOs and safe constrained markdown/code rendering. Estimates use `CreditEstimate` with `fixture: true`, `pricingKind: "estimate"` and `quoteId: null`; static progress never advances. File inputs select names locally without uploading. Website code remains text and the structured local preview executes no arbitrary scripts. All generated fixture media is labelled and locally hosted.

## Backend contracts required in Prompt 5

Re-research current official SDK/provider APIs before implementing these boundaries:

- **Identity/access:** verified Supabase SSR session, workspace/profile lookup and per-object authorization for every project, conversation, asset, website, wallet and ledger entry. Client visibility and fixture ownership never authorize data.
- **Model registry/chat:** server-allowlisted model IDs/capabilities and current AI SDK UI transport. Map typed message parts and submitted/streaming/ready/error states. Implement real stop/regenerate semantics; client disconnect is not necessarily cancelled generation.
- **Generation/jobs:** server-issued estimates, idempotent job creation, verified provider status/progress, safe retries/cancellation, output ownership and signed media delivery. Never accept browser progress or final credits.
- **Uploads/library:** type/size validation, malware/content handling as appropriate, R2 object ownership and short-lived signed URLs. Do not expose secret keys or unrestricted object identifiers.
- **Projects/websites:** persistent repositories, safe versioned saves, sanitized/validated generated code, isolated E2B execution and controlled deployment. Publish only from verified server results and return validated preview/deployment URLs.
- **Wallet:** server-configured exact pack pricing, verified idempotent Dodo payment fulfillment, append-only transactional ledger, sufficient-balance/concurrency controls and actual metered deductions. Browser estimates and redirects never grant credits.
- **Settings/support/deletion:** authenticated validated mutations, safe connected-account OAuth, notification delivery preferences and an audited deletion-request workflow. Do not imply immediate deletion from a request.

All network boundaries require runtime validation, safe error codes, rate limiting and CSRF/origin defenses as applicable. Never serialize provider secrets, internal costs, raw webhooks or unrestricted deployment/storage identifiers.

## Administration UI requirements

A later administration frontend must be designed separately from the customer workspace and only appear after verified server role/permission checks. A hidden route or browser role fixture is not administration security.

Recommended admin shell and navigation:

1. **Overview:** meaningful operational summaries and actionable exceptions, not fabricated analytics.
2. **Users & workspaces:** search, account/workspace details, status and support-safe impersonation alternatives; never expose raw credentials/tokens.
3. **Models & pricing:** provider/model availability, capability review, public/display pricing and versioned server price configuration with effective dates.
4. **Credits & purchases:** purchase/ledger lookup, reconciliation, payment status and tightly controlled adjustment/refund workflows. Browser input never directly changes balance.
5. **Jobs & generations:** queue/processing/failure inspection, safe retry/cancel controls and provider correlation IDs with sensitive payloads redacted.
6. **Content moderation/support:** review queues, user reports, abuse handling and audited support actions with clear escalation.
7. **Audit log:** append-only actor/action/target/time/correlation records for privileged changes.
8. **System/configuration:** feature flags and integration health only where permissions and secret-safe presentation are explicitly designed.

Admin UX requirements include a distinct restrained shell, explicit role/permission context, server-confirmed mutations, step-up authentication where required, destructive-action confirmation, idempotency, audit reasons and safe error states. Do not fabricate admin roles, operational health, payment metrics, user data or audit records for a real environment. Administration remains outside Prompt 3 routes.

## Validation and documentation expected

Preserve Prompt 1/2/3 regressions. Add unit/component/E2E coverage for every new admin route and permission state when administration is implemented. Test authorization bypass, cross-workspace access, unsafe markdown/code/uploads, webhook replay, credit concurrency, job retry/cancel, deployment isolation, keyboard/mobile operation and no-operation preview behavior.

Run strict TypeScript, ESLint, unit tests, production build, responsive/axe checks and representative visual review. Update route/data/API/security/testing/progress/risk documents with actual evidence. Do not mark authentication, generation, payment, save, deployment, administration or launch readiness complete from frontend fixtures.
