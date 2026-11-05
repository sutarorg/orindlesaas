# Orindle documentation

Orindle is an all-in-one AI workspace with four products: Chat, Image Studio, Video Studio and Websites. The repository contains the frontend-only public website, authentication UI, Prompt 3 demo customer dashboard and the Prompt 4 administration-frontend baseline. No real authentication, authorization, payment, database, credit deduction, AI generation, upload, deployment or persistent administrative behavior is implemented.

## Documentation map

- **Product and planning:** `product-requirements.md`, `plan.md`, `task.md`, `progress.md`, `decisions.md`, `assumptions-and-open-questions.md`.
- **Experience:** `design.md`, `design-system.md`, `responsive-design.md`, `accessibility.md`, `assets-inventory.md`, `authentication-design.md`, `authentication-flows.md`, `dashboard-architecture.md`, `dashboard-navigation.md`, `admin-architecture.md`, `admin-navigation.md`, `admin-design.md`.
- **Administration:** `admin-requirements.md`, `admin-permissions.md`, `admin-data-contracts.md`, with operational backend expectations in `handoff-prompt5.md`.
- **Content and discovery:** `Research.md`, `route-inventory.md`, `page-requirements.md`, `seo-strategy.md`, `blog-content-strategy.md`.
- **Engineering:** `architecture.md`, `data-model.md`, `api-contracts.md`, `environment-variables.md`, `testing-strategy.md`, `quality-assurance.md`, `performance-budget.md`.
- **Risk and launch:** `security-threat-model.md`, `credit-economics.md`, `deployment-runbook.md`, `production-readiness.md`, `mistakes-that-may-occur-and-priorities.md`.
- **Stage handoffs:** `handoff-prompt2.md` through `handoff-prompt6.md`.

`mistakesthatmayoccurandpriorty.md` is a compatibility copy of `mistakes-that-may-occur-and-priorities.md`; update the readable file first and synchronize the copy.

## Working rules

Documentation describes verified reality, not aspirations presented as completed work. A task can be marked complete only after inspection and the relevant checks pass. Research sources include access dates. Product claims, provider availability and model capabilities must remain qualified where they can change. All customer-facing pricing is one-time credit pricing; subscriptions are out of scope.

## Current stage

Prompt 1 delivered public marketing routes, articles and frontend contracts. Prompt 2 delivered six noindex authentication routes with local validation and preview-only adapters. Prompt 3 delivered and validated the noindex `/app` demo workspace using typed fixtures only. Prompt 4 delivered and validated the separate noindex `/admin` operations demo with 13 routes, data-oriented UX, defined financial fixtures and non-persistent adapters. Final evidence is 57/57 unit tests, 91/91 production Playwright tests, 13 admin axe scans and 49 admin responsive combinations. Prompt 5 owns real Supabase/session/backend and administrative authorization behavior. The canonical production origin is temporarily assumed to be `https://orindle.com`; see open questions before deployment.
