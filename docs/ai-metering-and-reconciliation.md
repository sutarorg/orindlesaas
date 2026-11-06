# AI metering and reconciliation

Status: **existing financial state machines are preserved; lossless Gateway lookup and stronger identity checks are planned, not yet implemented**. Live metering remains unverified.

## Existing rules that must not change

- `1 credit = $0.01` of customer usage value.
- Customer credits are `ceil(actual_metered_ai_cost_usd × 200)` using exact integer arithmetic.
- A hold `H` moves available `-H` and reserved `+H`.
- Settlement at actual credits `A` moves reserved `-H`, available `H-A`, and lifetime used `+A`.
- Available/reserved balances cannot become negative. Actual cost beyond available funds plus the hold enters `reconciliation_required`.
- Ledger and audit history are append-only. Duplicate settlement must match exact stored cost, not only the same rounded credit count.
- Estimates are not actuals, and internal upstream cost is not returned in customer DTOs.

## Lossless generation lookup

The AI SDK 4.0.136 `GatewayGenerationInfo.totalCost` is a JavaScript `number`; the existing `toFixed(8)` helper can introduce binary-float rounding and must not remain the authority for exact accounting. Official REST generation lookup returns `total_cost` as a JSON number. Extend `lib/server/ai/gateway.ts` to read that authenticated endpoint as text and parse it with a reviewed lossless JSON parser (npm candidate researched: `lossless-json` 4.3.3, MIT; not yet added or validated).

Validate the response envelope, generation ID, non-negative finite decimal cost, model identity, usage counters, and no more than eight fractional decimal places for the existing ledger. Convert the decimal lexeme directly to integer nanodollars. Reject exponent/overflow/excess precision into reconciliation unless a reviewed exact parser explicitly normalizes it without value loss. Never parse through `Number` first.

The provider metadata `gateway.cost` decimal string is useful corroboration but does not include every possible surcharge; it does not replace authenticated `total_cost` reconciliation.

## Evidence identity

Store the Gateway generation ID from provider metadata before settlement. Lookup must return the same ID. The returned model must match the stored exact Gateway model or a reviewed canonical mapping; an unexpected model requires review rather than charging against unrelated evidence. The provider host may differ from the model creator namespace, so `provider_name` alone is not a model identity check.

BYOK needs an explicit finance rule: official `total_cost` can be zero while `upstream_inference_cost` reflects market cost. Until Orindle configures and approves that mode, BYOK evidence cannot be treated as free usage; route it to reconciliation.

## Eventual consistency and recovery

Official documentation says usage ingestion is asynchronous and an immediate lookup can return “Usage event not found.” Treat that as **not yet**, keep the existing job/reservation state, and let bounded scheduled metering recovery retry the read-only lookup. It is not evidence of zero cost and not permission to repeat generation.

Automatic recovery is limited to jobs with a stored generation ID and complete postprocessing result evidence, as in the current implementation. Missing IDs, unknown submission, unexpected model/cost, unsafe precision, or incomplete assets remain manual reconciliation. Every recovery uses the original job/reservation IDs and exact evidence.

## Failed and empty outputs

A provider failure or empty media result can still incur cost. Store actual usage and settle the verified charge while keeping the generation outcome `failed`. An output with missing actual cost is neither free nor successfully billed. An actual charge above funds retains the hold and enters reconciliation; no silent undercharge or overdraft is allowed.

## Reporting

Admin usage reads may show actual USD, credits, source, model/job, and reconciliation state under existing permissions. Customer history shows estimated/final credits and safe status only. Gross contribution remains customer usage value minus actual AI cost, excluding payment processing, infrastructure, taxes, support, refunds, and other expenses; it is not net profit.
