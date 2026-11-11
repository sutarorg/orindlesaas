# Actual cost and reconciliation

Sources: `lib/server/ai/usage.ts`, `lib/server/generations/service.ts`,
`lib/server/credits/ledger.ts`.

## The distinction that drives everything

An **estimate** is what Orindle quotes before a request. An **actual** is what the provider charged
after it. They are stored in different columns, produced by different code paths, and never
interchanged.

`credits = ceil(actual_usd × 200)`. Only an actual can produce a charge. If the actual cannot be
established, the reservation stays held for reconciliation — an estimate is never promoted to a charge
because that would bill a guess.

## The generation ID trap

OpenRouter generation IDs use a **hyphen**: `gen-3bhGkxlo4XFrqiabUM7NDtwDzWwG`.
Vercel AI Gateway IDs used an **underscore**: `gen_…`.

Both are stored, in separate columns:

| Column | Meaning |
|---|---|
| `provider_generation_id` | OpenRouter ID (`gen-…`) |
| `gateway_generation_id` | historical Gateway ID (`gen_…`) |

A `gen_` ID is never reinterpreted as an OpenRouter ID. Legacy IDs still resolve, but are stamped
`provider: "vercel_ai_gateway"` and `costSource: "legacy_gateway_lookup"` so historical settlements
remain attributable and auditable. `classifyGenerationId` returns `openrouter`, `legacy_gateway` or
`null`, and the two patterns are mutually exclusive by construction.

For chat, the ID comes from `step.response.id` — not from a header or a generated value — so the ID that
is looked up is the ID the provider issued.

## Lookup

`GET /api/v1/generation` with `Authorization: Bearer`, returning `{ data: { … } }`. `total_cost` is the
authoritative actual cost. `lookupOpenRouterGenerationCost` classifies the ID first, then queries the
matching provider, and normalises the returned cost through the exact-decimal path:

- `0.0000123456789` is stored as `"0.00001235"`, truncated as text, never round-tripped through
  `Number`.
- Negative, missing or non-numeric costs are rejected rather than coerced.
- `usage`, `upstream_inference_cost`, `cache_discount`, `is_byok` and `provider_name` are retained as
  evidence.

`lookupCostWithGrace` retries the lookup within a grace window, because a generation can be briefly
unknown to the lookup endpoint immediately after completion.

## Evidence, not assumption

`evidenceFromProviderResponse` builds a `SettlementEvidence` record. When a cost has not been confirmed
by a lookup it returns `verified: false`, and the caller must not settle on it. This is the code-level
enforcement of the rule that an unverified figure is never recorded as an actual.

Image responses are a legitimate fallback source: `POST /api/v1/images` returns
`usage.{prompt_tokens, completion_tokens, total_tokens, cost}`, and that `cost` is a provider-reported
figure, not an Orindle estimate. It is tagged with its source so the two remain distinguishable.

## Settlement invariants

- No automatic retry of uncertain paid generations (`maxRetries: 0`, `streamRetries: 0`).
- Poll failure keeps `awaiting_provider`.
- Terminal non-success (failed, dead, cancelled, expired) settles at no charge.
- A failed lookup keeps the reservation held. Never zero-cost.
- Mid-stream error never settles, even with text received.
- `settleReservation` is idempotent per job: `recordUsageEvidence` rejects a conflicting generation ID
  rather than overwriting an existing settlement.

## Reconciliation

Rows with `reconciliation_status = required` appear in the admin usage section with the actual USD total
and are the operator's work queue. The description states explicitly that estimates are not treated as
actuals and that totals cover only the bounded rows shown, so nobody reads the number as a full account
of spend.

## Verified

- Generation-ID classification across OpenRouter, legacy Gateway and malformed inputs.
- Exact truncation of a long decimal cost with no float step.
- Rejection of negative, missing and `NaN` costs.
- No settlement on terminal failure, poll error or mid-stream error.
- Legacy Gateway rows keep their provider attribution.

## Related

- Error classification feeding this: `openrouter-errors.md`
- Schema and preserved history: `openrouter-database.md`
