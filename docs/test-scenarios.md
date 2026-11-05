# Release test scenarios and data controls

Status: **defined before Prompt 6 execution**. Scenario IDs map to `test-matrix.md`. Expected results are requirements, not observed outcomes.

## Evidence and fixture protocol

1. Record revision, Node/package versions, base URL, browser/runtime, environment label, and UTC start/end for every run.
2. Use unique identities such as `qa-<run>-a@orindle-test.invalid` and `qa-<run>-b@orindle-test.invalid`; never use customer or production accounts.
3. Store secrets only in approved environment/CI secret stores. Reports contain IDs and safe codes, never passwords, cookies, tokens, raw webhooks, full provider responses, prompts, generated source, or signed URLs.
4. Routine AI/database/provider behavior uses explicit injected fakes or a disposable PostgreSQL service. A fake is named in evidence and never selected by a browser query or production fallback.
5. Delete only records created for the run, in dependency order, after evidence is captured. Dedicated disposable CI databases may be destroyed as a whole. Shared staging requires a run-ID allowlist and approved cleanup procedure.
6. Live provider smoke tests are opt-in, separately authorized, non-production where supported, and bounded before the first call. Current authorization/credentials for those calls are absent.
7. Playwright retains trace/screenshot on failure. Browser scripts attach console/page errors and failed-response details with sensitive values redacted.

## Public and content scenarios

### E2E-PUB-01 — Public route and navigation sweep (PUB-01/03)

1. Build and start the production application without provider credentials.
2. Visit all 21 public routes and assert status 200, one visible H1, main/header/footer landmarks, and no page error.
3. Follow every internal link and fragment; require an eligible 200 route or intentional 404, never an empty destination.
4. Operate desktop Products, mobile navigation, FAQ, pricing pack handoff, and contact validation with keyboard where applicable.

**Expected:** every destination is real; no fake account/payment/email success; exact four products and premium-white presentation remain intact.

### E2E-BLOG-01 — Six-article integrity (PUB-02/SEO-03/04)

For each slug in the shared article registry:

1. Assert unique title, description, canonical, OG article type, publication/update values, and substantive server-rendered body.
2. Verify H1/H2/H3 hierarchy, TOC targets, tables/lists, related articles, and product links.
3. Parse Article and Breadcrumb JSON-LD and compare headline, dates, author, and URLs with visible content.
4. Check every internal/external anchor for descriptive text; execute internal link checks without crawling external sites aggressively.

**Expected:** six distinct useful guides, no placeholder sections, ratings, fabricated output, ranking promise, or dead internal link.

### E2E-SEO-01 — Discovery boundary (SEO-01/02/03)

1. Parse every public page's metadata in production HTML, not only React runtime state.
2. Parse sitemap XML and compare the set with the eligible public registry, including all six articles and excluding auth/app/admin/API/404 routes.
3. Assert robots rules and `noindex,nofollow` on auth/private pages; confirm robots is not being used as the only private control.
4. Validate all JSON-LD blocks as JSON and compare Offer values/fragments with the three visible packs.

**Expected:** truthful crawlable public content and no private URL leakage. Search indexing/rich results are not claimed.

## Authentication scenarios

### E2E-AUTH-01 — Credential-free failure (AUTH-01)

1. Start without Supabase values and submit valid-looking login/signup/recovery/reset forms using synthetic data.
2. Inspect URL, visible result, cookies, local/session storage, and browser console.
3. Visit each `/app` and `/admin` route and call representative private APIs with malicious `next`, code, and token-shaped values.

**Expected:** explicit unavailable or safe login handoff, no session/account/email/password success, no reflected secrets/arbitrary redirect, and no private records.

### E2E-AUTH-02 — Real unique-user lifecycle (AUTH-02/03/05) — blocked currently

1. In a disposable Supabase project, create two unique test users through the supported test setup; do not use production accounts.
2. Complete signup verification, login, refresh, remember-me, logout, recovery, and password update for user A.
3. Attempt user B's callback/object IDs, expired/reused codes, arbitrary `next`, suspended profile, deleted profile, and stale cookies.
4. Compare recovery responses for existing and nonexistent synthetic addresses and clean up only A/B records.

**Expected:** only the intended verified account changes; no enumeration, cross-user effect, arbitrary redirect, or inactive-profile access.

### E2E-AUTH-03 — OAuth and MFA (AUTH-04/ADM-02) — blocked currently

1. Configure exact test redirect URLs for Google/GitHub if those providers are in launch scope.
2. Complete and cancel each provider flow, inspect callback error handling, and attempt a replay/tampered next path.
3. Enrol TOTP for a unique admin test identity; exercise valid, missing, stale, malformed, and future-skewed step-up claims.

**Expected:** verified sessions only and recent AAL2/TOTP for high-impact actions. Provider cancellation never looks like success.

## Customer and product scenarios

### E2E-APP-01 — Two-owner workspace isolation (APP-01) — blocked for live stack

1. Create distinct owned conversations, assets, projects, generations, builds, and deployments for users A and B.
2. As A, read every own route/API; as B, replace each ID with A's IDs and attempt reads/writes/downloads.
3. Repeat at the Data API using `anon` and `authenticated` roles and at the privileged server repository layer.

**Expected:** own safe DTOs only; foreign/missing objects have indistinguishable safe denial where practical; direct Data API grants do not bypass internal-field restrictions.

### E2E-CHAT-01 — Stream, history, and metering (CHAT-01/02)

1. With a scripted provider fake, submit one message and assert conversation/user message/job/reservation/outbox state before streaming.
2. Stream deterministic text, supply a fake generation ID and exact cost, then assert one assistant message, usage evidence, settlement, and history.
3. Repeat with the same idempotency key and with changed input.
4. Inject disconnect, missing ID, stream error, database failure before/after assistant persistence, and actual-cost lookup failure.

**Expected:** no duplicate charge or blind retry; partial output is not a completed answer; uncertain states remain visible and reconcilable.

### E2E-IMG-01 — Image output and asset ownership (IMG-01)

1. Return deterministic image bytes and metering from the provider fake.
2. Assert model/capability/price validation, one submission attempt, bounded R2 key/bytes/checksum, owner asset record, and exact settlement.
3. Inject empty output, oversized bytes, storage success/database failure, missing cost, and duplicate worker delivery.
4. Attempt the download as another owner and with an expired/invalid signature in the authorized environment.

**Expected:** no false image success, public object, duplicate charge, or unbounded read; partial external effects enter reconciliation.

### E2E-VID-01 — Durable video lifecycle (VID-01)

1. Fake start with an operation reference and no immediate output.
2. Poll pending, completed, and error sequences; assert sleeps/status reads do not restart generation.
3. Retry the worker at every checkpoint and inject missing generation ID, timeout, invalid asset URL, and settlement failure.

**Expected:** operation reference persists, attempts do not duplicate paid starts, output failure is not success, and unknown states require reconciliation.

### E2E-WEB-01 — Source, build, preview, deployment (WEB-01/02/03/SEC-07)

1. Supply valid static source and a corpus containing inline handlers, remote/dynamic scripts, parent paths, duplicate files, oversized input, obfuscated network/DOM access, and generated shell text.
2. Assert no source is imported/evaluated/required/executed by the Next.js process.
3. Render the editor iframe and directly open the API preview in a real browser. Attempt to read application cookies/storage and issue network/form/navigation actions using harmless sentinel endpoints.
4. Verify customer GET/editor payloads by exact key allowlist; require no sandbox ID, unrestricted Vercel ID, signed URL, or stack/provider body.
5. Require a passed build for the current source hash and assert Vercel receives `target: preview`, fixed project settings, no secrets, and no customer-selected team/project/domain.

**Expected:** sandboxed unique-origin preview with no application credentials or unrestricted network; safe DTOs; no app-server execution or production deployment.

## Financial and admin scenarios

### INT-CR-01 — Parallel wallet safety (CR-02/03/04/05)

On a fresh disposable PostgreSQL database:

1. Create only test profiles/wallets and seed exact packs.
2. Start concurrent independent holds whose sum exceeds availability; use a barrier to maximize contention.
3. Start concurrent identical holds, settlements, purchases, and adjustments with the same keys; then reuse keys with changed input/target/actor.
4. Settle below/equal/above the hold, release, recover from reconciliation after a controlled credit adjustment, and attempt different exact cost or generation identity.
5. Recompute balances from ledger rows and inspect append-only triggers, versions, reservation states, usage evidence, and audit counts after every trial.

**Expected:** no negative/lost balance, duplicate effect, or evidence substitution; all successful mutations reconcile exactly.

### INT-PAY-01 — Webhook and checkout adversarial matrix (PAY-01–05)

1. Exercise all three packs and verify checkout return creates zero ledger entries.
2. Verify the exact raw body before accepting a signed event; reject missing/bad signature and oversize input.
3. Deliver valid success, every mismatch vector, non-success events with mismatched ownership/session, same event replay, same ID/different bytes, different event/same payment, and concurrent duplicates.
4. Assert purchase/payment/wallet/ledger/webhook/email/outbox rows after each commit.

**Expected:** only a fully matched verified success grants once; malformed or mismatched events cannot corrupt non-success state; receipt/outbox effects share the fulfillment commit.

### INT-ADM-01 — Permission, step-up, idempotency, audit (ADM-01–04)

1. Run every route/action as anonymous, ordinary user, each least-privilege role, inactive/expired member, and wrong object scope.
2. For each accepted action, test missing/stale/recent AAL2, stale expected state, malformed input, replay, changed replay, cross-target/actor key reuse, and audit insert failure.
3. Inspect response keys and safe logs for forbidden fields.

**Expected:** deny by default, one intended effect, atomic audit, no hidden privilege through direct endpoints, and no sensitive DTO/log leakage.

## Security and resilience scenarios

### HTTP-SEC-01 — Request boundary corpus (SEC-01/02/03/04)

For every private mutation and public contact/webhook endpoint, exercise wrong method/content type, missing/malformed/oversize body, unknown fields, invalid UUID, wrong Origin/Sec-Fetch-Site, spoofed request ID, rate-limit exhaustion, and missing integration configuration.

**Expected:** correct 4xx/429/503 behavior, safe stable envelope, strictly formatted correlation ID, `no-store` where appropriate, no stack/provider/SQL/secret leakage, and no business effect.

### HTTP-SEC-02 — Headers and untrusted content (SEC-05/06)

1. Inspect representative public, auth, private, API, error, and preview responses for CSP/frame/MIME/referrer/permissions/cache policy.
2. Attempt harmless XSS, open redirect, host/header injection, signed-key traversal, redirecting provider download, DNS/IP edge cases where authorized, and checksum/size mismatch.
3. Verify logs and responses do not contain sentinels representing passwords, tokens, prompts, source, raw payment data, or keys.

**Expected:** untrusted content remains isolated; no header injection, secret reflection, cross-owner object access, or unbounded network/read.

## Compatibility, accessibility, SEO, and performance scenarios

### E2E-MOB-01 — Responsive and browser matrix (MOB-01/02)

1. Run the route-width matrix from 320 through 1920 pixels and assert document overflow, visible actions, table-region containment, dialogs, and navigation.
2. Run the same supported smoke journeys in Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari projects.
3. Capture orientation/touch/keyboard evidence separately on named physical devices when available.

**Expected:** no loss of content/function or browser-specific runtime failure. Emulation and real-device evidence remain separately labelled.

### E2E-A11Y-01 — WCAG 2.2 AA review (A11Y-01/02/03)

1. Run axe on every public/auth route and available private state; retain JSON and review every violation.
2. Keyboard through menus, accordions, forms, dialogs, tables, editors, and errors; inspect focus visibility/order/return and status announcements.
3. Test reduced motion, 200/400% zoom, text spacing, 24px minimum target criterion/44px product aim, forced colors, and named screen readers when available.

**Expected:** no known critical barrier. Automated zero is not WCAG certification; untested AT/criteria stay open.

### PERF-LAB-01 — Repeatable lab performance (PERF-01/02/03)

1. Build once, serve the production output in a stable environment, and run at least three Lighthouse mobile and desktop trials per key route.
2. Record median scores and LCP/CLS/TBT plus environment/throttling; inspect long tasks, layout shifts, requests, fonts/images, and client manifests.
3. Perform scripted interactions for responsiveness; do not substitute TBT for INP or lab data for field p75 CWV.

**Expected:** documented budgets are met repeatedly or a defect is opened. No field-CWV or production-performance claim is made from local scores.

## Live provider smoke authorization envelope

No provider smoke is currently authorized by stored credentials or executed. If separately approved later:

- Use Dodo **test_mode** only for automated payment tests; no real customer/card or live-mode charge.
- Start with at most one Creator test checkout/verified test webhook path; do not automate live money, refunds, or disputes.
- Routine AI tests remain mocked. Any approved Gateway smoke begins with one low-cost text request, output capped at 64 tokens, a hard one-call process guard, and a documented maximum spend supplied by the authorizer. Image/video/website/E2B/Vercel calls require their own explicit enable flags and limits.
- Production Vercel target and production deployment tests remain disabled. Preview-only resources receive unique QA names and are cleaned up where safe.
- A missing approval, credential, price, product mapping, or limit means **Blocked**, never an implicit attempt.
