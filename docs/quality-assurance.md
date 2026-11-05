# Quality assurance

## Prompt 6 current verification summary — 2026-11-05

The historical stage logs below are retained for traceability, but their then-current limits are superseded by the Prompt 6 reports. Fresh execution now includes 25 unit files/124 tests, a 45-page build, local production Chromium 80/80, five managed CI browser projects, disposable PostgreSQL 16 integration tests, all-route structured-data checks, dependency/secret/artifact/mock-import scans, and a retained repeated Lighthouse matrix.

QA-001 through QA-010 are reconciled in `bug-register.md`; test/infrastructure incidents and all CI runs are in `failure-report.md`. In particular, a later home/mobile LCP failure was corrected and retested rather than hidden by an earlier green run. Current authoritative outcomes are in `final-qa-report.md`, `test-matrix.md`, `release-checklist.md` and `handoff-final.md`.

**Current release recommendation: NO-GO.** Hosted Supabase/Dodo/providers, staging recovery, physical-device/named-AT and complete manual accessibility, field monitoring and owner approvals remain unavailable. Historical statements such as “Lighthouse not run” or “live database not tested” apply only to their labelled earlier stages; Prompt 6 lab and disposable-PostgreSQL results do not remove hosted/field gates.

## Stage gates

1. **Documentation baseline:** all 45 Markdown files exist and are nonempty; architecture, design, routes and contracts are populated before each stage's application code.
2. **Foundation:** exact dependencies installed; strict TypeScript, ESLint, brand tokens and shared layout pass inspection.
3. **Content/routes:** every required page and six substantial articles resolve; `/refund-policy` and unknown slugs return the custom 404.
4. **Experience:** representative mobile/tablet/desktop inspection, keyboard navigation, reduced motion and honest preview states verified in Chromium.
5. **SEO:** unique metadata, canonical/OG, sitemap/robots and truthful JSON-LD checked in rendered production pages; Offer fragments resolve to visible pack cards.
6. **Validation:** typecheck, lint, unit tests, production build and Playwright checks pass. Extended axe and internal-link audits pass. Remaining launch-only limits are listed below.

## Prompt 1 QA log — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Documentation inventory | Pass | 35/35 `docs/*.md` files nonempty; useful handoff and risk documents retained. |
| `npm run typecheck` | Pass | Strict `tsc --noEmit`; no errors. |
| `npm run lint` | Pass | ESLint 10.14.0; no warnings or errors in the final run. |
| `npm run test:unit` | Pass | 4 test files, 11/11 tests: content/link/pack integrity, metadata, FAQ and contact preview. |
| `npm run build` | Pass | Next 16.4.5 production build; 29-page static-generation phase, six SSG article paths, four SSG product paths and dynamic `/signup`. |
| `npm run test:e2e` against production | Pass | 16/16 Chromium tests: all routes/H1s, custom 404s, metadata/JSON-LD, sitemap, menus, pack handoff, contact, FAQ, responsive overflow, axe and reduced motion. |
| Responsive overflow | Pass | `/`, `/pricing`, `/models`, one product page and one article at 320, 390, 768, 1024 and 1440px; 25 combinations, no page-level horizontal overflow. |
| Extended axe audit | Pass | 23 routes (21 indexable routes plus noindex login/signup previews), zero violations for `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` in the tested Chromium states. |
| Rendered internal-link audit | Pass | 105 unique internal URL/fragment targets collected from all 23 rendered routes; zero non-200 targets and zero missing fragment IDs. |
| Representative visual review | Pass with noted limits | Inspected homepage at 1440px and 390px, full mobile pricing at 390px, desktop article at 1440px, models at 768px and Image Studio at 390px. Repeated review after the motion fix showed all content visible. |
| `npm audit --audit-level=high` | Pass | Zero vulnerabilities reported on 2026-11-05. |
| Secret-pattern source scan | Pass | No private-key, service-role or live-key patterns found in `app`, `components`, `lib`, `tests` or `docs`; `.env.example` contains public placeholders only. |

Automated axe results are not a WCAG certification. They cover the tested DOM/viewport states, not every possible interaction or assistive technology.

## Defects found and corrected during browser QA

- The first npm-packaged Chromium launch lacked NSPR/NSS shared libraries. Extracting the package's bundled `al2023` libraries and setting `LD_LIBRARY_PATH` resolved the environment failure. Serverless GPU/single-process flags were then removed for local test stability.
- Article-card opacity and muted accent text produced contrast failures. Opacity was removed from meaningful labels and teal text was darkened to `#067a67`.
- Long CTA min-content widths and an article table expanded narrow grids. Buttons may now wrap, article tracks use `minmax(0, 1fr)`, and wide tables remain inside labelled horizontal scroll regions.
- Initial opacity-based reveals could remain transparent when reduced motion became active after hydration. Reveals now start visible (`initial={false}`), use only a small transform keyframe for motion and have no reduced-motion animation. A regression test checks every homepage reveal has opacity 1 and no transform.
- Pricing Offer URLs used `/pricing#creator`, `#pro` and `#studio` before matching element IDs existed. The visible pack articles now own those IDs and an E2E test verifies every fragment.
- A test selector matched both “Pro” and “Products”; it now uses an exact accessible-name match. Sitemap validation uses the request fixture rather than rendering XML in Chromium.

## Browser execution used in this sandbox

The production server ran with `npm run start` on `0.0.0.0:3000`. The standard local path is `npx playwright install chromium` followed by `npm run test:e2e`. The CDN download was unavailable here, so the optional dev-only npm Chromium package was used:

```bash
node --input-type=module -e "import c from '@sparticuz/chromium'; c.setGraphicsMode=false; await c.executablePath();"
node --input-type=module -e "import { inflate } from './node_modules/@sparticuz/chromium/build/lambdafs.js'; await inflate('node_modules/@sparticuz/chromium/bin/al2023.tar.br');"
LD_LIBRARY_PATH=/tmp/al2023/lib \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
npm run test:e2e
```

These are test-environment settings, not application runtime requirements. No browser binary or shared library is stored in the repository.

## Honest frontend behavior reviewed

- Contact submission performs local validation and explicitly states that no message was sent or stored.
- Pack selection opens `/signup?pack=...`; it does not start checkout, take payment or grant credits.
- All six authentication routes are noindex frontend previews. Forms validate locally and explicitly state that no account, session, email, preference or password operation occurred.
- OAuth controls never contact a provider or redirect; callback presentations ignore code/token/next values. Reset/resend responses do not reveal account existence.
- No AI generation, database write, email delivery, deployment or real authentication/session handling exists.
- No testimonials, customer logos, ratings, savings claims, scarcity or fabricated model availability appears.

## Prompt 2 QA log — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Documentation inventory and ordering | Pass | 37/37 `docs/*.md` files nonempty. Research, auth design/flows, architecture, contracts, requirements, security and Prompt 3 handoff were updated before application code; only docs changed at the checkpoint. |
| Risk-copy synchronization | Pass | `mistakes-that-may-occur-and-priorities.md` and `mistakesthatmayoccurandpriorty.md` are byte-identical. |
| `npm run typecheck` | Pass | Strict `tsc --noEmit`; no errors after implementation and test additions. |
| `npm run lint` | Pass | ESLint 10.14.0; no warnings or errors. |
| `npm run test:unit` | Pass | 7 files, 24/24 tests. New coverage includes Unicode password limits, state allowlists, every mock method, generic reset responses, labels/errors/focus, visibility and OAuth feedback. |
| `npm run build` | Pass | Next 16.4.5 production build; 33-page static-generation phase. Login/signup/reset/verify/callback are request-time routes; forgot-password is static. |
| Production Playwright | Pass | 40/40 Chromium tests: 24 authentication tests plus 16 Prompt 1 regressions. |
| Auth axe automation | Pass within limits | 13 auth routes/states, zero violations for `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` in the tested Chromium DOM states. |
| Auth responsive overflow | Pass | Nine auth routes/states at 320, 390 and 1440px: 27/27 combinations with no page-level horizontal overflow. |
| Keyboard and state behavior | Pass | First-invalid focus, Enter/Space password/checkbox controls, loading feedback, mismatch/terms, all required server-state designs, no callback reflection and no auth-like storage keys tested. |
| Representative visual review | Pass with noted limits | Inspected login at 1440px, Pro signup at 390px, verification success at 1280px and callback error at 390px from the production build. |
| Dependency/security boundary | Pass | `npm audit --audit-level=high` reported zero vulnerabilities; secret-pattern and auth-side-effect scans passed. No Supabase dependency, auth environment variable, provider secret or real credential source was added. |

Automated axe results are not a WCAG certification. The auth success/expiry states are explicit component previews, not evidence of a real authentication or email operation.

## Prompt 3 QA log — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Documentation inventory and ordering | Pass | 39/39 `docs/*.md` files nonempty. Dashboard research, architecture, navigation, contracts, requirements, design, security, testing, plans, risks and Prompt 4 handoff were updated before application code. Final evidence was reconciled after implementation. |
| Risk-copy synchronization | Pass | `mistakes-that-may-occur-and-priorities.md` and `mistakesthatmayoccurandpriorty.md` are byte-identical. |
| `npm run typecheck` | Pass | Strict `tsc --noEmit`; no errors after all implementation and test additions. |
| `npm run lint` | Pass | ESLint 10.14.0; no warnings or errors. |
| `npm run test:unit` | Pass | 10 files, **40/40 tests**. New dashboard coverage includes registry/fixture integrity, estimates, navigation, filters, safe markdown, component behavior and every no-operation adapter method. |
| `npm run build` | Pass | Next 16.4.5 production build; 46-page generation phase, all 16 workspace routes and `/app/[...not-found]`. |
| Production Playwright | Pass | **77/77 Chromium tests**: 37 dashboard tests plus all 40 Prompt 1/2 regressions. |
| Workspace axe automation | Pass within limits | 16/16 workspace route scans, zero violations for `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` in the tested Chromium DOM states. |
| Workspace responsive overflow | Pass | All 16 workspace routes at 320, 390 and 1440px: **48/48 combinations** without page-level horizontal overflow. |
| Workspace internal-link audit | Pass | 49 unique internal URLs and 21 fragment URLs collected from all 16 rendered workspace routes; zero non-200 targets or missing fragment IDs. |
| Keyboard and state behavior | Pass | Mobile drawer Escape/focus return/close-on-navigation, sidebar collapse, notification/profile menus, chat composer/streaming/error, media dialogs, website viewports/code safety, CRUD confirmations, wallet/settings no-operation feedback and unknown-ID 404s. |
| Representative visual review | Pass with noted limits | Inspected production screenshots of desktop overview, mobile chat, desktop Image Studio, desktop/mobile website editor and mobile Credits. Content was visible and coherent; no page overflow or browser console errors occurred. |
| Dependency/security boundary | Pass | `npm audit --audit-level=high` reported zero vulnerabilities. Secret-pattern and dashboard `fetch`/storage scans found no matches. No provider SDK, payment, authentication, persistence or deployment credential source was added. |

Automated axe results are not a WCAG certification. They cover the tested route DOM states, not every possible interaction, zoom level or assistive technology.

### Prompt 3 defects found and corrected

- Initial UI code used different helper/type names from the pre-implementation contracts. Strict TypeScript exposed the mismatch; canonical fixture DTOs were retained and concise aliases/detailed intent/estimate types were added rather than weakening typing.
- File inputs lacked their own accessible labels, several muted preview colors missed contrast, and a dark support-card heading inherited the global heading color. Inputs were labelled, colors darkened and the heading override corrected before rerunning axe.
- Website settings used an intrinsic implicit grid track that overflowed at 320px. A bounded base grid track and `min-w-0` panel sizing resolved it; all 48 route/viewport combinations then passed.
- Unmatched `/app/*` initially used marketing 404 chrome. A workspace catch-all restored DashboardShell, but the root streaming `loading.tsx` still produced 200 before dynamic fixture lookup rejected an ID. The loading presentation is now scoped to Image Studio; unknown routes and IDs return actual 404 responses with workspace chrome.
- Video-mode and estimate/browser tests initially used a hidden-radio click target, ambiguous text and an immediate mid-transition width assertion. Tests now click the visible label, use exact names and poll the actual preview width; application behavior was not bypassed.

## Prompt 4 documentation checkpoint — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Admin research and documentation ordering | Pass | WAI/Carbon/PatternFly/OWASP research and six admin documents completed before admin application code; shared contracts/routes/design/security/testing/plans were reconciled. |
| Documentation inventory | Pass | 45/45 `docs/*.md` files nonempty after adding the admin document set. |
| Risk-copy synchronization | Pass | Both risk filenames synchronized after adding admin authorization, financial-label, redaction and audit risks. |
| Application validation | Not yet run at this checkpoint | No Prompt 4 route is marked implemented/tested by this documentation-only entry. Final results are recorded below after implementation. |

## Prompt 4 implementation QA log — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Documentation inventory and ordering | Pass | 45/45 `docs/*.md` files nonempty. Admin research, six admin documents, shared contracts/routes/design/security/testing/plans and the Prompt 5 operations handoff were completed before application code. Final evidence was reconciled after implementation. |
| Risk-copy synchronization | Pass | `mistakes-that-may-occur-and-priorities.md` and `mistakesthatmayoccurandpriorty.md` are byte-identical. |
| `npm run typecheck` | Pass | Strict `tsc --noEmit`; no errors after implementation and test additions. |
| `npm run lint` | Pass | ESLint 10.14.0; no warnings or errors in the final run. |
| `npm run test:unit` | Pass | 13 files, **57/57 tests**. Seventeen new admin tests cover navigation/permissions, fixture references/modalities, exact packs, UTC ranges, financial arithmetic, formatting/search/pagination, chart/confirmation primitives and every no-operation adapter method. |
| `npm run build` | Pass | Next 16.4.5 production build; 59-page generation phase, all 13 admin destinations and `/admin/[...slug]`. |
| Production Playwright | Pass | **91/91 Chromium tests**: 14 administration tests plus all 77 Prompt 1/2/3 regressions. |
| Admin axe automation | Pass within limits | 13/13 admin route scans, zero violations for `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` in the tested Chromium DOM states. |
| Admin responsive overflow | Pass | All 13 admin routes at 320, 390 and 1440px, plus Overview/Users/Usage/Adjustments/Settings at 768 and 1024px: **49/49 combinations** without page-level horizontal overflow. |
| Keyboard and honest behavior | Pass | Mobile drawer Escape/focus return/navigation, local global search, user/payment/job filters and pagination, model/pricing/package review forms, payment reconciliation, job retry, user/session previews, dispute review, local settings and sign-out feedback. Credit adjustments require reason/reference/review and produce only an ephemeral audit preview. |
| Discovery and 404 behavior | Pass | All admin routes are noindex and excluded from sitemap/robots discovery; unknown admin routes return an actual 404 inside admin chrome. Next may emit its own additional noindex on a 404; both observed values are safe. |
| Admin internal-link/runtime audit | Pass | 13 unique internal URLs and 13 route-specific `#main-content` fragment targets collected across admin; zero non-200 targets, missing fragments or browser console/page errors. Admin network/storage/secret-pattern scan and API-handler inventory found no prohibited implementation. |
| Representative visual/runtime review | Pass with noted limits | Inspected production desktop Overview, Users and Usage plus mobile Overview. Reviewed the model-cost table fit after screenshots. All 13 routes were checked for browser console/page errors; none occurred. |
| Backend/security boundary | Pass for frontend scope | Adapter tests prove no fixture mutation, payment change, credit change or persisted audit. No admin API, authorization, database, payment/provider SDK, secret, raw webhook, customer file/code or unrestricted deployment identifier was introduced. |

Automated axe results are not a WCAG certification. They cover the tested route DOM states, not every possible interaction, zoom level or assistive technology. No result demonstrates real administration security or financial accuracy.

### Prompt 4 defects found and corrected

- Initial inferred notification state and derived usage-event status types were too narrow; explicit fixture collection/status typing corrected them before the successful build.
- Browser execution initially lacked the packaged Chromium binary and then its NSPR/NSS runtime. Extracting the binary and `al2023` libraries restored the documented local-only test environment; no application runtime dependency was added.
- Browser assertions initially used copy/locator assumptions rather than the actual accessible names (provider heading, pagination labels, chart descriptions and route announcer). Tests were corrected without weakening application assertions; the final complete suite passed.
- Desktop visual review found avoidable clipping in the two-column model-cost table. Its minimum width was refined while retaining named horizontal scrolling for genuinely narrow viewports.

## Prompt 5 backend/integration QA log — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Documentation inventory/risk sync | Pass | **54/54 `docs/*.md` files nonempty**; both risk filenames byte-identical; root README and Prompt 6 handoff reflect current implementation/live limits. |
| `npm run typecheck` | Pass | Strict `tsc --noEmit` after the final server changes; no errors. |
| `npm run lint` | Pass | ESLint over the repository after the final server changes; no warnings or errors. |
| `npm run test:unit` | Pass | **21 files, 106/106 tests**. Includes exact arithmetic/same-cost settlement, payment mismatch validation, raw-body webhook adapter fakes, recent-AAL2/permission guards, provider retry fakes, catalog/source/security and inherited component tests. |
| `npx drizzle-kit check` | Pass | Migration chain/snapshot consistency check passed. No migration SQL was executed. |
| `npm run build` | Pass | Next 16.4.5 production build, strict TypeScript and **45 generated pages**; all API/customer/admin routes compiled. |
| Production Playwright | Pass | **50/50 Chromium tests**: 17 public, 24 authentication, 5 workspace-authorization and 4 admin-authorization tests. |
| Public/auth axe and responsive checks | Pass within limits | The suite’s selected axe scans and viewport assertions passed, including six auth routes and allowlisted legacy query states without accepting spoofed auth success. |
| Credential-free deny-by-default smoke | Pass | Private pages redirect to login; anonymous APIs fail closed with safe correlated errors. With Supabase absent, private API dependencies return 503 `integration_unavailable`, not a false authenticated result. Cross-origin/insecure writes return 403. |
| Auth spoof resistance | Pass | Login/signup ignore visitor-supplied account state; verify/reset/callback do not render query-driven success or expiry. No unconfigured session-policy cookie/storage write was observed. |
| Contact API abuse controls | Pass | Browser mocks prove durable-acceptance wording; direct API checks prove cross-origin 403 and production fail-closed behavior when rate-limit configuration is absent. No real Resend message was sent. |
| Live PostgreSQL/RLS/concurrency | Blocked—not evidenced | No local PostgreSQL, container runtime, or authorized Supabase database is available. No migrations/seeds/catalog writes ran. Unit fakes are not real lock/RLS proof. |
| Credentialed provider journeys | Blocked—not evidenced | No real Supabase, Dodo, Gateway, R2, Inngest, E2B, Vercel, Upstash, or Resend credentials were used. Paid calls and live deployment were not attempted. |

### Prompt 5 security/correctness corrections covered by final checks

- Removed routed query-driven fake authentication success/expiry states and obsolete demo customer/admin browser suites; production smoke tests now assert actual denial behavior.
- Added deny-by-default authorization tests for malformed identity, suspended/missing profiles, expired memberships, wrong permissions, stale/fresh AAL2/TOTP evidence, and missing production rate-limit configuration.
- Added Dodo raw-body/header/hash/signature-failure/size-limit adapter tests and exact payment expectation tests. Live signature/replay/fulfillment races remain open.
- Made checkout honor database pack enablement and exact values; receipt email now uses the customer email and a durable dispatch event with an allowlisted template.
- Prevented direct Data API reads of internal cost/provider/storage/deployment fields in reviewed migration grants; this still requires live GRANT/RLS verification.
- Added the single-open-price database invariant, future-price catalog-sync protection, exact stored-cost settlement checks, and reconciliation usage evidence.
- Added bounded R2 streaming and preserved failed provider outcomes through later metering recovery. Provider/storage postprocessing remains subject to live integration testing.

## Prompt 5 historical remaining validation and launch limits

- Real screen-reader/assistive-technology testing, full 200% zoom/reflow review and real-device testing remain launch-stage work.
- At that Prompt 5 checkpoint, Lighthouse/throttled lab profiling and representative 75th-percentile field Core Web Vitals had not run; Prompt 6 lab evidence is now recorded above, while field CWV remains unclaimed.
- External primary-source links were reviewed during research, but this audit does not guarantee their future availability. Earlier internal-link results remain frontend-stage evidence.
- Final production hostname, verified support inbox, legal entity/governing law and qualified policy review remain unresolved.
- **Commercial/backend launch remains blocked** until migrations and seed/catalog setup are reviewed on a disposable real database; RLS/grants, concurrent ledger/idempotency, webhook replay/fulfillment, and all credentialed customer/admin/provider journeys pass; operational reconciliation/runbooks and dependency-risk review are complete.
- `npm audit` previously reported 11 dependency findings (9 moderate, 2 high), including nested `inngest@4.26.2 -> zod@3.25.76` under GHSA-mrhx-c7xc-m3w5. No blind force upgrade or untested major Zod override was applied; rerun and assess a supported remediation before launch.

## Release tolerance

Any P0/P1 risk, broken required route, failing required check or deceptive transaction state blocks stage completion. Minor content polish may be documented only if it does not undermine requirements.
