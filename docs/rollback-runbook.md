# Rollback and financial recovery runbook

Status: **procedure only; no rollback or production operation performed**. Use only with explicit target-environment authorization and the on-call/security/finance owners required by the incident.

## Rollback triggers

Stop or roll back the affected release for credible cross-tenant/session exposure, untrusted application-origin execution, duplicate/missing credits, overdraft, payment mismatch corruption, authentication/authorization outage, uncontrolled paid retries, destructive migration, critical inaccessible workflow, or material public-site failure. Do not wait for a second suspicious financial event before containing it.

## Immediate containment

1. Record UTC time, release/schema revision, safe request/provider/job/payment IDs, and the incident owner. Do not dump secrets, raw payloads, prompts, customer source, or full records into chat/tickets.
2. Disable only the affected operation through the reviewed server control where available; do not edit balances or statuses from a browser.
3. For unknown payment/AI/deployment acceptance, stop automatic retry and preserve the current submission/outbox state. Unknown is not failed and not success.
4. If credentials may be exposed, rotate them through the provider/secret store and purge access according to the security incident procedure; do not print old/new values.
5. Capture logs/metrics/database evidence with access control before changing state.

## Application rollback

1. Identify the last known-good immutable application deployment and its compatible schema/provider configuration.
2. Confirm the candidate does not depend on a newer column/enum/policy or a newer Dodo product/Gateway price contract.
3. Use the hosting platform's documented rollback/redeploy procedure for that exact artifact; do not rewrite Git history or deploy an unreviewed branch.
4. Verify public status/headers/metadata, login/session, private authorization, contact, checkout creation (without forcing a payment), job/outbox health, and safe error behavior.
5. Watch webhook signature failures, payment mismatches, old reservations, unknown submissions, outbox backlog, and error/latency alerts through the agreed window.
6. Record the rollback deployment ID, operator, evidence, and remaining incident actions. Application rollback does not reverse external provider effects.

## Schema roll-forward/recovery

- Prefer additive/forward migrations over destructive rollback of committed schema changes. Never hand-edit migration history.
- Restore a backup only into an authorized target after establishing recovery-point/time, current writes, and a reconciliation plan. A restore drill is required before launch.
- If old/new application versions coexist, verify compatible reads/writes and RLS/grants before reopening traffic.
- Ledger, audit, payment, usage, webhook, and outbox evidence is not deleted to make reconciliation easier.

## Payment and credit incident recovery

1. Freeze affected checkout/fulfillment/adjustment/settlement operations, not public read-only status unless necessary.
2. Preserve verified Dodo event ID/body hash, internal purchase/payment IDs, wallet ledger/reservation/usage records, and request correlation. Raw signatures/payloads remain restricted.
3. Re-read authoritative provider records using the correct test/live environment. Never use a browser return URL as payment proof.
4. Reconcile in a reviewed transaction using stable purchase/reservation/adjustment IDs. Historical entries remain immutable; corrections use compensating entries with actor/reason/reference/audit.
5. Confirm exactly-once purchase grant, no negative counters, consistent reservation/usage/job state, and receipt/outbox state. Email failure does not erase payment evidence.
6. Support/refund/dispute action follows approved legal/provider procedures; this revision has no automatic refund/dispute mutation and must not simulate one.

## AI, storage, job, and deployment recovery

- Recover Gateway generation ID/actual cost before settling or retrying an uncertain operation. No blind paid resubmission or hold release.
- R2 and PostgreSQL are not atomic. Inventory orphan objects after upload/database failure and remove only confirmed test/orphan objects through a reviewed procedure; never duplicate postprocessing blindly.
- For Vercel create uncertainty without a stored deployment ID, inspect authorized team/project/provider evidence before another create. Production target remains prohibited by application policy.
- Re-drive outbox records by stable event key after confirming side-effect state. Inngest event dedup is supplemental to database idempotency.

## Validation and closure

Require the original failure regression, financial/authorization reconciliation, affected browser smoke, clean error/log review, and owner sign-off. Reopen if the symptom recurs or evidence is incomplete. Update `failure-report.md`, `bug-register.md`, `deployment-report.md`, and `launch-report.md` with actual outcomes; never mark a rollback tested merely because this runbook exists.
