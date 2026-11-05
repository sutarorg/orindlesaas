# Credit economics

## Public unit and packs

100 credits represent $1 of customer-facing usage value. Packs are one-time purchases: Creator $19/1,900 credits, Pro $49/4,900 credits and Studio $99/9,900 credits. All four products draw from one wallet. Additional packs can be purchased as needed; there is no recurring subscription in this specification.

## Proposed server pricing rule

For an AI operation, proposed customer usage price = **2 × verified underlying metered AI cost**. Credits = customer usage price in USD ×100. Examples:

- $0.01 actual provider cost → $0.02 usage value → 2 credits.
- $1.00 actual provider cost → $2.00 usage value → 200 credits.

These are arithmetic examples, not claims about the price of any particular model operation. Text, image, video and website operations can consume credits differently. A fixed pack does not imply a fixed number of generations.

## Implementation boundary

Model prices, markup policy and credit packs must be configurable server-side within the fixed pack contract. The browser may display server-issued estimates but cannot determine final cost or deduction. Final usage comes from verified provider metering; reconcile estimated reservation with actual deduction through a transactional ledger. Do not expose internal provider costs in customer responses or public copy.

Prompt 5 stores actual AI cost as non-negative decimal nanodollars and computes the exact integer equivalent of `ceil(actual_metered_ai_cost_usd × 200)`. Estimated cost/credits and actual cost/credits are independent fields. A reservation is not a final deduction, and an actual value that cannot yet be reconciled is never replaced by an estimate labelled as actual. Purchased credits have no arbitrary application expiry. Overdrafts and silent undercharging are prohibited; an actual amount above available funds enters explicit reconciliation.

## User-facing transparency

Before a future operation, show a clear credit estimate or price where feasible and current balance impact. Usage history should explain operation, credits and time. Public pricing copy must avoid “unlimited,” “all operations cost the same,” unsupported savings and margin claims.

## Administration metric boundary (Prompt 4)

Admin fixtures use integer USD cents and integer credits. One credit corresponds to one cent of customer-facing usage value, but that value is not a cash receipt. Captured successful payments, customer usage value and provider cost are reported separately.

**Gross contribution = customer usage value − AI provider cost.** It excludes payment processing, infrastructure, support, taxes, refunds/chargebacks and other operating expenses. It is not net profit or a complete accounting gross-profit measure. Failed-generation cost includes only provider-cost records associated with failed outcomes; unreconciled usage is an explicit review state.

The required overview label “Total revenue” is always qualified as demo data. In production, finance must define whether the corresponding aggregate represents captured payments, recognized revenue or another measure. Prompt 4 never presents modeled revenue as actual received revenue.

## Policy and rights

Credit expiry, transferability, taxes, regional treatment and mixed-wallet consumption order require product/legal decisions before sale. The Credits Policy preserves applicable statutory consumer rights, payment dispute channels and legally required remedies. It must not state that no refund is ever possible. Payment chargebacks and ledger reversal handling need a later audited support process.
