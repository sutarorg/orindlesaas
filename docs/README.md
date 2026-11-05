# Orindle documentation

Orindle is an all-in-one AI workspace with four products: Chat, Image Studio, Video Studio and Websites. The repository now contains the public website, real Supabase authentication integration, owner-scoped customer workspace, permission-checked administration, Drizzle/PostgreSQL schema and server integrations for payments, credits, AI, storage, jobs, email and preview deployment. These integrations are implemented and locally tested but have not been verified with live credentials or an applied database; no production-readiness claim is made.

## Documentation map

- **Product and planning:** `product-requirements.md`, `plan.md`, `task.md`, `progress.md`, `decisions.md`, `assumptions-and-open-questions.md`.
- **Experience:** `design.md`, `design-system.md`, `responsive-design.md`, `accessibility.md`, `assets-inventory.md`, `authentication-design.md`, `authentication-flows.md`, `dashboard-architecture.md`, `dashboard-navigation.md`, `admin-architecture.md`, `admin-navigation.md`, `admin-design.md`.
- **Administration:** `admin-requirements.md`, `admin-permissions.md`, `admin-data-contracts.md`, with operational backend expectations in `handoff-prompt5.md`.
- **Content and discovery:** `Research.md`, `route-inventory.md`, `page-requirements.md`, `seo-strategy.md`, `blog-content-strategy.md`.
- **Engineering:** `architecture.md`, `backend-architecture.md`, `data-model.md`, `database-schema.md`, `migration-policy.md`, `api-contracts.md`, `api-reference.md`, `payments-and-webhooks.md`, `ai-metering-and-jobs.md`, `storage-and-website-pipeline.md`, `authorization.md`, `errors-and-observability.md`, `environment-variables.md`, `testing-strategy.md`, `quality-assurance.md`, `performance-budget.md`.
- **Risk and launch:** `security-threat-model.md`, `credit-economics.md`, `deployment-runbook.md`, `production-readiness.md`, `mistakes-that-may-occur-and-priorities.md`.
- **Stage handoffs:** `handoff-prompt2.md` through `handoff-prompt6.md`.

`mistakesthatmayoccurandpriorty.md` is a compatibility copy of `mistakes-that-may-occur-and-priorities.md`; update the readable file first and synchronize the copy.

## Working rules

Documentation describes verified reality, not aspirations presented as completed work. A task can be marked complete only after inspection and the relevant checks pass. Research sources include access dates. Product claims, provider availability and model capabilities must remain qualified where they can change. All customer-facing pricing is one-time credit pricing; subscriptions are out of scope.

## Current stage

Prompts 1–4 delivered the public/auth/customer/admin frontend stages. Prompt 5 replaced routed demo customer/admin services with real server boundaries and added the backend implementation. Final credential-free local evidence on 2026-11-05 is **106/106 unit tests across 21 files, 50/50 production Playwright tests, clean strict TypeScript/ESLint, a passing Drizzle migration-chain check, and a successful Next production build with 45 generated pages**. No migrations, seed/catalog writes, paid provider calls, live deployment, or credentialed end-to-end journeys were run. `handoff-prompt6.md` is the current setup/verification gate. The canonical production origin remains provisionally `https://orindle.com`; see open questions before deployment.
