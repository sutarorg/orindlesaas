# Security verification plan

Status: **executed within the available local/CI scope; hosted/staging security evidence remains blocked**. Results and remediations are in `security-report.md`, `bug-register.md` and `failure-report.md`. Framework: OWASP ASVS 5.0.0 and WSTG 4.2 as verification guidance, plus current Supabase RLS/grant documentation. This is not an ASVS certification or a destructive penetration-test authorization.

## Scope and rules of engagement

In scope: the current Next.js revision, public/auth/customer/admin/API routes, migrations, wallet/payment/AI/job/storage/website boundaries, build/dependency configuration, and disposable test environments.

Strictly prohibited without separate written authorization: production destructive testing, real customer accounts/data, live-money transactions, denial of service, credential brute force against shared services, unrestricted AI/media generation, production deployment, or deleting non-test records. Generated code must never run in the primary application process.

Severity follows exploit impact and evidence: P0 includes credible credential/financial compromise, cross-tenant access, arbitrary same-origin execution of untrusted source, duplicate/overdraft financial effects, or release-integrity compromise. P1 includes release-significant authorization, isolation, redaction, CSRF, validation, dependency, or recovery failures. Suspected issues remain hypotheses until reproduced or directly confirmed by code/response evidence.

## Security workstreams

| Workstream | Tests | Method and required proof |
|---|---|---|
| Identity/session | AUTH-01–06, ADM-01/02 | Verified claims, active profile, recovery/MFA context, safe cookies/redirects, logout, inactive/expired identities; live Supabase evidence required for launch |
| Object/action/field authorization | APP-01, SEC-01, ADM-01/03/04 | Two-user and every-permission matrix; direct endpoint/object IDs; exact response keys; server predicates plus actual RLS/grants |
| Request/CSRF/abuse | SEC-02/03/04 | Origin and Fetch Metadata cases, content/body/schema limits, strict correlation IDs, rate-limit configuration/failure, bounded concurrency |
| Payment/credit integrity | CR-01–05, PAY-01–05, ADM-03 | Exact arithmetic, raw signatures, replay/races, state transitions, immutable ledger/audit, no browser-authoritative values |
| AI/job safety | CHAT-01/02, IMG-01, VID-01 | Allowlisted models/prices, actual metering identity, no blind paid retry, safe uncertain states, redacted diagnostics |
| Storage/SSRF | SEC-06 | Owner keys, five-minute signed downloads, checksum/size bounds, exact HTTPS host allowlists, redirect/DNS/IP behavior, no arbitrary bucket/key |
| Generated websites | WEB-01/02/03, SEC-05/07 | Source corpus, direct and embedded browser isolation, unique origin, network/form/navigation restrictions, safe DTOs, fixed no-secret E2B command |
| Information exposure | SEC-03/05, ADM-04 | Safe error corpus, response/log sentinel scans, security/cache headers, secret-pattern and artifact inspection |
| Supply chain/release | BLD-01/02, OPS-01/02 | Lockfile install, audit with remediation review, workflow permissions, pinned actions where practical, migration/grant verification |

## Website-preview threat case (mandatory)

The editor iframe and the direct `/api/v1/websites/:projectId/preview` response are separate attack surfaces. An iframe `sandbox` attribute does not protect a user who opens the API document directly.

1. Confirm the direct response has an HTTP CSP `sandbox` directive that permits only the minimum required behavior and never `allow-same-origin` with scripts.
2. Ensure the response cannot read Orindle cookies, local/session storage, IndexedDB, service workers, or application DOM when untrusted script executes.
3. Restrict outbound image/media/font/network/form/navigation capabilities consistently with the UI claim; `connect-src 'none'` alone does not prevent every DOM-based network side effect.
4. Test obfuscated property access and dynamic DOM creation, not only literal `fetch(` or `document.cookie` strings. Do not use real credentials or external exfiltration hosts; use harmless local sentinels.
5. Verify source API/editor payloads do not expose sandbox or unrestricted deployment identifiers.
6. Retest direct navigation, editor iframe, and deployed preview after any fix. Regex source filters remain defense in depth, not the primary security boundary.

## PostgreSQL/Supabase security proof

A real PostgreSQL CI service can prove constraints, row locks, trigger behavior, and role/grant semantics with a documented test auth scaffold. It cannot be labelled hosted-Supabase evidence. Hosted launch evidence additionally requires the actual Supabase Auth/Data API, JWT claims, role mapping, and auth-user trigger.

Required SQL assertions:

- RLS is enabled on every exposed application table; table/column grants match the intended `anon`/`authenticated` allowlist.
- Adding a policy is never treated as revoking default privileges. Test SELECT/INSERT/UPDATE/DELETE/TRUNCATE for both roles where applicable.
- Two users cannot select or mutate each other's profile/wallet/ledger/purchase/payment/conversation/message rows. Internal generation/usage/asset/build/deployment fields are not directly exposed.
- Parent-owner policies for messages, builds, and deployments cannot be bypassed by parent ID substitution.
- Ledger/audit append-only triggers reject UPDATE and DELETE. Price versions permit only the intended first closure and one open interval.
- The privileged server role may bypass RLS, so every service query still needs explicit owner/permission predicates.
- Parallel tests use independent connections and real `FOR UPDATE`/unique constraints, not a mocked transaction queue.

## API negative corpus

Every applicable endpoint gets cases for:

- Anonymous, wrong user, non-admin, wrong permission, expired membership, stale/missing AAL2.
- Wrong content type, empty/malformed/oversize JSON, unknown fields, invalid UUID/enum/number, Unicode and long input.
- Missing/cross/malformed/insecure Origin and cross-site Fetch Metadata; provider callbacks use signature verification instead.
- Duplicate idempotency key with identical/different body, different target and different actor.
- Attacker-controlled `X-Request-Id`, forwarded host/IP, callback `next`, checkout/deployment URLs, storage keys, and provider IDs.
- Missing provider configuration and provider errors containing secret/SQL/stack sentinels.

Pass requires safe status/code/message, strictly bounded correlation ID, correct cache/security headers, and zero unintended database/provider effect. A 503 caused by missing local Supabase is fail-closed evidence only; it is not a configured 401/403 test.

## Dependency and workflow security

- Run `npm audit` and inspect reachable findings before changing versions; no blind `npm audit fix --force` or untested major override.
- Scan tracked source, environment examples, test fixtures, reports, and build/client output for private keys, service-role keys, live/test secret values, tokens, passwords, and signed URLs. Never print actual secret values in evidence.
- Production code must not import runtime preview mocks or allow a query parameter to select fakes/auth success.
- GitHub workflows use least-privilege `permissions`, no secrets in pull-request-run scripts, isolated test services, and no production deployment action.
- Live smoke workflows, if added, are manual/environment-gated with explicit call/spend limits and no implicit schedule.

## Exit criteria

Security sign-off requires zero open P0/P1 findings, all local/CI security regressions green, real two-user PostgreSQL/RLS/grant evidence, credentialed Supabase/admin authorization evidence, a clean reviewed dependency/secret posture, and documented residual risks. Missing hosted/provider/device evidence remains a launch blocker even when local tests are green.
