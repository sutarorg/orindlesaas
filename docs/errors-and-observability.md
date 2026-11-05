# Errors, redaction and observability

Status: **Prompt 5 contract**.

## Safe errors

Public errors use stable codes, short actionable messages and a request ID. Validation can return allowlisted field codes. Raw Supabase/Dodo/Gateway/R2/Inngest/E2B/Vercel/Redis/Resend errors, stack traces, SQL, response bodies and secrets remain out of responses. Logs use the same safe code with structured operation, actor/object IDs where permitted, attempt, duration and correlation.

Common codes include `validation_failed`, `authentication_required`, `forbidden`, `not_found`, `origin_rejected`, `rate_limited`, `insufficient_credits`, `idempotency_conflict`, `state_conflict`, `step_up_required`, `pricing_unavailable`, `payment_mismatch`, `reconciliation_required` and `integration_unavailable`.

## Redaction boundary

Never log or serialize to admin: passwords, session/access/refresh tokens, cookie values, API/webhook/signing keys, database URLs, full payment/webhook bodies, card/billing details, prompts/conversations, private filenames/content, generated source, R2 keys, E2B environment, unrestricted Vercel IDs, signed URLs or raw provider errors. Customer DTOs may receive their own content only through authorized owner endpoints.

Request IDs are generated or accepted only in a strict bounded format. IPs used for abuse controls are not written to general logs; if retained for security policy, they are truncated/hashed with a server secret and a documented retention period. Email and provider IDs are omitted or redacted in operational logs.

## Metrics and traces

Structured events cover auth outcome (without account-existence detail), rate-limit outcome, checkout creation, webhook verification/duplicate/fulfillment/mismatch, reservation/settlement/compensation, generation state/cost-reconciliation state, outbox attempts, storage/build/deployment state and admin audit outcome. Metrics use safe product/model/state tags and avoid user prompt/content labels.

Financial dashboards distinguish captured payments, customer usage value, actual Gateway AI cost, estimated/modelled values and unreconciled amounts. Gross contribution is usage value minus actual AI cost only; it excludes all other expenses and is not net profit. Unreconciled records are shown separately rather than coerced to zero.

## Alerting and readiness

Alert on repeated webhook signature failures, payment mismatch, duplicate side-effect prevention, negative-balance constraint violations, old open reservations, unknown provider submissions, unsettled actual costs, outbox backlog, repeated job failure and audit-write failure. Health output never exposes credential values or provider payloads.

Production readiness requires central log/metric retention, alerting, backup/restore and reconciliation drills, not merely the presence of these logging calls. Local console output is development observability only.
