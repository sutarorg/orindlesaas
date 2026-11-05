# Orindle documentation

Orindle is an all-in-one AI workspace with four products: Chat, Image Studio, Video Studio and Websites. The repository contains the frontend-only public website, authentication UI and Prompt 3 demo customer dashboard. No real authentication, payment, database, credit deduction, AI generation, upload or deployment behavior is implemented.

## Documentation map

- **Product and planning:** `product-requirements.md`, `plan.md`, `task.md`, `progress.md`, `decisions.md`, `assumptions-and-open-questions.md`.
- **Experience:** `design.md`, `design-system.md`, `responsive-design.md`, `accessibility.md`, `assets-inventory.md`, `authentication-design.md`, `authentication-flows.md`, `dashboard-architecture.md`, `dashboard-navigation.md`.
- **Content and discovery:** `Research.md`, `route-inventory.md`, `page-requirements.md`, `seo-strategy.md`, `blog-content-strategy.md`.
- **Engineering:** `architecture.md`, `data-model.md`, `api-contracts.md`, `environment-variables.md`, `testing-strategy.md`, `quality-assurance.md`, `performance-budget.md`.
- **Risk and launch:** `security-threat-model.md`, `credit-economics.md`, `deployment-runbook.md`, `production-readiness.md`, `mistakes-that-may-occur-and-priorities.md`.
- **Stage handoffs:** `handoff-prompt2.md` through `handoff-prompt6.md`.

`mistakesthatmayoccurandpriorty.md` is a compatibility copy of `mistakes-that-may-occur-and-priorities.md`; update the readable file first and synchronize the copy.

## Working rules

Documentation describes verified reality, not aspirations presented as completed work. A task can be marked complete only after inspection and the relevant checks pass. Research sources include access dates. Product claims, provider availability and model capabilities must remain qualified where they can change. All customer-facing pricing is one-time credit pricing; subscriptions are out of scope.

## Current stage

Prompt 1 delivered public marketing routes, articles and frontend contracts. Prompt 2 delivered six noindex authentication routes with local validation and preview-only adapters. Prompt 3 delivered and validated the noindex `/app` demo workspace, four product interfaces and shared projects/library/history/wallet/settings using typed fixtures only; Prompt 5 owns real Supabase/session/backend behavior. The canonical production origin is temporarily assumed to be `https://orindle.com`; see open questions before deployment.
