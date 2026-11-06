# Task checklist

Status keys: `[ ]` not started, `[~]` in progress, `[x]` implemented and appropriately validated. Do not mark code generation alone as complete.

## Documentation and research

- [x] Inspect repository, tools and existing assets.
- [x] Create/populate all required global documentation before application code.
- [x] Research current official Next.js metadata/SEO/performance/accessibility guidance.
- [x] Complete article-specific intent and primary-source research.
- [x] Record exact installed dependency versions.

## Foundation and shared UI

- [x] Scaffold App Router, strict TypeScript, Tailwind and shadcn-compatible primitives.
- [x] Configure Poppins/Inter, premium-white tokens and global prose/focus styles.
- [x] Build original Orindle mark, header, Products menu, mobile navigation and footer.
- [x] Build buttons, containers, section headings, accordions and resilient states.
- [x] Add typed product, model, credit-pack and article content models.

## Public pages

- [x] Homepage with all specified sections and four distinct product visuals.
- [x] `/features` and four detailed product routes.
- [x] `/pricing` with exact one-time packs and transparent usage explanation.
- [x] `/models` with date-sensitive selection guidance and no fake availability.
- [x] `/about`, `/contact`, `/faq`.
- [x] `/privacy`, `/terms`, `/credits-policy`; verify no `/refund-policy`.
- [x] `/blog` listing and six substantial dynamic articles.

## SEO and assets

- [x] Unique metadata/canonical/OG for every route and article.
- [x] Sitemap, robots and private-route noindex handoff requirements.
- [x] Organization, SoftwareApplication, Article, BreadcrumbList and eligible Offer JSON-LD.
- [x] Original favicon and social image; update asset inventory.
- [x] Semantic headings, descriptive links and crawlable article body.

## Validation and delivery

- [x] Unit/content integrity tests pass: 11/11.
- [x] TypeScript strict check and ESLint pass.
- [x] Production build passes.
- [x] Playwright navigation, metadata, responsive overflow and accessibility checks pass: 16/16.
- [x] Manual representative-page visual and keyboard review completed.
- [x] No dead internal links, fake transactions, fake social proof or exposed secrets found in the completed audits.
- [x] Documentation/progress/decisions/assets updated with evidence.
- [x] `handoff-prompt2.md` completed for authentication stage.

## Prompt 2 — authentication frontend

### Documentation and research

- [x] Inspect the merged Prompt 1 repository, auth previews, contracts and relevant documentation.
- [x] Research current official Supabase password/OAuth/redirect/SSR guidance, Next 16 routing/Proxy, WCAG/WAI authentication forms and NIST password UX.
- [x] Create `authentication-design.md` and `authentication-flows.md`; update architecture, routes, requirements, accessibility and security baseline before code.
- [x] Clarify staging: Prompt 2 is frontend-only; Prompt 5 owns real Supabase/session behavior.
- [x] Create the Prompt 3 application-shell handoff baseline.

### Implementation

- [x] Build shared auth shell and reusable input/label/checkbox/password/alert components.
- [x] Implement `/login` and `/signup` forms, validation, password visibility, remember-me/terms and planned OAuth feedback.
- [x] Implement `/forgot-password`, `/reset-password`, `/verify-email` and `/auth/callback` presentations.
- [x] Add typed signup/login/logout/reset/verification/OAuth/session/route-protection contracts and preview-only mock adapters.
- [x] Implement all required allowlisted error, loading, cancellation, verification and expiry states without account enumeration or false success.
- [x] Preserve pack display intent, noindex metadata, sitemap exclusion and public visual tokens.

### Validation and delivery

- [x] Unit tests cover validation, state parsing and every mock method's non-operational result.
- [x] Component/E2E tests cover invalid input, mismatch, loading, visibility, keyboard access, OAuth feedback and no-success claims.
- [x] Every auth route and presentation state renders at mobile/desktop widths without overflow or serious axe violations.
- [x] Strict TypeScript, ESLint and production build pass alongside Prompt 1 regressions.
- [x] Inspect representative auth pages visually and update QA/progress/assets/decisions with actual evidence.
- [x] Finalize `handoff-prompt3.md` with exact implemented imports, user-state assumptions and shell requirements.

## Prompt 3 — customer dashboard frontend

### Documentation and research

- [x] Inspect the merged repository, Prompt 3 handoff and previous design/architecture decisions.
- [x] Research current Next.js nested/dynamic routes, shadcn sidebar/AI patterns, AI SDK UI message states and WCAG responsive reflow.
- [x] Research official current model IDs/capabilities for a date-labelled catalogue fixture.
- [x] Create/update dashboard architecture, navigation, shared requirements/contracts/data/routes/design/accessibility/plans/risks and Prompt 4 handoff before application code.

### Shell and shared contracts

- [x] Separate public/auth chrome with a URL-neutral route group and implement the unified noindex `/app` shell.
- [x] Add desktop/mobile navigation, contextual top bar, fixture balance, notifications, demo profile and state presentations.
- [x] Add typed dashboard contracts, documented model registry, shared fixtures, estimates and non-persistent preview adapter.

### Product and workspace experiences

- [x] Implement the intelligent `/app` overview and complete chat/new-conversation/message states.
- [x] Implement Image Studio and Video Studio configuration, history/job states, previews and honest actions.
- [x] Implement website overview, creation, responsive editor and settings routes.
- [x] Implement Projects, Library, History, Credits/Wallet and Settings/Support with useful local interactions.

### Validation and delivery

- [x] Unit/component tests cover fixtures, registry, estimates, mock methods, safe markdown, filters and validation.
- [x] E2E tests cover every route/dynamic ID, shell navigation, product controls, dialogs, states and no-operation claims.
- [x] Verify 320–1440px responsive behavior, keyboard/focus handling and representative axe scans.
- [x] Strict TypeScript, ESLint, unit tests and production build pass alongside Prompt 1/2 regressions.
- [x] Inspect representative desktop/mobile application views and finalize QA/progress/assets/decisions.
- [x] Finalize `handoff-prompt4.md` with actual shell, fixture, backend and administration requirements.

## Prompt 4 — administration frontend

### Documentation and research

- [x] Inspect the merged repository, all shared docs, Prompt 4 handoff and conceptual database/API contracts; confirm no implemented schema/route handlers/RBAC.
- [x] Research admin IA, native table/grid semantics, responsive toolbars/pagination, chart accessibility, dialogs/status messages, least privilege and audit logging.
- [x] Create admin architecture, requirements, permissions, navigation, data-contract and design documents.
- [x] Update shared architecture/routes/data/API/design/accessibility/security/testing/plans/risks and the Prompt 5 operations handoff before application code.

### Shell and shared contracts

- [x] Implement the independent noindex `/admin` shell, responsive sidebar, top navigation, search, breadcrumbs, notifications/profile and safe catch-all.
- [x] Add typed fictional operational fixtures, financial/metric helpers, proposed permission maps and a non-persistent admin adapter.
- [x] Build semantic responsive table/pagination, status, chart, detail and two-step confirmation primitives.

### Administration experiences

- [x] Implement the required overview metrics, accessible range-aware charts and exception navigation.
- [x] Implement user management, provider/model management and model pricing configuration previews.
- [x] Implement exact credit packages, payments, transactions and defined usage/cost monitoring.
- [x] Implement generation-job diagnostics, safe website-project metadata and adjustment/dispute workflows with audit previews.
- [x] Implement local admin preference previews and the proposed access-model presentation.

### Validation and delivery

- [x] Unit/component tests cover fixtures, metrics, navigation, filters/pagination, validation and every no-operation adapter method.
- [x] E2E tests cover all 13 routes, search/filter/pagination, dialogs/confirmations, adjustment audit preview, discovery and unknown-route 404s.
- [x] Verify every admin route at 320/390/1440px and with axe; inspect representative desktop/mobile views and keyboard flows.
- [x] Strict TypeScript, ESLint, unit tests and production build pass alongside every Prompt 1/2/3 regression.
- [x] Finalize QA/progress/assets/decisions and `handoff-prompt5.md` with actual operations, permissions, UI contracts and backend expectations.

Commercial launch tasks remain explicitly open in `production-readiness.md`; this checklist does not claim real backend services, admin authorization, field performance or legal sign-off.

## Prompt 5 — production backend integration

### Documentation and research

- [x] Inspect the inherited routes, contracts, fixtures/mocks, environment template and all documentation inventories; confirm no backend handlers/schema/authz exist.
- [x] Research current official Next.js, Supabase SSR/RLS, Drizzle, AI SDK/Gateway, R2, Inngest, E2B, Vercel API, Upstash and Resend guidance.
- [x] Inspect official Dodo checkout/webhook/credit/framework/testing skills and installed-target SDK declarations; select Checkout Sessions and raw-body `webhooks.unwrap()`.
- [x] Define architecture, database/RLS/migrations, versioned API, payment/ledger, AI/metering/jobs, storage/sandbox, authorization, redaction/observability and verification contracts before backend code.

### Implementation

- [~] Add validated server environment, Drizzle schema/migrations/seeds and real Supabase cookie authentication/route protection. Code/local fail-closed tests are complete; live migration and Supabase journeys are blocked.
- [~] Add versioned validated APIs, safe errors, request correlation, same-origin/CSRF controls, Upstash limits and Resend delivery. Implementation and abuse-control tests pass; live Upstash/Resend delivery is unverified.
- [~] Implement atomic wallet/ledger/reservations/settlement/compensation/reconciliation and concurrency/idempotency tests. Exact arithmetic units and disposable CI PostgreSQL races pass; hosted Supabase/provider reconciliation remains required.
- [~] Implement exact Dodo one-time checkout and verified raw-body exactly-once webhooks with product/amount/currency/purchase validation. Adapter/validation and disposable PostgreSQL replay/race tests pass; signed Dodo test-mode delivery and provider reconciliation remain required.
- [~] Implement actual AI chat/image/video/website operations, model/capability/price sync, actual-cost metering and durable jobs/outbox. Code/provider fakes pass; no live Gateway/Inngest operation was attempted.
- [~] Implement R2 ownership/signed access, E2B build isolation and scoped Vercel preview deployment without app-server execution. Code/static tests pass; live storage/sandbox/deployment is unverified.
- [~] Replace mock adapters with real services and implement deny-by-default admin reads/actions, recent AAL2 step-up and append-only audit. Routed demo workspaces are removed; credentialed role/action tests remain required.

### Validation and delivery

- [~] Unit/security/smoke tests cover local authz, validation, webhook mismatch, exact-cost and insufficient-balance logic; disposable PostgreSQL RLS/grant/replay/concurrency evidence now passes, while hosted Supabase and credentialed role/provider journeys remain blocked.
- [x] Provider fakes prove job retry/idempotency/uncertain-state behavior; no fake is silently used in production.
- [x] Preserve public UX and run strict typecheck/lint/build plus feasible browser/accessibility/responsive regressions: 106/106 unit, 50/50 production Playwright, clean checks and 45-page build.
- [x] Reconcile documentation and record actual evidence, credential blockers, migration/setup steps and production-readiness limits in `handoff-prompt6.md`.
- [x] Do not run paid providers, live deployment or destructive production migration without explicit authorization; none was run.

Prompt 5 source implementation/local validation is complete, but the `[~]` items prevent a live-backend or commercial-launch completion claim. See `handoff-prompt6.md` for the exact release gates.

## Prompt 6 — independent QA, security and release verification

### Documentation and research

- [x] Read all 54 inherited docs and the root README; independently inventory routes, tests, server modules, migrations and environment/runtime availability before tests or application edits.
- [x] Refresh current official Next.js, Playwright, Vitest, WCAG/WAI, OWASP, Supabase and PostgreSQL guidance.
- [x] Create the independent test matrix/scenarios and specialized security, credit, payment, AI, mobile, accessibility, SEO and performance plans before execution.
- [x] Create bug/failure registers, release/readiness checklists, deployment/rollback procedures, domain/final reports and final handoff scaffolds without inventing results.

### Execution and remediation

- [x] Run fresh strict checks, 26 unit files/126 tests, a 45-page production build and production browser suites with retained evidence; final local Chromium passed 80/80.
- [x] Add repeatable nine-job CI, fixtures, five browser projects and integration coverage; credential-dependent checks remain explicitly Blocked rather than silently passed. Run `42084593285` passed all jobs; subsequent PR failures are retained and replacement final-HEAD CI remains a separate gate.
- [x] Reproduce, prioritize, fix and retest QA-001 through QA-010, including direct/embedded website isolation, DTO redaction, idempotency scope, webhook mismatch, structured-data consistency and intermittent home/mobile LCP.
- [x] Execute seven real disposable PostgreSQL migration/RLS/grant/concurrency/replay tests; hosted Supabase remains separate blocked evidence.
- [x] Confirm Supabase/Dodo/provider credentials and authorization are absent, retain explicit Blocked states, and perform no live journey or unbounded provider smoke.
- [x] Complete managed five-browser/mobile-emulation, public-route axe/scripted keyboard/reflow, technical SEO and repeated Lighthouse checks; exact-`4244b69` local matrix passed 24/24. Historical CI gates passed, while the replacement final-HEAD run remains pending after later retained failures.
- [ ] Complete manual WCAG/200–400% zoom/forced-colors/named-AT, authenticated accessibility, physical iOS/Android, field CWV and production indexing/Search Console evidence; these remain blocked or unexecuted.
- [ ] Resolve critical hosted/provider and operational blocked cases, complete staging backup/restore/rollback/monitoring drills and obtain legal/support/finance/security/operations approval before any launch. Reproduced local P0/P1 defects are closed, but this launch gate is not met.

### Final reconciliation

- [x] Reconcile matrix, reports, task/progress, both risk copies, production readiness and handoff against exact observed results; retain NO-GO while critical evidence is missing.
- [x] Do not run real money, destructive production security tests, unrestricted live AI, untrusted app-server code or production deployment without explicit authorization; none has occurred in Prompt 6.
