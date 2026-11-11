# Lessons: what silently broke, and why

Nine real defects were found during this migration. All nine passed code review and failed only when
executed. They are recorded because each one would have shipped looking correct, and because several
share a single root cause worth remembering.

## The pattern

**A Gateway-only prerequisite stayed in place after the provider changed.**

Each was a validation or join that was correct for Vercel AI Gateway and meaningless for OpenRouter. The
code was not wrong when written; it became wrong when the provider underneath it changed. None of them
threw an error that mentioned the migration — each looked like a genuine catalogue, pricing or
compatibility verdict.

This is why "the unit tests pass" was not evidence of a working migration: each test exercised a piece
in isolation, and the pieces were individually fine.

## The nine

| # | Symptom | Cause | Consequence if shipped |
|---|---|---|---|
| 1 | Quote bound too loose | raw `units` compared across decimal scales | an operator ceiling could *raise* the maximum spend |
| 2 | Sync "succeeded" with `invalid: 0` | `discovered.invalid` never accumulated | a partial sync reported success; nobody investigates success |
| 3 | Every model refused for chat | required `supported_specifications: ["v4"]`, which OpenRouter does not publish | the entire catalogue unusable, blamed on compatibility |
| 4 | Every image model unquotable | endpoint price required `prompt`; image endpoints have `output_image` | Image Studio had no models |
| 5 | Video models unconfigurable | contract accepted resolutions only as `WxH`; real labels are `720p`/`1080p` | no video model could ever be approved |
| 6 | Video enablement blocked | `resolutionPricing` Gateway SKU map was mandatory | same, one layer deeper |
| 7 | Video quote always failed | engine resolved the label through that map, absent on OpenRouter | video could not be quoted at all |
| 8 | Endpoint-priced models invisible | `innerJoin(modelPrices)` in two paths | a correctly priced model never resolved and never appeared in the selector |
| 9 | Enablement and policy edits refused | the enable gate and the policy mutation both demanded a `model_prices` row | an operator could not enable or re-configure an endpoint-priced model, so none could ever go live |

## Why seven of the nine survived a green unit suite

They were found in the final end-to-end run, in order, one after another: fix one and the next appeared
behind it. Findings 3–9 each lived on a *different* segment of one pipeline — compatibility →
enablement → price lookup → quote → selector — and every segment had its own tests and its own passing
assertions.

The lesson is not "write more unit tests". It is that **a path assembled from individually correct pieces
must be executed as a path**. The only reason all eight are fixed is that a realistic catalogue was
finally pushed through sync, approval, quote and selector against a real database.

## Rules that prevent recurrence

1. **When the provider changes, grep for the old provider's vocabulary.** `v4`, `supported_specifications`,
   `resolutionPricing`, `model_eligibility`, `varies_by_provider` were all Gateway concepts. Each one was a
   latent gate.
2. **Never inner-join a prerequisite that a new data shape may not populate.** A missing row should mean
   "not priced", not "invisible". Use a left join and refuse explicitly.
3. **Compare money through one exact path.** Raw `units` comparison was a money bug hiding as an
   optimisation. If two decimals are compared, their scales must be aligned first.
4. **A provider-aware check must name the provider it applies to.** `hasSdkSupport` and the video checks
   now branch on `openrouterId`, and historical Gateway rows keep the original rule so their behaviour
   cannot change retroactively.
5. **Distinguish "could not determine" from "zero".** A failed lookup holds the reservation rather than
   settling at no charge; a missing endpoint refuses rather than guessing.
6. **Run the whole path against a real database before declaring the migration done.**

## Traps specific to this stack

- **RLS needs two statements.** `.enableRLS()` in `schema.ts` **and** `ALTER TABLE … ENABLE ROW LEVEL
  SECURITY`, or the table is created unprotected. Silent.
- **The integration guard chain fails silently.** `QA_DATABASE_DISPOSABLE=1`, host
  `localhost|127.0.0.1|postgres`, database `orindle_qa`. A typo in the variable name skips the whole suite,
  which is indistinguishable from ten passes.
- **Drizzle emit is not idempotent.** Hand-guard every statement. Fix a missing-table error in the
  snapshot, never by editing generated SQL. Never split on `;` — `DO $$` blocks break.
- **`/tmp` is wiped between sessions**, so the PostgreSQL cluster is rebuilt each time.
- **Do not name a retry flag `retryable`.** A 500/502/524 can arrive after the provider billed, so any
  flag with that name will eventually be read from a paid path. `retryableReadOnly` states its own limit.
- **Fabricated image bytes are not images.** Magic-byte validation rejects `Buffer.from([1, 2, 3])`.
  Fix the fixture, never the check.
- **Do not use the SDK's `imageModel` or `videoModel`.** One drops `media_type` and `usage.cost`; the other
  blocks for up to ten minutes. HTTP is the correct level here.
