# Failure and blocked-evidence report

Status: **active Prompt 6 evidence log through revision `7ba4bc7`**. Product remediations are registered in `bug-register.md`; this file preserves test defects, infrastructure incidents and unavailable evidence. None of these entries is a pass.

## Current environmental limitations

| ID | Type | Observed condition | Affected evidence | Disposition |
|---|---|---|---|---|
| ENV-001 | Local database availability | No local `psql`, PostgreSQL server, container runtime or `DATABASE_URL` is available | Local migrations/locks/RLS | Superseded for disposable PostgreSQL by the guarded CI service; hosted Supabase remains blocked |
| ENV-002 | Provider credentials | Supabase, Dodo, Gateway, R2, Inngest, E2B, Vercel, Upstash and Resend credential names are unset locally | Credentialed auth/admin/payment/AI/storage/jobs/email/deployment | Blocked; mocks and unconfigured 503s are not live success |
| ENV-003 | Real devices/AT/field tools | No physical mobile device, named screen-reader service, field RUM, Search Console or staging environment is available | Physical mobile, named AT, field CWV, indexing/ranking, operational drills | Blocked pending owners/tools; emulation and lab results remain separate |
| ENV-004 | Local managed browsers | Firefox/WebKit installation failed locally with TLS `ECONNRESET`; packaged Chromium requires `/tmp/chromium` and `/tmp/al2023/lib` | Local Firefox/WebKit | Managed GitHub Actions browser projects provide independent CI evidence; no local Firefox/WebKit claim |
| ENV-005 | Deployment authority | No production target, live-money authorization, destructive production-test authorization or owner approval exists | Deployment, rollback, live charge, unrestricted provider smoke | Not performed; production remains prohibited |

## Test and infrastructure incident log

| ID | Classification | Expected / actual | Correction or current action | Evidence/state |
|---|---|---|---|---|
| TEST-001 | Test defect — PostgreSQL assertions | First CI database run executed all seven tests: five passed; RLS returned a bigint as a string and Drizzle wrapped the unique/trigger causes, so two assertions failed despite the expected database behavior | Cast the RLS credit column to integer and assert PostgreSQL `cause.code`, `constraint_name` and trigger messages | Fixed in `3b6b859`; guarded PostgreSQL job passed in run `42067360809` |
| TEST-002 | Test defect — browser timeout | One reflow test performed 84 WebKit page loads under the 30-second default; Mobile Safari timed out on every retry without an overflow/control assertion failure | Split into four independent width tests, preserving every assertion | Fixed in `3b6b859`; later WebKit resource errors are tracked separately as TEST-003 |
| TEST-003 | Test timing — WebKit resource errors | After the split, layout/control assertions passed but rapid navigation emitted WebKit `_rsc` prefetch resource errors from unsettled navigation activity | Did not filter the errors; waited for prefetch network activity to settle before the next navigation and retained a 60-second ceiling | Closed in `7ba4bc7`: both WebKit projects passed in full CI run `42069035875` |
| TEST-004 | Test defect — Lighthouse budget | First 24-audit performance matrix met all performance/accessibility/best-practices/metric budgets but failed `/login` SEO 66 because the intentionally noindex route was treated as indexable | Verify `is-crawlable` is the sole SEO deduction in every login trial; keep the low score visible and enforce normal SEO on every indexable route | Corrected local matrix passed 24/24; CI performance job passed in run `42067360809` |
| TEST-005 | Test robustness — Mobile Safari signup | One initial Mobile Safari signup attempt did not display the unconfigured result within five seconds; retry passed | Assert updated password values and checked terms before submission, and allow ten seconds for the honest result | Closed in `7ba4bc7`: Mobile Safari project passed in full CI run `42069035875` |
| TEST-006 | Test artifact retention | A later Playwright startup cleaned `test-results/`, deleting earlier Lighthouse reports | Move Lighthouse output to dedicated ignored `performance-results/`, update ESLint/Git ignore and CI artifact upload, then rerun all 24 audits | Closed; final local 24/24 reports persist outside Playwright's cleanup path |
| INFRA-001 | GitHub artifact upload | Firefox's test step in run `42067360809` exited successfully, but `actions/upload-artifact` remained in progress after the test process ended | Preserve the step-level result; do not call the upload a test failure. A newer revision was pushed and the previous run is superseded | Infrastructure only; subsequent full run `42069035875` and all artifact steps passed |

## Historical CI results retained for discrimination

- Run `42065241613` / `6182090`: static/unit/build and dependency-audit passed; Chromium, Mobile Chrome and Firefox passed; the first real PostgreSQL run had 5/7 passing with the two assertion defects above; WebKit projects exposed the monolithic timeout.
- Run `42067360809` / `3b6b859`: PostgreSQL, static/unit/build, dependency-audit, performance, Chromium and Mobile Chrome passed; desktop WebKit reported 76 passed/4 failed and Mobile Safari 75 passed/4 failed/1 flaky, all four hard failures being the `_rsc` resource-error assertion. Firefox's test step succeeded before the artifact-upload incident.
- Run `42069035875` / `7ba4bc7`: all eight jobs passed—static/coverage/build, real PostgreSQL, dependency audit, performance, Chromium, Firefox, WebKit, Mobile Chrome and Mobile Safari (five browser projects total).
- Local production Chromium: 77/77 passed before the reflow split, 52/52 focused authentication/public-quality tests passed after the settled-network change, and the final 80/80 suite passed after the structured-data correction. Local Mobile Chrome: 77/77 passed before the split; no assertion was removed by the later harness changes.

## Retry and evidence policy

- CI retries are capped at two and original/retry artifacts are retained. A retry pass is labelled flaky, not silently converted into a clean first-attempt result.
- Never blind-retry a potentially paid AI submission, checkout/provider create with unknown acceptance, deployment, migration or destructive operation.
- A disappearing error is investigated for environment, timing, state and test isolation causes; it does not close a defect by itself.
- Blocked launch-critical checks keep the recommendation at **NO-GO**.
