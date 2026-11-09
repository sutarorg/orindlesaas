# Background jobs and rate limiting

Orindle runs background work **in-process**. There is no hosted queue and no Redis dependency.

## Work queue: the outbox table

`outbox_events` is the durable work queue. A request inserts a row inside its own transaction, so
work is committed atomically with the state change that caused it. Delivery then happens by
executing that row's payload directly.

| Concern | How it works |
|---|---|
| Dispatch | `dispatchOutboxEvent(key, { inline })` claims the row (`processing`), runs it, then marks it `published` |
| Failure | The row returns to `pending` with `available_at` pushed out by `RETRY_DELAY_MS` and the error recorded |
| Crashed request | `reclaimStaleOutboxEvents()` re-queues rows stuck in `processing` past `CLAIM_LEASE_MS` |
| Scheduled drain | `GET /api/v1/jobs/tick?task=outbox` |

Handlers live in `lib/server/jobs/runner.ts`. Each is **re-runnable**, which is what makes retrying
safe: `runGenerationJob` claims a job through `markSubmissionAttempt` before contacting a provider,
so a retry cannot submit a second paid generation; `deliverEmail` and the deployment helpers key off
their own row state.

User-facing requests pass `{ inline: true }`, which starts long work but leaves provider polling to
the scheduled drain so the request returns within its budget.

## Scheduled tasks

`GET /api/v1/jobs/tick` requires `Authorization: Bearer $JOBS_TICK_SECRET` (constant-time compare).

| Task | Purpose | Former schedule |
|---|---|---|
| `outbox` | Reclaim stale claims, drain pending events | every minute |
| `metering` | Settle `reconciliation_required` generations | every 5 minutes |
| `catalog` | Expire stale sync leases, sync the Gateway catalogue | daily 03:17 |

Point any scheduler (Vercel Cron, a platform cron, or `curl`) at the endpoint.

## Rate limiting

`enforceRateLimit()` uses the `rate_limits` table: one counter row per
`(name, identifier, window_start)`, incremented atomically via `ON CONFLICT`, giving a fixed window
without Redis. Expired windows are pruned opportunistically.

Limiting is an abuse control, not a correctness gate: if the counter write fails, the request is
**allowed** and the failure is logged. It never takes the product down.
