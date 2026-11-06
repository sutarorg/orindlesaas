# AI catalogue synchronization

Status: **target state-machine design; current sync is a smaller language/image/video normalization transaction and has not been run against hosted infrastructure**.

## Inputs and trigger modes

- **Manual:** authenticated admin action with reason, idempotency, permission, and step-up; or the explicitly authorized existing `npm run catalog:sync` operator command.
- **Scheduled:** one new Inngest cron function registered in the existing `jobFunctions` list, calling the same service. No second scheduler.
- **Incremental:** a complete Gateway response with per-entry canonical hashes so only changed rows are written. There is no documented Gateway delta API and none will be fabricated.

Public discovery requires no key. Authenticated discovery is used when team private/virtual models or `include_availability` annotations are requested. Credentials stay server-side and responses are never cached publicly.

## Run lifecycle

1. Insert a `catalog_sync_runs` row with trigger, actor/request ID, lease, and `running` state; enforce one active writer with a database advisory lock and run lease.
2. Fetch with a bounded timeout, response-byte limit, content-type/status validation, and no automatic paid operation. Discovery reads may be retried only under a bounded read policy; ambiguous duplicate IDs or an invalid envelope abort.
3. Validate/normalize every entry outside the database transaction. Preserve unknown fields/categories, exact decimal strings, and raw safe metadata. Do not invent null-field meanings.
4. In one transaction, lock the sync scope, upsert providers/models without touching admin fields, append changed price observations, update active Gateway price versions where permitted, mark truly absent rows missing, write run results, and insert audit evidence.
5. Commit before returning counts. On failure, roll back all catalogue mutations and record a separate failed run status/safe error. A stale read-only run can be reclaimed after its lease; no generation is repeated by sync recovery.

## Partial and invalid entries

A malformed entry with a usable exact ID is reported and cannot overwrite a valid historical row. Unknown types are valid registry rows with no product route. Invalid pricing blocks only the affected quote-version update and produces a `partial` run with actionable safe reasons. Envelope failure, snapshot-hash conflict, or conflicting duplicate IDs fails the run.

Missing detection uses only well-formed IDs from the accepted snapshot. An invalid skipped entry is not treated as proof that its historical row disappeared. Existing missing rows that reappear become present without resetting their prior admin settings; brand-new rows are always disabled.

## Price concurrency

Sync locks each model before closing/appending a price interval. Existing single-open-price uniqueness and first-closure triggers remain. Concurrent admin price changes use expected current IDs and the same row lock. Active/future admin overrides are not closed by sync; fresh observed Gateway prices are appended to a read-only `catalog_price_observations` evidence table instead.

Observations are not quote versions and cannot route or charge. This preserves admin policy while retaining pricing history, without creating a competing pricing engine.

## Audit and metrics

A run records safe counts for returned, valid, inserted, changed, unchanged, missing, unsupported, skipped, observations, and quote versions, plus snapshot hash and timings. Provider/model changes use existing audit conventions without dumping raw metadata into logs. Run history is bounded in admin reads but retained according to the operations retention policy.

## Scheduling and deployment

The schedule is disabled until its Inngest function is registered/synced in the intended environment and database migrations have been applied. A missed schedule is recovered by a normal full read-only run, not by duplicating overlapping writers. Deployment order is migration → backend with new sync function → authorized manual validation sync → scheduled enablement → admin review/selective enablement.

## Recovery verification

Disposable PostgreSQL tests must cover two concurrent runs, sync versus admin enablement/price writes, crash before/after fetch, transaction rollback, stale lease recovery, malformed entries, unknown types, disappeared/reappeared models, unchanged/changed prices, and admin override preservation. No hosted schedule is considered verified from unit tests alone.
