# Implementation plan

Status: Prompt 1 and Prompt 2 milestones are complete and evidenced on 2026-11-05. Prompt 2 delivered frontend-only authentication; Prompt 5 still owns real Supabase/session behavior. Later-stage work begins from the relevant handoff, not by treating this plan as provider API verification.

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
