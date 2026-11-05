# Release checklist

Status: **Prompt 6 working checklist**. Checkboxes are marked only with linked current-revision evidence. This checklist does not authorize deployment.

## 1. Scope, documentation, and invariants

- [x] Reviewed all 54 inherited `docs/*.md` files and the root README before test execution/application edits.
- [x] Inventoried actual page/API routes, existing Vitest/Playwright tests, server modules, migrations, and available credential/runtime names.
- [x] Researched current official Next.js testing, Vitest coverage, Playwright projects/fixtures, WCAG 2.2/evaluation, OWASP ASVS/WSTG, Supabase RLS/grants, and PostgreSQL locking guidance.
- [x] Created the independent matrix, scenarios, specialized plans, defect/failure registers, and release/runbook documents before running tests.
- [ ] Preserve exactly four products, one account/workspace/wallet, premium-white defaults, mobile-first behavior, all six articles, Dodo Payments, and Vercel AI Gateway.
- [ ] Preserve exact one-time Creator/Pro/Studio prices and credits; no subscription or duplicate entitlement metering.

## 2. Repeatable local and CI quality gates

- [ ] Clean lockfile install, strict TypeScript, ESLint, unit/component tests, migration-chain check, and production build pass.
- [ ] New tests independently cover financial arithmetic/state, authorization/redaction, request security, website isolation, all public routes/articles, SEO, accessibility, and responsive behavior.
- [ ] GitHub Actions runs the same checks with least-privilege permissions and usable artifacts; no test is silently skipped and reported as passed.
- [ ] Dependency/secret/artifact/mock-import scans are reviewed; supported remediations are tested without blind force upgrades.

## 3. Database, identity, and authorization

- [ ] Fresh migrations and exact seed behavior pass on disposable real PostgreSQL.
- [ ] GRANTs, RLS, parent ownership, append-only triggers, price intervals, and direct Data API restrictions pass for `anon` and two authenticated users.
- [ ] Parallel wallet/purchase/settlement/adjustment/webhook tests prove no overdraft, duplicate effect, lost update, or evidence substitution.
- [ ] Supabase signup/verification/login/refresh/logout/recovery/OAuth and active-profile checks pass with unique test users.
- [ ] Every admin route/action/field denies anonymous, wrong role/permission, inactive/expired membership, stale step-up, and direct bypass; recent AAL2/TOTP is proven for high-impact actions.

## 4. Payments, credits, AI, storage, and jobs

- [ ] Dodo test-mode checkout/signature/replay/mismatch/exactly-once fulfillment and receipt outbox pass without real money.
- [ ] Wallet/ledger/purchase/usage/audit reconciliation passes after success, failure, crash, and recovery injection.
- [ ] Routine AI tests use fakes; any authorized live smoke is within explicit call/token/spend limits and reconciles actual cost.
- [ ] No blind charged retry; unknown submissions/deployments and external/post-processing partial failures remain reconcilable.
- [ ] R2 ownership/signature/size/checksum and provider host/SSRF controls pass.
- [ ] Inngest signature/outbox/recovery/concurrency behavior passes in the intended environment.

## 5. Website isolation and administration

- [ ] Generated/untrusted code never executes in the primary application process.
- [ ] Direct and embedded previews have enforced unique-origin sandboxing, no application credentials/storage, restricted network/forms/navigation, and safe cache/security headers.
- [ ] E2B uses fixed commands, no inherited secrets/network for static validation, bounded resources, and cleanup.
- [ ] Vercel deployment is preview-only with current-source passed build, scoped team/name, and unknown-acceptance recovery; no production target occurs.
- [ ] Customer/admin DTOs and logs exclude secrets, prompts/source as restricted, raw payments, signed URLs, sandbox and unrestricted deployment identifiers, and stack/provider bodies.

## 6. Browser, mobile, accessibility, SEO, and performance

- [ ] All public routes and six articles, auth states, and available customer/admin journeys pass production browser tests with failure traces.
- [ ] Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari projects pass; physical-device limitations are separately resolved or launch-blocking by support policy.
- [ ] Required viewport/zoom/keyboard/focus/reduced-motion/target-size checks pass without overflow or lost controls.
- [ ] Axe has no unreviewed violations and the WCAG 2.2 AA manual/AT matrix is complete; no unsupported certification claim.
- [ ] Metadata, canonical/OG, sitemap/robots, status codes, internal links, and JSON-LD match visible content; no ranking/indexing claim.
- [ ] Repeated Lighthouse/lab budgets pass and resource/regression review is complete; field CWV is reported separately and honestly.

## 7. Operations, legal, and final approval

- [ ] Verified production origin, legal entity/policies, support inbox, model catalog/prices, tax/refund/dispute procedures, retention/deletion, and finance metric definitions have owner approval.
- [ ] Monitoring, redacted logs, alerts, spending quotas, incident contacts, backup restoration, reconciliation, and rollback drills pass on authorized staging.
- [ ] `bug-register.md` has zero open P0/P1 defects; all critical blocked cases in `test-matrix.md` are resolved with real evidence.
- [ ] Final security, financial, accessibility, SEO, performance, deployment, rollback, and QA reports link evidence for the exact release candidate.
- [ ] Explicit production deployment authorization is recorded for the target, revision, schema, provider modes, and time window.
- [ ] Post-deployment smoke and rollback watch complete without critical regression; otherwise execute the tested rollback/reconciliation procedure.

**Current release state: NO-GO.** Sections 2–7 lack required Prompt 6 evidence and no production deployment is authorized.
