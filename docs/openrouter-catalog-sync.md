# Catalogue sync and the endpoint registry

Sources: `lib/server/ai/catalog-sync.ts`, `scripts/catalog-sync.mts`, `lib/server/ai/contracts.ts`.
Table: `model_endpoints`.

## Two layers of truth

Orindle stores the catalogue in two layers, because they answer different questions:

| Layer | Table | Answers |
|---|---|---|
| Model | `models` | Does this model exist, what does it do, is Orindle allowed to sell it? |
| Endpoint | `model_endpoints` | Who actually serves it, and at what exact rate? |

A model is one product. An endpoint is one provider's offer to serve it. The same model is frequently
served by several providers at different prices, and **the price that matters is the endpoint's**, not
the model's headline price. Gateway-era code assumed one price per model; that assumption is the
reason endpoint pricing exists in this migration.

## Discovery

`GET /api/v1/models` is paginated (`offset`, `limit`; default 500, maximum 1000) and filtered by
`output_modalities`, which defaults to `text` on the provider side. Discovery therefore requests each
modality explicitly rather than relying on the default, or it would silently discover only text models.

`endpointRates` normalises each endpoint's `pricing` object into decimal strings. Rates stay strings
end to end: no float ever touches a price.

Endpoint discovery is capped at `MAX_ENDPOINT_LOOKUPS = 60` per sync, applied to sellable rows
(`kind !== null`) only. The cap keeps one sync bounded when the catalogue is large; models beyond the
cap keep `endpoint_status = unknown` and are enriched on a later run.

Endpoint discovery is credential-gated. Without `OPENROUTER_API_KEY` the sync still records models but
skips endpoint enrichment, leaving `endpoint_status = unknown`. It does **not** fail the run. This is
deliberate: an unauthenticated environment should produce a complete-but-unpriced catalogue, not a
failed job that hides the catalogue entirely.

## Failure accounting

`normalizeOpenRouterCatalog` returns `{ rows, invalid }`. Entries rejected by the wire schema are
counted, and `syncOpenRouterCatalog` adds that count into the run's `invalid` total.

This was a real bug found by testing, not by reading the code. The sync previously dropped
`discovered.invalid`, so a run that discarded half the catalogue still logged `invalid: 0` and
`succeeded`. A partial sync that reports success is worse than one that fails, because nobody looks.

## Concurrency

`syncOpenRouterCatalog` takes a `pg_advisory_xact_lock`, then refuses to start if another run holds an
unexpired lease, returning `AppError conflict 409`. A repeated `requestId` returns the existing run's
summary instead of starting a second one, so a retried HTTP call is idempotent. `markExpiredSyncRuns`
reclaims leases abandoned by a crashed process.

## Enablement is never automatic

Sync creates newly discovered models with `enabled = false` and endpoints with `approved = false`.
Neither the scheduler nor the sync can enable anything. An operator must approve endpoints and then
enable the model; see `openrouter-admin.md`.

`endpoint_status` reports what discovery achieved — `discovered`, `empty`, `failed` or `unknown` — and
is never treated as approval.

## Entry points

```ts
fetchOpenRouterCatalog(options): Promise<…>
normalizeOpenRouterCatalog(entries): { rows, invalid }
syncOpenRouterCatalog(options): Promise<CatalogSyncSummary>
runAdminCatalogSync(input): Promise<CatalogSyncSummary>   // audited admin path
listCatalogSyncRuns(limit = 20)
markExpiredSyncRuns()
```

`syncOpenRouterCatalog` accepts `trigger`, `mode`, `actorId`, `requestId`, `fetchImpl`, `modalities`
and `now`. `fetchImpl` is what makes the whole path testable without network access.

## Verified

Against real PostgreSQL, a four-model catalogue (chat with two differently-priced endpoints, image,
video, and an embeddings model Orindle does not sell) produced:

- four model rows, the embeddings row with `kind = null`;
- four endpoint rows with string rates preserved exactly;
- `missing: 1` for the row absent from a previous run;
- every model and endpoint created unapproved and disabled;
- `invalid: 0` on a clean catalogue, and a non-zero count when an entry fails the wire schema.

## Related

- Per-product pricing from these rates: `openrouter-pricing.md`
- Admin approval workflow: `openrouter-admin.md`
- Operations cadence: `openrouter-operations.md`
