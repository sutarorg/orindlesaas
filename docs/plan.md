# Implementation plan

Status: Prompts 1–4 are implemented and validated as frontend stages. Prompt 5 owns real Supabase/session, backend and admin authorization behavior. Later-stage work begins from the relevant handoff, not by treating this plan as provider API verification.

## Milestone 0 — Documentation and research (completed)

Inspect repository, inventory tools, create all required documents, record official references and define route/design/content boundaries. Exit: required docs populated before application code.

## Milestone 1 — Foundation

Create Next.js App Router + strict TypeScript project, install mutually compatible Tailwind/shadcn-compatible utilities/Lucide/Motion versions, configure fonts/tokens, testing and base SEO helpers. Exit: foundation typechecks/lints and shared layout renders.

## Milestone 2 — Shared experience and content model

Build logo, responsive header/Products menu, footer, buttons, section headings, accordion and typed products/pricing/articles source. Implement canonical/JSON-LD helpers. Exit: navigation and content integrity unit tests pass.

## Milestone 3 — Homepage and feature pages

Art-direct hero ecosystem, four distinct product chapters, model/why/workflow/use-case/credits/pricing/FAQ/final sections. Build features overview and four detailed feature routes from reusable data without repetitive layouts. Exit: all routes and CTAs inspected.

## Milestone 4 — Pricing, models and company/support/policy pages

Implement transparent pricing, model-selection guidance with availability labels, about, honest contact preview, FAQ and three legal/credits pages. Exit: pricing/policy content review and no simulated success.

## Milestone 5 — Six-article cluster

Complete intent/source research, draft six distinct substantial guides, add practical diagrams/examples/TOCs/internal and authoritative external links. Build listing/dynamic article rendering and metadata. Exit: all slugs, structured content and related links validate.

## Milestone 6 — SEO and resilient states

Add sitemap, robots, Open Graph image, favicon, breadcrumbs, not-found/error states and metadata across routes. Exit: built HTML/head inspection and route tests pass.

## Milestone 7 — Validation and handoff

Run typecheck, lint, unit tests, production build and Playwright viewport/navigation/accessibility tests. Inspect representative pages in live preview. Update all docs, sync risk copy and complete `handoff-prompt2.md`. Exit: acceptance criteria evidenced; unresolved launch-only items clearly separated.

## Prompt 2 Milestone 0 — Authentication documentation and research (completed)

Read the merged public-site implementation and all relevant docs. Research current official Supabase Auth, Next 16, WCAG/WAI and NIST guidance. Define the shared shell, frontend-only staging, provider-neutral contracts, safe state copy and Prompt 3 shell handoff before changing application code. Exit: required docs updated and risk copies synchronized.

## Prompt 2 Milestone 1 — Shared auth primitives

Implement the shell, input/label/checkbox primitives, password visibility/guidance, alert/status components and pure validation helpers. Exit: strict types/lint pass on the new primitives and component tests cover labels, errors and keyboard behavior.

## Prompt 2 Milestone 2 — Email/password routes

Build login, signup, forgot-password and reset-password forms with local validation, loading feedback and preview-only mock results. Preserve pack intent and Terms/Privacy navigation. Exit: invalid email, weak password, mismatch and required-consent paths inspected.

## Prompt 2 Milestone 3 — Verification, OAuth and callback states

Implement verification/resend, planned Google/GitHub feedback, static callback and allowlisted server-state presentations. Add typed session/logout/route-access contracts that cannot report authenticated success. Exit: every required state is inspectable without real auth or account enumeration.

## Prompt 2 Milestone 4 — Validation and Prompt 3 handoff

Run unit/component/E2E, strict typecheck, lint, production build, responsive/axe scans and representative visual review. Synchronize risk copies and finalize research, QA, progress, assets and `handoff-prompt3.md`. Exit: all auth routes and states validated; real Supabase/session limitations are explicit.

## Prompt 3 Milestone 0 — Dashboard documentation and research

Inspect merged implementation and handoffs. Research current nested layouts/dynamic params, shadcn sidebar/AI patterns, AI SDK UI states, WCAG reflow and official model IDs. Finalize dashboard architecture/navigation, fixture trust boundaries, shared docs and Prompt 4 handoff. Exit: documentation-only checkpoint shows every required doc updated and risk copies synchronized.

## Prompt 3 Milestone 1 — Chrome separation, shell and contracts

Move public/auth routes into URL-neutral `(site)`, isolate root/nested layouts and build the `/app` shell. Add navigation, top bar, demo states, typed fixtures/models/estimates and preview adapter. Exit: public/auth regressions and shell unit/component tests pass.

## Prompt 3 Milestone 2 — Overview and Chat

Build the intelligent overview, complete conversation workspace, safe markdown/code rendering, registry/Auto selector, composer, attachments and chat state controls. Exit: new/detail/unknown routes and copy/stop/regenerate/no-request behavior inspected.

## Prompt 3 Milestone 3 — Image, Video and Websites

Build task-specific generation configuration and histories/jobs, then website overview/creation/editor/settings. Add local generated fixture assets, responsive preview and honest mutation feedback. Exit: every product control works locally or explains its unavailable operation.

## Prompt 3 Milestone 4 — Shared workspace and validation

Build Projects, Library, History, Credits/Wallet, Settings and Support. Run unit/component/E2E, strict typecheck, lint, production build, responsive/axe and visual review. Exit: all routes and dynamic IDs pass, Prompt 1/2 regressions remain green and `handoff-prompt4.md` matches actual behavior.

## Prompt 4 Milestone 0 — Administration documentation and research (completed)

Inspect all shared docs/contracts and confirm no implemented database/API authorization exists. Research native table/grid semantics, responsive toolbars/pagination, chart equivalents, dialog/status accessibility, least privilege and audit logging. Create six admin documents, reconcile shared docs and prepare the Prompt 5 operations handoff. Exit: 45 nonempty docs, synchronized risk copies and docs-only checkpoint.

## Prompt 4 Milestone 1 — Admin shell, contracts and primitives (completed)

Add the independent noindex `/admin` shell, 13-route navigation, global local search, breadcrumbs, notifications/profile, catch-all 404 and robots exclusion. Add typed operational fixtures, integer minor-unit formatting, metric helpers, proposed permissions and no-operation adapter. Build semantic table/pagination, status, chart and confirmation primitives. Exit: strict types/lint and focused unit tests pass.

## Prompt 4 Milestone 2 — Overview, users and catalogue operations (completed)

Build range-aware overview metrics/charts/exception links; user search/filter/pagination/details/account-action previews; provider/model capability, modality, availability and pricing configuration views. Exit: every control is functional locally or returns explicit non-persistent feedback and no sensitive fields appear.

## Prompt 4 Milestone 3 — Financial and operational workspaces (completed)

Build model pricing, exact credit packs, payments, transactions, usage/costs, jobs, websites, adjustments/disputes and settings. Add validated two-step credit/package/pricing flows and ephemeral adjustment audit previews. Exit: financial definitions remain distinct, filters/pagination work and no real mutation is claimed.

## Prompt 4 Milestone 4 — Regression validation and Prompt 5 handoff (completed)

Run unit/component/E2E, strict typecheck, lint, production build, all-route axe/overflow, keyboard/dialog, internal-link and representative visual review. Synchronize risks and finalize research, QA, progress and `handoff-prompt5.md` with actual behavior/evidence. Exit: all admin routes and prior public/auth/customer suites pass; backend/security limitations remain explicit.

## Prompt 5 Milestone 0 — Backend research and architecture (completed)

Inspect the inherited application, mock boundaries, contracts and documentation. Re-read current official Next.js/Supabase SSR/RLS/Drizzle/AI Gateway/Dodo/R2/Inngest/E2B/Vercel/Upstash/Resend guidance and inspect the official Dodo agent skills. Record the modular-monolith boundaries, exact financial arithmetic, schema/RLS/migration plan, versioned API, redaction, job and sandbox policies before backend code. Exit: research and nine backend design documents exist; no live-provider or production claim is made.

## Prompt 5 Milestone 1 — Foundation, identity and database

Install current server dependencies, add runtime environment validation, Drizzle schema/migrations/seeds, Supabase SSR cookie auth and verified customer/admin guards. Implement safe API primitives, request validation, Origin checks, rate limiting and RLS/ownership tests. Exit: anonymous/cross-customer/wrong-role access fails closed and local migrations/tests pass.

## Prompt 5 Milestone 2 — Wallet, payments and metering

Implement the atomic append-only wallet ledger, holds/settlement/release/compensation/reconciliation, exact one-time Dodo checkout, raw-body verified webhooks and exactly-once fulfillment. Add server model/capability/price registries and actual Gateway cost lookup. Exit: financial/concurrency/replay/race tests pass with no negative balance or duplicate grant/deduction.

## Prompt 5 Milestone 3 — AI, assets and durable website pipeline

Implement real chat streaming, asynchronous image/video/website jobs, transactional outbox/Inngest, R2 assets, isolated E2B validation and scoped preview Vercel deployment. Add Resend delivery and reconcile uncertain provider states without blind charged retries. Exit: injected-provider integration tests cover failure/resume/idempotency and generated code never executes on the app server.

## Prompt 5 Milestone 4 — Real service adapters and administration

Replace public/auth/customer/admin mock calls with real HTTP/server services while preserving the approved design. Implement permission-filtered admin reads/mutations, AAL2 step-up, current-state checks and append-only audit. Exit: no privileged client secrets or mock-success paths remain; direct endpoint and field/action authorization tests pass.

## Prompt 5 Milestone 5 — Verification and Prompt 6 handoff

Run migration, unit/integration/security/smoke, strict typecheck/lint/build and feasible browser/accessibility/responsive checks. Reconcile every backend document, record exact credential blockers, update production readiness/deployment/runbooks and finalize `handoff-prompt6.md`. Exit: only evidenced items are marked complete; live launch remains unauthorized.

## Prompt 5 final status — 2026-11-05

Milestones 1–4 are implemented in source and locally checked; routed demo customer/admin services were removed. Milestone 5 local static/unit/browser checks are complete. Any exit criterion requiring actual migrations, PostgreSQL row locks/RLS, credentialed auth/admin journeys, Dodo fulfillment, AI/storage/job/email/deployment providers or operational drills remains open. The final local evidence and live gates are recorded in `quality-assurance.md`, `task.md`, and `handoff-prompt6.md`; no live-launch completion is claimed.

## Dynamic AI Gateway ecosystem — current plan

`ai-implementation-plan.md` is the controlling phase plan for the new task. Phase 0 repository/official research and design documents are complete. The supplied Source A file is preserved at `docs/vercel_ai_gateway_llm_model_ids-1.txt` and independently verified as **166 unique IDs in exactly 28 namespaces**, with SHA-256 `1fe5f8a45c45a8d7a63cd46cb0aa0bb3ca1f099ff89ab8fe8d5acfbebc8888e8`; see `ai-catalogue-verification.md`.

With the documentation/source gate complete, implementation proceeds through additive schema/exact primitives, one REST-backed registry and sync service, centralized compatibility/pricing/routing, existing admin/customer integration, and finally verification/reports/handoff. Normal tests use mocks; disposable PostgreSQL and hosted live calls remain separate evidence gates. No production launch or paid live smoke is authorized by this plan.
