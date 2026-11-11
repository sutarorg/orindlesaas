# Database change: `0005_openrouter_provider_neutral.sql`

Sources: `lib/server/db/schema.ts`, `drizzle/0005_openrouter_provider_neutral.sql`,
`drizzle/meta/0004_snapshot.json`.

## Principle: move forward, never rewrite history

The migration is additive and provider-neutral. It does not rename existing `gateway*` columns and it
does not reinterpret existing rows: a historical ID, price or settlement keeps its meaning, because
rewriting it would silently change what Orindle believes it charged.

`gateway_generation_id` is retained exactly as-is, with a comment stating it is a historical Vercel AI
Gateway reference that is never reinterpreted as an OpenRouter ID.

## New table: `model_endpoints`

| Column | Purpose |
|---|---|
| `model_id` | FK to `models`, `ON DELETE cascade` |
| `provider_name`, `provider_slug` | which provider serves this endpoint |
| `pricing_data` | exact decimal rate strings |
| `approved`, `enabled` | operator approval, separate from discovery |
| `last_seen_at` | last time discovery observed it |

Constraints and indexes:

- `model_endpoints_model_provider_unique` on `(model_id, provider_name)`
- `model_endpoints_model_approved_idx` on `(model_id, approved, enabled)`
- `model_endpoints_provider_name_length` check, 1–240 characters
- **`ENABLE ROW LEVEL SECURITY`**

RLS is not optional. A new table needs both `.enableRLS()` in `schema.ts` **and** an explicit
`ALTER TABLE … ENABLE ROW LEVEL SECURITY` in the SQL; with only one of the two, the table is created
without protection. This is recorded as a repeated trap in `openrouter-lessons.md`.

## Added columns

`generation_jobs`: `provider_generation_id`, `provider_job_id`, `provider`, `provider_endpoint`,
`cost_source`.

`usage_events`: `provider_generation_id`, `provider`, `provider_endpoint`, `cost_source`,
`usage_evidence` (jsonb).

`models`: `provider_model_id`, `author`, `provider` (default `'vercel_ai_gateway'`, NOT NULL),
`endpoint_status` (default `'unknown'`), `endpoint_synced_at`, `routing_plan` (jsonb).

New columns on existing tables are added with `IF NOT EXISTS`, which is what makes the migration
idempotent.

## Defaults chosen for safety

`models.provider` defaults to `'vercel_ai_gateway'`, so every pre-existing row is correctly attributed as
historical without a data migration. Only newly synced rows carry `'openrouter'`.

`endpoint_status` defaults to `'unknown'`, never `'discovered'`. Discovery cannot be inferred from a
default.

## Authoring rules that were learned here

- **Back-fill the snapshot, do not hand-edit generated SQL.** A missing-table error came from a snapshot
  gap; the fix is the snapshot, and `drizzle/meta/0004_snapshot.json` was written for this.
- **Emit is not idempotent.** Every statement is hand-guarded (`IF NOT EXISTS`, `DO $$` blocks for
  constraints).
- **Never split SQL on `;`** — the file contains `DO $$ … $$` blocks and dollar-quoted bodies that a naive
  split would destroy.

## Verified

Against real PostgreSQL (port 55440, disposable `orindle_qa`):

- `0000`–`0005` applied cleanly, in order, from an empty database.
- `0005` re-ran **three times** with exit 0 each time.
- `model_endpoints` confirmed to have row level security enabled.
- Foreign key and both unique/plain indexes present.

Not verified: application to the hosted database. That step needs owner authorisation and has not been
run; see `openrouter-operations.md`.
