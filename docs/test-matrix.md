# Independent release test matrix

Status: **Prompt 6 planning baseline created before test execution on 2026-11-05**. No result below is inherited from Prompt 5. Update the status and evidence columns only from an observed run against the identified revision.

## Status and release rules

- **Planned:** a repeatable case is defined but has not run in Prompt 6.
- **Blocked:** the case cannot produce valid evidence in the current environment; the owner and exact missing capability are recorded. Blocked is not passed.
- **Passed / Failed:** observed for the named revision and environment, with a report, log, screenshot, trace, database assertion, or manual evidence record.
- **Retest passed:** a reproduced defect was fixed and the original case plus relevant regressions passed. A single disappearing error does not close a defect.
- **P0/P1:** any open or blocked critical case prevents launch. P2 requires resolution or explicit owner acceptance before release; P3 is polish.
- Local fakes establish only the behavior they actually exercise. They do not prove PostgreSQL locks/RLS, Supabase sessions, provider signatures/metering, real devices, field Core Web Vitals, accessibility conformance, search ranking, or production readiness.

Current environment baseline: no provider credentials, PostgreSQL binaries/server, or container runtime were found. Credentialed tests are therefore initially **Blocked**. CI may provide a fresh PostgreSQL service and managed browsers; that is separate evidence from hosted Supabase and paid providers.

## Build, public product, and discovery

| ID | Pri | Scenario | Layer / environment | Initial state | Required evidence |
|---|---|---|---|---|---|
| BLD-01 | P1 | Strict TypeScript, ESLint, unit/component tests, migration-chain check, and production build succeed together | Local + CI / current revision | Planned | Command logs and build route output |
| BLD-02 | P1 | Dependency audit and secret/artifact/mock-import scans have no unaccepted release finding | Local + CI | Planned | Audit JSON/text and scoped scan output |
| PUB-01 | P1 | All 21 public routes render one visible H1, expected status, useful content, and no runtime error | Production browser | Planned | Playwright HTML/report |
| PUB-02 | P1 | All six launch articles have unique substantive bodies, semantic headings/TOC, working internal/external links, related links, and truthful dates | Content unit + production browser | Planned | Content assertions and six-article browser report |
| PUB-03 | P1 | Header, Products menu, mobile menu, footer, pricing CTAs, FAQ, contact validation, and all internal fragments work | Production browser | Planned | Navigation/link audit and traces on failure |
| PUB-04 | P1 | Unknown product/article/workspace/admin routes and `/refund-policy` cannot return false success | Production browser/API | Planned | Actual 404 or authorized safe denial evidence |
| SEO-01 | P1 | Every indexable route has unique title/description, self-canonical on the verified origin, OG/Twitter tags, and one H1 | Production HTML | Planned | All-route metadata assertion report |
| SEO-02 | P1 | Sitemap contains exactly eligible public routes/articles; robots and private metadata exclude auth, `/app`, `/admin`, and API URLs | Production HTTP/HTML | Planned | Parsed sitemap/robots/noindex report |
| SEO-03 | P1 | JSON-LD parses and matches visible Organization/WebSite/SoftwareApplication/Article/Breadcrumb/Offer content without ratings or false availability | Production HTML + validator where available | Planned | Structured-data assertion output; no rich-result guarantee |
| SEO-04 | P2 | Six articles and public routes have no broken crawlable links, duplicate canonical targets, or thin/placeholder content | Production browser/content | Planned | Crawl report |

## Authentication and account

| ID | Pri | Scenario | Layer / environment | Initial state | Required evidence |
|---|---|---|---|---|---|
| AUTH-01 | P1 | Without configuration, auth and private routes fail closed without session/storage success or secret reflection | Local production browser | Planned | Browser assertions and storage/cookie inspection |
| AUTH-02 | P0 | Unique test user can sign up, verify email, sign in, refresh, sign out, and cannot reuse an invalid/expired callback | Disposable Supabase | **Blocked: credentials/project** | Credentialed Playwright trace and test-user cleanup record |
| AUTH-03 | P0 | Recovery is generic, requires a valid recovery session, enforces password policy, and invalidates/updates only the intended account | Disposable Supabase + test email | **Blocked: credentials/email** | Two-account recovery evidence and safe response comparison |
| AUTH-04 | P1 | Google/GitHub OAuth, cancellation, PKCE callback, exact redirect allowlists, and safe `next` handling work | Disposable Supabase/providers | **Blocked: provider setup** | Provider callback traces; no arbitrary redirect |
| AUTH-05 | P0 | Suspended/deleted/missing profiles and expired sessions cannot access customer or admin data even with otherwise valid claims | Supabase + PostgreSQL | **Blocked: live stack; unit subset planned** | Role/claim-switching integration report |
| AUTH-06 | P1 | Password manager/paste, 15/128 Unicode boundaries, terms, remember-me, and no account enumeration remain intact | RTL + browser + live subset | Planned local; live blocked | Unit/browser and credentialed evidence separated |

## Customer workspace and four products

| ID | Pri | Scenario | Layer / environment | Initial state | Required evidence |
|---|---|---|---|---|---|
| APP-01 | P0 | `/app` and every workspace API show only the verified owner's current profile/wallet/projects/history; another user receives safe not-found/denial | Disposable full stack | **Blocked: live stack; owner-predicate unit subset planned** | Two-user API/browser/RLS evidence |
| CHAT-01 | P0 | Chat creates an owned conversation, reserves once, streams real/mocked provider output as labelled, stores history, and settles exact actual cost | Unit/provider fake + live Gateway smoke only if authorized | Planned mock; live blocked | Stream/job/ledger evidence and correlation IDs |
| CHAT-02 | P0 | Duplicate submission, disconnect, stream error, missing generation ID, and post-processing failure never create a false complete answer or blind charged retry | Provider fake + database integration | Planned | Failure-injection and job/ledger state report |
| IMG-01 | P0 | Image generation validates model/options, stores only owned bounded assets, settles once, and supports an authorized download | Provider fake + authorized smoke | Planned mock; live blocked | Job/asset/ledger checks and signed-download test |
| VID-01 | P0 | Video start/poll/error/timeout resumes without restarting a charged operation and distinguishes pending, output, and reconciliation | Provider fake + durable-job test | Planned mock; live blocked | Operation-reference and attempt-count evidence |
| WEB-01 | P0 | Website source generation/edit requires current ownership and paid/reconciled generation, passes isolated validation, and deploys preview only | Provider/sandbox fakes + authorized E2B/Vercel smoke | Planned mock; live blocked | Source/build/deployment state and target assertions |
| WEB-02 | P0 | Untrusted HTML/CSS/JS cannot obtain application origin, cookies/storage, credentials, unrestricted network, forms, or app-server execution | Source unit + real browser response-header/isolation test | Planned | Direct-preview and iframe exploit regression evidence |
| WEB-03 | P1 | Customer website DTOs exclude sandbox IDs, unrestricted Vercel IDs, signing material, diagnostics, and other users' source/assets | API/RTL + two-user integration | Planned | Exact response-key and ownership assertions |

## Credits, payments, and administration

Detailed vectors live in `credit-engine-test-plan.md` and `payment-test-plan.md`.

| ID | Pri | Scenario | Layer / environment | Initial state | Required evidence |
|---|---|---|---|---|---|
| CR-01 | P0 | Exact decimal-to-credit arithmetic, rounding, invalid values, and safe-integer bounds are correct | Vitest | Planned | Parameterized unit report |
| CR-02 | P0 | Purchase, hold, release, settlement, compensation/reversal, and reconciliation produce balanced append-only movements | Vitest + real PostgreSQL | Planned unit; DB blocked locally/CI planned | Wallet-versus-ledger reconciliation SQL |
| CR-03 | P0 | Parallel holds/adjustments cannot overdraw, duplicate, or lose updates; parallel identical requests create one effect | Real PostgreSQL concurrency | **Blocked locally; CI service planned** | Concurrent worker results, counts, balances, traces |
| CR-04 | P0 | Settlement retries require identical exact cost and metering identity; same rounded credit/different evidence conflicts | Unit + real PostgreSQL | Planned | Conflict and no-extra-movement assertions |
| CR-05 | P0 | Actual cost above available funds preserves output/evidence and enters reconciliation without negative balance or false success | Unit + database/job integration | Planned | Reservation/wallet/job/usage state evidence |
| PAY-01 | P0 | Creator/Pro/Studio remain one-time $19/$49/$99 for 1,900/4,900/9,900 credits in content, schema, checkout, and fulfillment | Unit + database + Dodo test | Planned local; provider blocked | Exact-value and product mapping report |
| PAY-02 | P0 | Checkout uses server prices, stable idempotency, safe URLs, and grants nothing on creation/return | Route fake + Dodo test mode | Planned mock; live blocked | Repeated checkout and zero-ledger-before-webhook proof |
| PAY-03 | P0 | Raw-body signatures, missing/invalid headers, replay, same-ID/different-body, and concurrent deliveries are safe | Verification unit + real PostgreSQL + Dodo test | Planned local subsets | Signature/replay/concurrency report |
| PAY-04 | P0 | Wrong owner/purchase/pack/product/quantity/currency/pre-tax amount/session/subscription/status cannot grant credits or corrupt state | Unit + database integration | Planned | Mismatch matrix and reconciliation evidence |
| PAY-05 | P0 | Exactly one verified succeeded payment produces one grant, one receipt outbox, and consistent purchase/payment/wallet state | Real PostgreSQL + Dodo test mode | **Blocked locally; CI DB planned; provider blocked** | Post-commit SQL and duplicate-delivery results |
| ADM-01 | P0 | Every admin route/read/action denies anonymous, non-admin, wrong permission, inactive/expired membership, and direct bypass | Guard unit + Supabase/PostgreSQL/browser | Planned unit; live blocked | Permission-route-action matrix |
| ADM-02 | P0 | High-impact mutations require recent AAL2/TOTP, expected state, bounded input, idempotency, and atomic audit | Unit + real PostgreSQL/Supabase MFA | Planned unit; live blocked | Stale/step-up/audit-failure/replay evidence |
| ADM-03 | P0 | Credit adjustment keys cannot be reused for a different request/target/actor without conflict and every new effect has an audit row | Route/unit + database concurrency | Planned | Cross-target/actor replay tests and audit counts |
| ADM-04 | P1 | Admin responses and logs contain no secrets, prompts, source, raw payment events, signed URLs, or restricted provider/deployment identifiers | Static/API tests | Planned | Exact DTO-key and redaction scans |

## Security, compatibility, accessibility, and performance

| ID | Pri | Scenario | Layer / environment | Initial state | Required evidence |
|---|---|---|---|---|---|
| SEC-01 | P0 | Every private API enforces identity, owner/permission scope, safe errors, and no browser-authoritative fields | Route integration + two-user live stack | Planned mock; live blocked | Endpoint authorization matrix |
| SEC-02 | P1 | Cookie mutations reject cross-origin/malformed/insecure origins; provider callbacks require signatures instead | Production route tests | Planned | Origin/CSRF case report |
| SEC-03 | P1 | Content type, body size, malformed JSON, schema, UUID, newline/header, and validation inputs fail safely without leakage | Unit + production HTTP | Planned | Negative-input response corpus |
| SEC-04 | P1 | Sensitive routes have configured production rate limits, bounded concurrency, and fail-closed behavior; trusted IP handling is reviewed | Unit + authorized staging | Planned local; staging blocked | Limit outcome and configuration evidence |
| SEC-05 | P0 | Security headers and direct/embedded website previews prevent clickjacking, MIME sniffing, referrer leakage, and same-origin untrusted execution | Production browser/header tests | Planned | Header matrix and browser isolation trace |
| SEC-06 | P0 | R2 ownership/checksum/size and provider URL/redirect/SSRF controls block cross-owner or unrestricted downloads | Unit + authorized R2 failure tests | Planned unit; live blocked | Signed URL/key/host and bounded-stream evidence |
| SEC-07 | P1 | No generated source runs in the primary process; E2B has no inherited secrets/network and fixed commands only | Static/unit + authorized E2B smoke | Planned local; live blocked | Process/network/env and sandbox cleanup evidence |
| MOB-01 | P1 | Public/auth and accessible private states work at 320/360/390/430/768/834/1024/1280/1440/1920 without page overflow or lost controls | Production Chromium | Planned | Route-width matrix and failure screenshots |
| MOB-02 | P1 | Current Playwright Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari projects pass the supported smoke matrix | Managed browsers/CI | Planned; local availability unverified | Per-project XML/HTML reports |
| MOB-03 | P2 | Real iOS Safari and Android Chrome touch, orientation, keyboard, and device-specific checks pass | Physical devices/browser service | **Blocked: no device/service** | Named device/OS evidence; emulation is not a substitute |
| A11Y-01 | P1 | Axe reports zero serious/critical and no unreviewed violations on all public/auth routes and available app/admin states | Production browser | Planned | Route/state axe JSON and reviewed exceptions |
| A11Y-02 | P1 | Complete keyboard, focus, dialog/menu, form error, status, skip-link, reduced-motion, target-size, and reflow review passes | Browser + manual | Planned | Keyboard script results and manual checklist |
| A11Y-03 | P1 | 200%/400% zoom, text spacing, forced colors, and screen-reader journeys are usable | Manual AT/browser modes | **Blocked pending tools; browser zoom subset planned** | Named AT/browser/setting evidence; no certification claim |
| PERF-01 | P1 | Production Lighthouse mobile/desktop medians meet documented budgets on home, pricing, one article, and available login | Local/CI Lighthouse, 3 runs | Planned | JSON/HTML reports, median calculations, environment |
| PERF-02 | P1 | Lab LCP/CLS and measured interaction responsiveness meet budgets; no field CWV claim without real-user p75 data | Lab browser + post-launch field | Planned lab; field blocked | Lab traces and separately labelled field status |
| PERF-03 | P2 | Client manifests, route resources, image/font behavior, and third-party requests remain within reviewed budgets | Production build/browser | Planned | Manifest/resource report |

## Operations and final release

| ID | Pri | Scenario | Layer / environment | Initial state | Required evidence |
|---|---|---|---|---|---|
| OPS-01 | P1 | GitHub Actions repeatably runs static/unit/build, Chromium, cross-browser, security, and isolated PostgreSQL jobs with artifacts | GitHub Actions | Planned | Workflow run URLs and uploaded reports |
| OPS-02 | P0 | Fresh migrations, grants/RLS/append-only constraints, seed conflicts, and forward recovery pass on disposable PostgreSQL/Supabase | CI PostgreSQL + hosted Supabase when available | Planned CI; hosted blocked | Migration/test logs and role assertions |
| OPS-03 | P0 | Backup restoration, ledger/payment reconciliation, alert drills, and rollback to a compatible known-good revision are demonstrated | Authorized staging | **Blocked: staging/owners** | Dated drill evidence and approver |
| REL-01 | P0 | No open P0/P1 defect or blocked critical release gate remains; final reports link evidence for the exact release revision | Release review | **Blocked** | Signed final QA/readiness report |
| REL-02 | P0 | Production deployment occurs only after explicit authorization, tested rollback, live payment/AI controls, legal/support/operations approval | Production owners | **Blocked: not authorized** | Authorization and deployment/rollback records |

## Current recommendation

**NO-GO.** This is the initial matrix, not a completion claim. Live identity/database/payment/provider evidence, cross-browser/performance runs, and all defect retests must be reconciled before a different recommendation is possible.
