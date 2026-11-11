# Operations: deploying the migration

## 1. Environment

`OPENROUTER_API_KEY` must be set server-side. Nothing else changes: no Gateway variable remains, and
there is no Inngest or Upstash configuration to add — those were removed and are not reintroduced.

`.env.example` documents the full set, including `JOBS_TICK_SECRET`, `E2B_API_KEY` and the `VERCEL_*`
variables.

## 2. Apply `0005` — requires authorisation, not yet done

```bash
DATABASE_URL=… npx tsx scripts/db-migrate.mts
```

`0003` has already been applied to the hosted database, so it is partially migrated, not empty. `0005`
is written to be idempotent and was re-run three times cleanly against a disposable cluster, but it has
**not** been applied to the hosted database. That needs explicit owner approval.

The migration is additive: it creates `model_endpoints`, adds nullable columns, and defaults
`models.provider` to `'vercel_ai_gateway'` so existing rows stay correctly attributed. No existing column
is renamed and no existing value is rewritten.

## 3. Schedule the tick

Three independent scheduler entries, all `GET /api/v1/jobs/tick` with `JOBS_TICK_SECRET`:

| Task | Purpose | Suggested cadence |
|---|---|---|
| `?task=outbox` | dispatch queued jobs, drive video polling | every minute |
| `?task=metering` | settle generations, look up actual cost, retry reconciliation | every few minutes |
| `?task=catalog` | refresh the catalogue and endpoint registry | hourly or daily |

Without these, video jobs never poll to completion and pending settlements are never reconciled. They
replace the removed Inngest/Upstash scheduling entirely; there is no external queue dependency.

## 4. Seed the catalogue

```bash
npm run catalog:sync
```

Then, in the admin dashboard:

1. Review the endpoint table — provider, slug, prompt and completion rates.
2. Approve and enable the endpoints Orindle should use.
3. Enable the model. It will refuse until at least one priced endpoint is approved, which is the
   intended gate.
4. Confirm it appears in the customer selector for the expected products.

## 5. Order of operations that avoids surprises

Enabling a model before approving an endpoint is blocked, so the failure mode is a refusal rather than a
model that looks live and fails. Discovery without `OPENROUTER_API_KEY` still records models but leaves
`endpoint_status = unknown`; approving is impossible until a keyed sync has run.

## Monitoring

Watch, from the admin dashboard:

- **Endpoints awaiting approval** — the operator queue.
- **Reconciliation required** — generations whose actual cost could not be established. These hold their
  reservations; they are not free.
- **Actual USD shown** and **charged credits** — bounded to the rows displayed.

## Rollback

The code can be reverted; the schema is additive and safe to leave in place. Reverting would require
restoring the Gateway client and its key, which this migration deliberately deleted — there is no
automatic fallback to Gateway, by design. Treat the migration as one-way and verify in a disposable
database before touching the hosted one.

## Known gaps at handoff

- `0005` not applied to the hosted database.
- No paid OpenRouter call has been made; no real generation of any kind has run.
- Schedulers not yet configured.
- E2B and Vercel deployment paths are unchanged but unexercised in this migration.
