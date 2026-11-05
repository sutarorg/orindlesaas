# Failure and blocked-evidence report

Status: **initialized before Prompt 6 test execution**. This register distinguishes product failures, test defects, environment limitations, and unexecuted checks. None of these entries is a pass.

## Current environmental limitations

| ID | Type | Observed condition | Affected evidence | Disposition |
|---|---|---|---|---|
| ENV-001 | Database availability | `psql`, `postgres`, `pg_isready`, Docker, and Podman were not found; `DATABASE_URL` is unset | Local migrations, real locks/RLS/grants/concurrency | Blocked locally. Use isolated CI PostgreSQL for real database evidence; hosted Supabase remains separately blocked |
| ENV-002 | Provider credentials | Supabase, Dodo, Gateway, R2, Inngest, E2B, Vercel, Upstash, and Resend variables checked by name are unset | Credentialed auth/admin/payment/AI/storage/jobs/email/deployment | Blocked; do not invent credentials or substitute fake success |
| ENV-003 | Real devices/AT | No physical mobile device, screen-reader service, field RUM, Search Console, or staging environment is available | Physical mobile, named AT, field CWV, indexing/ranking, operational drills | Blocked pending owners/tools; emulation/lab checks remain separate |
| ENV-004 | Browser/runtime inheritance | Prompt 5 required a packaged Chromium/library override; Prompt 6 has not yet revalidated managed Firefox/WebKit or that fallback | Cross-browser and mobile-WebKit evidence | Unverified, not failed or passed; record fresh install/launch results |

## Historical limitations not reused as current results

Prompt 5 reported 106/106 unit tests and 50/50 production Chromium tests, with no applied database or credentialed provider evidence. Those results are context only. Prompt 6 requires fresh runs and a new matrix. Previous npm audit findings also require a new audit rather than blind remediation.

## Failure logging format

Every new failure receives:

- `Failure ID`, linked matrix/scenario ID, timestamp, revision, environment and owner;
- classification: `product defect`, `test defect`, `infrastructure`, `credential blocker`, `external service`, or `unsupported evidence`;
- exact command/journey, expected/actual, safe error/status, and attempt count;
- screenshot, trace, JSON/JUnit/Lighthouse output or database assertion path;
- whether any data/provider/payment/external effect occurred and required cleanup/reconciliation;
- next action and release severity. Retrying infrastructure does not convert an unexecuted product check into a pass.

## Current product-failure log

No Prompt 6 test failure has been observed yet. Audit hypotheses are listed in `bug-register.md` and will move here/with defect IDs only after reproduction.

## Retry policy

- Do not hide flaky tests with unrestricted retries. CI retries, if any, are limited and both original/retry evidence is retained.
- Never blind-retry a potentially paid AI submission, checkout/provider create with unknown acceptance, deployment, migration, or destructive operation.
- A disappearing error is investigated for environment, timing, state, and test isolation causes; it does not close a defect.
- Blocked launch-critical checks keep the recommendation at NO-GO.
