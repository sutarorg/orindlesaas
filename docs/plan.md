# Implementation plan

Status: all Prompt 1 milestones completed and evidenced on 2026-11-05. Later-stage work begins from the relevant handoff, not by treating this plan as provider API verification.

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
