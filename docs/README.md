# Orindle documentation

Orindle is an all-in-one AI workspace with four products: Chat, Image Studio, Video Studio and Websites. The repository contains the public website, Supabase authentication integration, owner-scoped customer workspace, permission-checked administration, Drizzle/PostgreSQL schema and server integrations for payments, credits, AI, storage, jobs, email and preview deployment. Prompt 6 adds fresh local/disposable-CI verification and remediation; hosted providers and commercial production readiness remain unverified and **NO-GO**.

## Documentation map

- **Product and planning:** `product-requirements.md`, `plan.md`, `task.md`, `progress.md`, `decisions.md`, `assumptions-and-open-questions.md`.
- **Experience:** `design.md`, `design-system.md`, `responsive-design.md`, `accessibility.md`, `assets-inventory.md`, `authentication-design.md`, `authentication-flows.md`, `dashboard-architecture.md`, `dashboard-navigation.md`, `admin-architecture.md`, `admin-navigation.md`, `admin-design.md`.
- **Administration:** `admin-requirements.md`, `admin-permissions.md`, `admin-data-contracts.md`, with operational backend expectations in `handoff-prompt5.md`.
- **Content and discovery:** `Research.md`, `route-inventory.md`, `page-requirements.md`, `seo-strategy.md`, `blog-content-strategy.md`.
- **Engineering:** `architecture.md`, `backend-architecture.md`, `data-model.md`, `database-schema.md`, `migration-policy.md`, `api-contracts.md`, `api-reference.md`, `payments-and-webhooks.md`, `ai-metering-and-jobs.md`, `storage-and-website-pipeline.md`, `authorization.md`, `errors-and-observability.md`, `environment-variables.md`, `testing-strategy.md`, `quality-assurance.md`, `performance-budget.md`.
- **Risk and launch:** `security-threat-model.md`, `credit-economics.md`, `deployment-runbook.md`, `production-readiness.md`, `launch-readiness.md`, `release-checklist.md`, `mistakes-that-may-occur-and-priorities.md`.
- **Independent verification:** `test-matrix.md`, `test-scenarios.md`, specialized `*-test-plan.md` files, `bug-register.md`, `failure-report.md`, and the security/financial/accessibility/SEO/performance reports.
- **Final decision and recovery:** `final-qa-report.md`, `launch-report.md`, `deployment-report.md`, `rollback-report.md`, `rollback-runbook.md`, `handoff-final.md`.
- **Stage handoffs:** `handoff-prompt2.md` through `handoff-prompt6.md`, followed by `handoff-final.md`.

`mistakesthatmayoccurandpriorty.md` is a compatibility copy of `mistakes-that-may-occur-and-priorities.md`; update the readable file first and synchronize the copy.

## Working rules

Documentation describes verified reality, not aspirations presented as completed work. A task can be marked complete only after inspection and the relevant checks pass. Research sources include access dates. Product claims, provider availability and model capabilities must remain qualified where they can change. All customer-facing pricing is one-time credit pricing; subscriptions are out of scope.

## Current stage

Prompts 1–5 delivered the public/auth/customer/admin experiences and backend implementation. Prompt 6 independently reproduced and corrected QA-001 through QA-010, then verified **25 unit files/124 tests, 80/80 local production Chromium tests, a 45-page build, seven disposable PostgreSQL integration tests and a 24/24 final local Lighthouse matrix**. Final application CI run `42074366023` passed all nine jobs and uploaded browser, coverage, PostgreSQL and performance artifacts.

No paid provider call, live payment, production deployment or credentialed hosted customer/admin journey occurred. Hosted Supabase/Dodo/providers, complete manual/AT/physical-device accessibility, field monitoring, staging recovery and owner approvals remain blocked. `handoff-final.md` is the current evidence index and NO-GO gate; `handoff-prompt6.md` retains the earlier implementation/setup handoff. The canonical production origin remains provisionally `https://orindle.com` until a deployment owner verifies it.
