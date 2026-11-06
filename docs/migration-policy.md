# Migration and database change policy

Status: **Prompt 5 initial policy**. No production migration has been run or authorized.

## Version control

1. Edit the Drizzle schema first and review types/constraints.
2. Generate with `drizzle-kit generate`; do not use `push` against shared or production data.
3. Review generated SQL and add explicit Supabase grants, RLS policies, auth trigger behavior and append-only protections where ORM declarations are insufficient.
4. Commit the SQL and Drizzle metadata together with a migration note covering purpose, lock risk, rollback/roll-forward and verification.
5. Apply with `drizzle-kit migrate` to local/disposable infrastructure, then staging after backup and approval. Production application requires separate owner authorization.

## Initial migration order

The initial schema creates identity/profile helpers, fixed packs/model registry, wallet/ledger, purchases/webhooks, pricing/generations/usage, projects/content/assets, website/outbox and admin/audit records. Constraints and indexes are created before policies. A second reviewed security migration enables RLS, revokes broad grants and adds only required owner policies. Keeping security SQL visible avoids accidentally treating generated table DDL as a complete authorization design.

## Destructive changes

Renames, type narrowing, drops, backfills and constraint changes require an expand/migrate/contract plan. Never rewrite historical ledger entries, usage costs, payment expectations or audit records to make a new code path convenient. Add compensating entries or new price/config versions instead.

## Seed data

Seeds are idempotent and environment-aware:

- Fixed pack slugs/credits/USD cents may be inserted or reconciled only to the exact approved values.
- Model IDs/capabilities come from the reviewed registry; pricing is synced from AI Gateway and versioned, not hardcoded from memory.
- Admin bootstrap requires an explicit existing user UUID and approved permission bundle. There is no public or default administrator.
- No script creates live Dodo products, performs checkout, calls a paid model, deploys a website or changes production without an explicit operator command and credentials.

## Verification

Each migration is checked for nonempty SQL, deterministic down/roll-forward notes, owner indexes, RLS on every exposed table and no broad `anon` grants. Integration tests create isolated schemas/databases and verify two users cannot read or mutate each other's rows. Financial tests run concurrent holds/settlements/adjustments and assert wallet counters equal ledger-derived balances with no negative values.

## Recovery

Before staging/production changes, capture a restorable backup and identify the application version compatible with the old and new schema. Roll back application code for additive failures. Use a new forward migration for committed schema changes; do not manually edit migration history. Credential rotation and provider webhook/product changes are operational changes, not database rollbacks.

## Dynamic AI registry migration gate

The planned registry expansion must be a new additive migration after `0002`, generated only after the documentation/Source A gate. It must not rewrite existing IDs, enabled settings, price intervals, usage, generations, or conversations. Any nullable legacy product-kind change needs an explicit enabled-route check and safe backfill; unknown Gateway categories must not be coerced into an existing product enum.

Review new JSONB size/shape handling, discovery/sync indexes, RLS and grants, no public access to sync runs/price observations, single-open-price behavior, and deletion/history protections. Test concurrent sync and admin writers on disposable PostgreSQL before staging. A schema check or generated SQL is not application evidence; record the actual applied target, result, and roll-forward procedure in the migration report.
