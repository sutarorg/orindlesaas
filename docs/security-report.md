# Security evaluation report

Status: **local/CI implementation security regressions passed in the available scope; security launch sign-off is NOT MET**. Hosted Supabase, credentialed two-user authorization, provider, staging and recovery evidence remains unavailable. Framework and procedures: `security-test-plan.md`.

## Executed scope and results

Reviewed and exercised identity/guard boundaries, API validation/origin/error primitives, migrations/RLS/grants, wallet/payment/webhook services, admin mutations, AI/job state, R2/provider downloads, generated website source/preview, E2B and Vercel boundaries, build/dependency configuration, and inherited security tests. No exploit was run against production and no real customer data or credentials were used.

| Domain | Fresh evidence | Result and boundary |
|---|---|---|
| Auth/session/private routes | Production browser checks for noindex/private handoff, invalid forms, no visitor-supplied account state, no false session, anonymous API denial and safe correlated errors | PASS for unconfigured/anonymous scope; hosted Supabase signup, recovery, MFA, expiry and session lifecycle BLOCKED |
| Object/action/field authorization | Exact server guard/owner predicate review; website DTO key/sentinel tests; anonymous admin/customer mutations; real PostgreSQL role/grant assertions | PASS for implemented/tested scope; credentialed two-user Supabase Data API and every admin permission remain BLOCKED |
| Request/CSRF/abuse controls | Cross-origin contact and anonymous charged mutation checks; strict request-ID corpus; bounded body/schema review; fail-closed missing rate-limit configuration | PASS locally; configured Upstash limits and staging failure/alert behavior NOT VERIFIED |
| Payment/credit security | Synthetic webhook mismatch/replay/race tests; real PostgreSQL succeeded-webhook and admin-idempotency concurrency; exact wallet/ledger/audit invariants | PASS in disposable scope; signed Dodo test-mode delivery and live provider reconciliation BLOCKED |
| Website/storage/SSRF | Direct preview top-level opaque-origin shell and embedded `srcDoc` sentinel browser tests; obfuscated script corpus; DTO redaction; fixed E2B command/no inherited secret review | PASS for generated-preview isolation and code paths; authorized E2B/Vercel/R2 execution BLOCKED |
| Dependency/build/release | Clean `npm ci`, zero-finding `npm audit --audit-level=moderate`, reviewed narrow overrides, Drizzle check, workflow least-privilege read permission and no deployment action | PASS for current lockfile/workflow; deprecation/peer maintenance remains |
| Secret/artifact/mock scan | **2,691** tracked/generated text files scanned for private keys, cloud/GitHub/Slack tokens, live/test secret prefixes, webhook secrets, JWTs and signed URLs: **0 high-confidence hits**. 126 generic credential-shaped assignments were reviewed as validation/test messages or generated duplicates; values were suppressed. **237** production source files scanned for test/mock/Vitest/Playwright imports: **0 hits**. Only `.env.example` exists. | PASS for this point-in-time local tree/artifacts; not a hosted log or secret-manager audit |
| Browser/runtime errors | Five-project production browser matrix with runtime error collection; WebKit `_rsc` navigation harness corrected without filtering page errors | PASS in runs `42069035875` and final application run `42074366023` |

## Confirmed findings and remediations

`bug-register.md` records QA-001 through QA-010 with reproduction, root cause, correction and scoped retest. Security-significant closures include:

- **QA-001 (P0):** direct generated-preview navigation now uses an enforced opaque-origin iframe shell rather than relying on top-level CSP sandboxing. Local direct and embedded sentinel regressions pass; hosted deployment sandboxes remain separate.
- **QA-002 (P1):** website API/RSC payloads use explicit display-safe DTOs and exclude provider, sandbox, idempotency and diagnostic internals.
- **QA-003 (P0):** admin credit adjustment idempotency is actor/operation scoped with canonical request conflict detection and atomic movement/audit behavior; real PostgreSQL race regressions pass.
- **QA-004 (P1):** non-success payment events require matching event type, payload status and purchase identity; mismatches enter reconciliation without mutation.
- **QA-005/QA-006:** request correlation is strictly bounded, and symmetric provider-mode/public-secret environment validation has regression coverage.

These closures do not assert hosted provider security. Anonymous `503 integration_unavailable` responses prove fail-closed configuration behavior only, never a positive live integration.

## Remaining launch blockers

1. Hosted Supabase Auth/Data API, actual JWT/role mapping, RLS/grants, two-user ownership, admin permission/MFA and auth-user trigger evidence.
2. Dodo test-mode product/signature/replay/receipt evidence; authorized Gateway/Inngest/R2/E2B/Vercel/Upstash/Resend failure and recovery tests.
3. Authorized staging alert, backup restoration, rollback and incident drills with safe record identifiers.
4. Independent security review of the final release revision and owner acceptance of any residual risk. No destructive production testing is authorized.

## Decision

**Executed local/disposable-CI security regression scope: PASS, including final application CI run `42074366023`. Security launch gate: NOT MET.** Absence of a reported exploit or secret-pattern hit is not evidence of complete security, and local mocks cannot remove the hosted and operational gates.
