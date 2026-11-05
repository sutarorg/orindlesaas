# Final QA report

Status: **Prompt 6 execution reconciled; final-revision CI is indexed in `handoff-final.md`; not production sign-off**. Date: 2026-11-05. Release recommendation: **NO-GO**.

## Scope and independence

The review covers the complete Orindle public site and six articles, authentication, customer workspace and four products, Dodo payments, wallet/accounting, administration, PostgreSQL/RLS/concurrency, AI/jobs/storage/website execution, security, mobile/cross-browser, WCAG 2.2 AA, SEO, performance, CI, deployment and rollback.

All 54 inherited documentation files and the root README were reviewed before test execution or application-code changes. Actual routes, tests, server modules, migrations and environment/runtime availability were independently inventoried. Prompt 5 results are historical context, not reused as Prompt 6 evidence.

## Observed execution evidence

| Area | Prompt 6 result |
|---|---|
| Static/component/build | Local typecheck, ESLint, diff check, Drizzle check, 45-page production build and **25 unit files/124 tests** passed. The QA-010 font-only correction then passed typecheck/build and the complete static/coverage/build job in final application CI `42074366023`. |
| Production Chromium | **80/80 PASS** after the all-route structured-data correction. Includes 21 indexable routes, six articles, navigation/forms, fail-closed auth/private APIs, security and accessibility/reflow assertions. |
| Managed cross-browser | Run `42069035875` passed Chromium, Firefox, WebKit, Mobile Chrome and Mobile Safari, plus the other four quality jobs: **nine/nine jobs**. WebKit/signup harness findings were corrected without filtering runtime errors. |
| Disposable PostgreSQL | Seven real PostgreSQL 16 integration tests passed for migrations/seed, grants/RLS, concurrent holds/settlements, over-cost recovery, succeeded-webhook race, admin replay/race and price history. This is not hosted Supabase evidence. |
| Dependency/security hygiene | Clean lockfile install and zero-finding moderate-level audit; 2,691-file high-confidence secret/artifact scan found zero hits; 237 production files had zero test/mock framework imports. Generic credential-shaped assignments were reviewed without printing values. |
| Technical SEO/content | All-route unique metadata/canonical/social tags, exact 21-route sitemap, robots/private exclusions, internal links/fragments and parsed JSON-LD passed. QA-009 corrected stale pricing offer wording; no ratings/reviews are claimed. |
| Accessibility | Twenty-one-route axe corpus passed in five managed projects; scripted keyboard/focus/reflow/reduced-motion checks passed. Complete manual WCAG, named AT, physical devices and authenticated states remain open. |
| Performance | QA-010 reproduced intermittent home/mobile LCP around 3.3s and corrected late Inter swapping. The final retained local Lighthouse matrix at application revision `3c0f0f5c6bff7dbb6bc3baa552b62be3263de51d` passed **24/24**, with JSON/HTML reports preserved. Field CWV remains unavailable. |
| CI discrimination | Runs `42065241613` and `42067360809` exposed database/browser/harness failures; `42069035875` passed all nine jobs. Run `42071353363` failed performance and stalled during Mobile Safari WebKit installation. Bounded final application run `42074366023` passed **all nine jobs**, including performance and every browser project. |
| Deployment/live money | No production deployment, live payment, destructive production test or unrestricted AI was authorized or performed. |

## Confirmed defects and closure

`bug-register.md` contains reproduction, severity, root cause, narrow correction and scoped regression evidence for **QA-001 through QA-010**:

- P0 website-preview isolation, admin credit-adjustment idempotency and their browser/PostgreSQL regressions;
- website DTO redaction, payment-event matching, request-ID and environment-mode validation;
- dependency remediation, social metadata and pricing JSON-LD consistency;
- intermittent home/mobile late-font LCP and repeated full-matrix retest.

“Closed” applies only to the reproduced implementation scope and observed regression layer. It does not close hosted Supabase/Dodo/Gateway/R2/Inngest/E2B/Vercel/Upstash/Resend, staging, physical-device/AT or owner-approval gates.

## Environment and evidence boundaries

- No local provider credentials or PostgreSQL/container runtime were available. CI supplied disposable PostgreSQL and managed browsers, not hosted customer infrastructure.
- Local Firefox/WebKit installation failed with TLS `ECONNRESET`; managed CI supplied those engines. Packaged Chromium used `/tmp/chromium` and `/tmp/al2023/lib` locally.
- Anonymous denial and unconfigured `503 integration_unavailable` responses are fail-closed evidence only. They do not prove positive customer/admin/provider journeys.
- Lighthouse is simulated lab evidence; TBT is not INP. Emulation is not a physical device; axe/Lighthouse are not WCAG certification; local crawls are not indexing/ranking evidence.

## Remaining release blockers

1. Credentialed disposable Supabase and Dodo test-mode critical journeys, two-user/admin/MFA/OAuth and actual provider mappings.
2. Authorized Gateway/Inngest/R2/E2B/Vercel/Upstash/Resend behavior, failure recovery and spending/abuse controls.
3. Complete manual WCAG/AT/physical-device coverage and authenticated accessibility states.
4. Authorized staging monitoring, backup restoration, reconciliation, incident and rollback drills.
5. Verified production origin/legal/support/finance operations, privacy-approved field monitoring and Search Console where claimed.
6. Final-revision CI with usable artifacts and explicit legal/support/finance/security/operations approval and production authorization.

## Decision

**Do not launch or execute a production deployment from the current evidence.** The available implementation and regression gates are materially stronger and the final lab matrix is green, but blocked critical hosted, manual and operational evidence keeps overall QA, launch and production readiness at **NO-GO**.
