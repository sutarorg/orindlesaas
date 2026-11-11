# Orindle documentation

Orindle is an all-in-one AI workspace with four products: Chat, Image Studio, Video Studio and Websites. The repository contains the public website, Supabase authentication integration, owner-scoped customer workspace, permission-checked administration, Drizzle/PostgreSQL schema and server integrations for payments, credits, AI, storage, jobs, email and preview deployment. Prompt 6 adds fresh local/disposable-CI verification and remediation; hosted providers and commercial production readiness remain unverified and **NO-GO**.

## Documentation map

- **Product and planning:** `product-requirements.md`, `plan.md`, `task.md`, `progress.md`, `decisions.md`, `assumptions-and-open-questions.md`.
- **Experience:** `design.md`, `design-system.md`, `responsive-design.md`, `accessibility.md`, `assets-inventory.md`, `authentication-design.md`, `authentication-flows.md`, `dashboard-architecture.md`, `dashboard-navigation.md`, `admin-architecture.md`, `admin-navigation.md`, `admin-design.md`.
- **Administration:** `admin-requirements.md`, `admin-permissions.md`, `admin-data-contracts.md`, with operational backend expectations in `handoff-prompt5.md`.
- **Content and discovery:** `Research.md`, `route-inventory.md`, `page-requirements.md`, `seo-strategy.md`, `blog-content-strategy.md`.
- **Engineering:** `architecture.md`, `backend-architecture.md`, `data-model.md`, `database-schema.md`, `migration-policy.md`, `api-contracts.md`, `api-reference.md`, `payments-and-webhooks.md`, `ai-metering-and-jobs.md`, `storage-and-website-pipeline.md`, `authorization.md`, `errors-and-observability.md`, `environment-variables.md`, `testing-strategy.md`, `quality-assurance.md`, `performance-budget.md`.
- **OpenRouter migration (implemented, verified against disposable PostgreSQL):** `openrouter-migration.md` is the index; it links `openrouter-provider.md`, `openrouter-catalog-sync.md`, `openrouter-pricing.md`, `openrouter-routing.md`, `openrouter-chat.md`, `openrouter-image.md`, `openrouter-video.md`, `openrouter-website-builder.md`, `openrouter-cost-reconciliation.md`, `openrouter-errors.md`, `openrouter-admin.md`, `openrouter-database.md`, `openrouter-testing.md`, `openrouter-security.md`, `openrouter-operations.md`, `openrouter-lessons.md` and `openrouter-migration-research.md`.
- **Dynamic AI ecosystem design (documentation/source gate complete):** `ai-provider-architecture.md`, `ai-model-registry.md`, `ai-model-catalogue.md`, `ai-model-capabilities.md`, `ai-model-pricing.md`, `ai-routing-engine.md`, `ai-metering-and-reconciliation.md`, `ai-admin-management.md`, `ai-catalog-sync.md`, `ai-security.md`, `ai-testing-strategy.md`, `ai-implementation-plan.md`, `ai-risk-register.md`, and `handoff-ai-integration.md`.
- **Risk and launch:** `security-threat-model.md`, `credit-economics.md`, `deployment-runbook.md`, `production-readiness.md`, `launch-readiness.md`, `release-checklist.md`, `mistakes-that-may-occur-and-priorities.md`.
- **Independent verification:** `test-matrix.md`, `test-scenarios.md`, specialized `*-test-plan.md` files, `bug-register.md`, `failure-report.md`, and the security/financial/accessibility/SEO/performance reports.
- **Final decision and recovery:** `final-qa-report.md`, `launch-report.md`, `deployment-report.md`, `rollback-report.md`, `rollback-runbook.md`, `handoff-final.md`.
- **Stage handoffs:** `handoff-prompt2.md` through `handoff-prompt6.md`, followed by `handoff-final.md`.

`mistakesthatmayoccurandpriorty.md` is a compatibility copy of `mistakes-that-may-occur-and-priorities.md`; update the readable file first and synchronize the copy.

## Working rules

Documentation describes verified reality, not aspirations presented as completed work. A task can be marked complete only after inspection and the relevant checks pass. Research sources include access dates. Product claims, provider availability and model capabilities must remain qualified where they can change. All customer-facing pricing is one-time credit pricing; subscriptions are out of scope.

## Current stage

Prompts 1–5 delivered the public/auth/customer/admin experiences and backend implementation. Prompt 6 independently reproduced and corrected QA-001 through QA-010, then verified **26 unit files/126 tests, 80/80 local production Chromium tests, a 45-page build, seven disposable PostgreSQL integration tests and a 24/24 exact-`4244b69` local Lighthouse matrix**. Previous push run `42084593285` passed all nine jobs; subsequent PR run `42086200854` exposed further mobile TBT and browser-installation failures, so the replacement final-HEAD CI gate remains pending rather than being inferred from local evidence.

No paid provider call, live payment, production deployment or credentialed hosted customer/admin journey occurred. Hosted Supabase/Dodo/providers, complete manual/AT/physical-device accessibility, field monitoring, staging recovery and owner approvals remain blocked. `handoff-final.md` is the prior-stage evidence index and NO-GO gate; `handoff-prompt6.md` retains the earlier implementation/setup handoff. The canonical production origin remains provisionally `https://orindle.com` until a deployment owner verifies it.

The AI provider is now **OpenRouter**, replacing Vercel AI Gateway. `openrouter-migration.md` is the current continuation point: implemented, with 234 unit tests and 11 integration tests passing against a disposable PostgreSQL cluster. No paid provider call, hosted migration or production deployment has occurred. The earlier Gateway design gate remains documented for historical context only: Source A is preserved and verified as 166 unique IDs in 28 namespaces. `handoff-ai-integration.md` is the current continuation point. Implementation is a separate stage; no hosted sync, paid generation, or production-readiness claim has been made.
