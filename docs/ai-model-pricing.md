# AI model pricing

Status: **pricing design; existing ledger arithmetic remains authoritative, dynamic heterogeneous quote support is not implemented yet**. No price in this document is a static Orindle offer.

## Separate kinds of money data

1. **Gateway catalogue observation:** raw decimal strings and pricing dimensions returned at discovery time.
2. **Estimate price version:** the immutable server data and supported formula used to reserve credits.
3. **Actual generation evidence:** authenticated Gateway generation lookup after execution.
4. **Customer ledger:** integer credits derived from actual cost under the existing rule.

These values must never be substituted for one another. Customers see estimates and final credits, not upstream cost.

## Exact representation

Catalogue prices remain decimal strings in validated JSONB, including unknown fields. Do not convert the whole pricing object to JavaScript `number`, fixed nanodollars, or a lowest-common-denominator per-operation field. A canonical JSON representation and SHA-256 hash detect changes without changing the original values.

Existing `input_nano_usd_per_token`, `output_nano_usd_per_token`, and `operation_nano_usd` columns remain for backward compatibility where conversion is exact. Planned additive `pricing_data`/`quote_rule` JSONB stores the full immutable version and formula. Unsupported precision remains preserved as a string but is not quotable until an exact arithmetic rule supports it.

All arithmetic uses validated decimal coefficients and `BigInt` numerator/scale calculations. Division rounds only at the documented final estimate/credit boundary, never by binary floating-point multiplication. Actual ledger cost remains non-negative `numeric(24,8)` with at most eight decimal places; excess-precision actuals enter reconciliation rather than silent rounding.

## Observed pricing shapes

| Shape | Example fields | Quote behavior |
|---|---|---|
| Base language tokens | `input`, `output` | Exact estimated input tokens × input rate + capped output tokens × output rate |
| Cached/token extras | `input_cache_read`, `input_cache_write`, `web_search` | Preserve; charge an estimate extra only when the operation actually uses and can bound that dimension |
| Tiered tokens | `input_tiers[]`, `output_tiers[]` with `min`, inclusive/`max`, exclusive/`cost` | Select only under a documented context-tier rule; ambiguous tier selection is unquotable |
| Service/region/provider variants | `service_tiers`, `regional`, `varies_by_provider` | Preserve all variants; default only to the exact variant the server will request |
| Per image | `image` | Requested image count × exact per-image rate |
| Video duration | `video_duration_pricing[]` with resolution/audio/`cost_per_second` | Exact duration × the rate matching reviewed resolution/audio mapping |
| Missing or token-priced media without an output-token bound | Partial `pricing` object | Preserve but reject estimate/enablement for that operation; never invent an operation price |

Observed Veo entries prove that rates vary by model, resolution, and audio. Observed image entries prove that `input`/`output` values do not necessarily provide a safe per-image reservation formula. Zero strings are data, not proof that the whole operation is free.

## Versioning and admin overrides

A changed observed price creates an immutable observation tied to the sync run. A changed active Gateway estimate price closes the current interval once and appends a new version under model-row locking and the single-open-price invariant. Unchanged hashes create no versions.

An active/future admin price is an explicit override. Sync must not close or replace it; it records fresh Gateway observations separately for review. Observations are evidence only and are never a second quote engine. Historical intervals, actual usage, and reservation estimates are not rewritten.

## Quote eligibility

A model/product is quotable only when the current version has a complete supported formula for every requested dimension. Otherwise return a safe pricing-unavailable conflict and block submission before job dispatch/provider contact. Quotes are informational and may change before submission; the server recomputes at job creation.

## Actual cost and credits

Final customer credits remain `ceil(actual_metered_ai_cost_usd × 200)`, equivalent to 2× actual AI cost at `1 credit = $0.01` customer usage value. This is a pricing rule, not a margin claim. The existing hold/settlement/reconciliation implementation remains the only ledger write path.
