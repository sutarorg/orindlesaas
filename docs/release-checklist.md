# Release checklist

Status: **Prompt 6 execution checklist**. Checked items have linked observed local/CI evidence; unchecked items remain launch blockers. This checklist does not authorize deployment.

## 1. Scope, documentation, and invariants

- [x] Reviewed all 54 inherited `docs/*.md` files and the root README before test execution/application edits.
- [x] Inventoried actual page/API routes, existing Vitest/Playwright tests, server modules, migrations, and available credential/runtime names.
- [x] Researched current official Next.js testing, Vitest coverage, Playwright projects/fixtures, WCAG 2.2/evaluation, OWASP ASVS/WSTG, Supabase RLS/grants, and PostgreSQL locking guidance.
- [x] Created the independent matrix, scenarios, specialized plans, defect/failure registers, and release/runbook documents before running tests.
- [x] Preserved exactly four products, one account/workspace/wallet, premium-white defaults, mobile-first behavior, all six articles, Dodo Payments and Vercel AI Gateway; content/build/browser regressions pass.
- [x] Preserved exact one-time Creator/Pro/Studio prices and credits; unit/database/JSON-LD checks confirm no subscription or duplicate entitlement metering.

## 2. Repeatable local and CI quality gates

- [x] Clean lockfile install, strict TypeScript, ESLint, 25 unit files/124 tests, migration-chain check and 45-page production build passed locally/completed CI; final application run is indexed in `handoff-final.md`.
- [x] Added independent financial/state, authorization/redaction, request-security, website-isolation, all-public-route/article, SEO, axe and responsive regressions; hosted/manual boundaries remain separately unchecked.
- [x] Least-privilege nine-job Actions matrix and usable artifacts passed in runs `42069035875` and bounded final application run `42074366023`; failed/stalled earlier runs remain recorded.
- [x] Zero-finding dependency audit and reviewed secret/artifact/mock-import scans pass; narrow overrides were tested without blind force upgrades (`security-report.md`).

## 3. Database, identity, and authorization

- [x] Fresh migrations and exact idempotent seed behavior passed on disposable CI PostgreSQL 16.
- [ ] Disposable PostgreSQL grants/RLS/triggers/price intervals passed; hosted Data API and credentialed two-user/parent-ownership matrix remains blocked.
- [x] Parallel wallet/settlement/adjustment/webhook tests passed in disposable PostgreSQL with no observed overdraft, duplicate effect or lost update; hosted provider reconciliation remains separate.
- [ ] BLOCKED: hosted Supabase unique-user lifecycle, recovery, OAuth and active-profile evidence is unavailable; local unconfigured fail-closed tests pass.
- [ ] Guard unit/anonymous browser and admin idempotency subsets pass; hosted wrong-role/permission, inactive/expired and recent AAL2/TOTP journeys remain blocked.

## 4. Payments, credits, AI, storage, and jobs

- [ ] BLOCKED: Dodo test-mode connection; synthetic verification/mismatch and disposable exactly-once subsets pass without real money.
- [ ] Unit/disposable success/failure/race/recovery subsets pass; complete crash injection and hosted provider/finance reconciliation remain blocked.
- [x] Routine AI tests use explicit fakes and no live call was made; any future live smoke remains subject to call/token/spend caps and actual-cost reconciliation.
- [x] Implemented/unit-tested paid-operation retry and reconciliation controls pass in available scope; hosted uncertain side-effect drills remain unchecked below.
- [ ] Unit/static ownership, bounds and host controls passed; authorized R2/provider failure evidence remains blocked.
- [ ] BLOCKED: intended Inngest environment; only local/static/fake outbox and job controls are evidenced.

## 5. Website isolation and administration

- [x] Static/unit/browser review confirms generated source is not executed in the primary application process.
- [x] QA-001 direct and embedded production-browser sentinel tests passed for opaque-origin isolation, credentials/storage/network/forms and safe headers.
- [ ] Fixed-command/no-inherited-secret static controls pass; authorized E2B resource/network/cleanup evidence remains blocked.
- [ ] Preview-only/static target controls are present and no deployment occurred; authorized Vercel build/unknown-acceptance recovery evidence remains blocked.
- [ ] Exact DTO/redaction and local secret/artifact scans pass; hosted customer/admin logs and two-user responses remain unavailable.

## 6. Browser, mobile, accessibility, SEO, and performance

- [x] All public routes/six articles, unconfigured auth states and available anonymous customer/admin boundaries passed production browser tests with failure tracing; positive private journeys remain blocked.
- [x] Chromium, Firefox, WebKit, Mobile Chrome and Mobile Safari projects passed runs `42069035875` and final application run `42074366023`.
- [ ] Physical-device support-policy requirement remains launch-blocking: no named iOS/Android hardware evidence exists.
- [ ] Scripted core-width/keyboard/focus/reduced-motion/native-button/reflow checks pass; complete zoom, text-spacing, forced-colors and manual target review remains incomplete.
- [ ] Public-route axe corpus has no unreviewed violations; auth/private/manual WCAG 2.2 AA and named-AT matrix is incomplete. No certification claim is made.
- [x] Metadata, canonical/OG, sitemap/robots, status codes, internal links and all-route JSON-LD match visible content; no ranking/indexing claim.
- [x] QA-010 repeated final local 24/24 Lighthouse matrix and resource review pass with retained reports; field CWV remains separately blocked and no field claim is made.

## 7. Operations, legal, and final approval

- [ ] Verified production origin, legal entity/policies, support inbox, model catalog/prices, tax/refund/dispute procedures, retention/deletion, and finance metric definitions have owner approval.
- [ ] Monitoring, redacted logs, alerts, spending quotas, incident contacts, backup restoration, reconciliation, and rollback drills pass on authorized staging.
- [ ] Reproduced P0/P1 defects have scoped corrections/regressions, but critical hosted/manual/operational cases remain blocked; this release gate is not met.
- [ ] Domain reports now link local/application evidence; exact final HEAD CI, hosted evidence and owner release review must complete before this can be checked.
- [ ] Explicit production deployment authorization is recorded for the target, revision, schema, provider modes, and time window.
- [ ] Post-deployment smoke and rollback watch complete without critical regression; otherwise execute the tested rollback/reconciliation procedure.

**Current release state: NO-GO.** Local/disposable-CI controls are now evidenced, but Sections 3–7 retain critical hosted, physical/manual, operational and owner-approval blockers. No production deployment is authorized.
