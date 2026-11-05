# Production readiness

Current status: **not production ready / NO-GO**. This checklist concerns a real commercial launch, not frontend or local backend acceptance. Authoritative detail: `test-matrix.md`, `release-checklist.md`, `launch-readiness.md`, `final-qa-report.md` and `handoff-final.md`.

## Evidence now established

- [x] Fresh local static/component/build checks: strict TypeScript, ESLint, Drizzle migration-chain check, 25 unit files/124 tests and 45-page production build.
- [x] Public production browser corpus: 21 indexable routes, four products, six articles, metadata/sitemap/internal links/JSON-LD, navigation/forms, fail-closed auth and private-route boundaries.
- [x] Five managed browser/emulation projects passed in CI run `42069035875`; later failures and the final application run are preserved in `failure-report.md` rather than hidden.
- [x] Automated public accessibility/reflow scope: 21-route axe corpus, four core widths and scripted keyboard/focus/reduced-motion checks. This is not WCAG certification.
- [x] Disposable PostgreSQL 16 migration/seed/grant/RLS/concurrency/replay tests, explicitly separate from hosted Supabase.
- [x] Security/financial corrections QA-001–QA-009 and performance correction QA-010 have scoped local regressions; `bug-register.md` retains boundaries.
- [x] Repeated Lighthouse lab matrix passed after the home/mobile LCP correction; JSON/HTML reports persist in `performance-results/` and are uploaded by CI.
- [x] Dependency audit, high-confidence secret/artifact scan and production mock-import scan were reviewed with no unaccepted local release finding.

## Public website and content gate

- [ ] Deployment owner verifies the real production origin, DNS/HTTPS/redirects, support contact and legal entity details.
- [ ] Qualified legal review approves Privacy, Terms, Credits Policy and statutory remedy/support procedures.
- [ ] Provider/model availability statements match the actual launch configuration.
- [ ] External structured-data validation and owner-controlled Search Console/index monitoring are established where claimed.
- [ ] Privacy-approved field Core Web Vitals monitoring has representative real-user p75 data; lab scores are not treated as field compliance.

## Account, application and financial gate

- [ ] Hosted Supabase signup/verification/login/refresh/logout/recovery/OAuth, active-profile, inactive/expired-session and two-user ownership tests pass.
- [ ] Every admin route/action/field denies wrong role/permission and stale step-up; recent AAL2/TOTP is proven for high-impact actions.
- [ ] Dodo test-mode checkout/webhook/signature/replay/mismatch/exactly-once/receipt behavior passes with safe test records and no real money.
- [ ] Gateway actual cost/metering, Inngest recovery, R2 ownership/failures, E2B/Vercel sandbox/deployment, Upstash limits and Resend delivery are tested in authorized intended environments.
- [ ] Backup restoration, crash/recovery injection and wallet/ledger/payment/provider reconciliation pass without untracked balance repair.
- [ ] Finance/security owners review admin metric definitions, redacted diagnostics and customer-code/deployment field restrictions in the real environment.

## Accessibility and support gate

- [ ] Complete knowledgeable WCAG 2.2 AA review covers public and authenticated states, 200/400% zoom, text spacing, forced colors and remaining manual criteria.
- [ ] Named NVDA/VoiceOver/TalkBack and physical iOS/Android journeys pass according to the support policy.
- [ ] Support owner approves device/browser accessibility scope; no automated result is described as certification.

## Operational and release gate

- [ ] Monitoring, redacted hosted logs, alerts, spending quotas, incident contacts and rollback are tested on authorized staging.
- [x] Final application revision completed all nine CI jobs with usable artifacts in run `42074366023`; no known open reproduced P0/P1 defect remains in the available local/CI scope.
- [ ] All blocked critical cases in `test-matrix.md` are resolved with genuine evidence; blocked is never counted as passed.
- [ ] Legal, support, finance, security and operations owners explicitly approve the release.
- [ ] Production deployment is explicitly authorized for target/revision/schema/provider modes/time window; post-deployment smoke and rollback watch complete.

## Evidence rule and decision

Every checked item above links to current observed local/CI evidence through the domain reports. Historical Prompt 1–5 results remain context only. Marketing polish, mocks, anonymous 503s and green local builds do not compensate for missing hosted payment, identity, accessibility, recovery or approval controls.

**Production readiness remains NO-GO.**
