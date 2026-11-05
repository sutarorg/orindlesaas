# Credit economics

## Public unit and packs

100 credits represent $1 of customer-facing usage value. Packs are one-time purchases: Creator $19/1,900 credits, Pro $49/4,900 credits and Studio $99/9,900 credits. All four products draw from one wallet. Additional packs can be purchased as needed; there is no recurring subscription in this specification.

## Proposed server pricing rule

For an AI operation, proposed customer usage price = **2 × verified underlying metered AI cost**. Credits = customer usage price in USD ×100. Examples:

- $0.01 actual provider cost → $0.02 usage value → 2 credits.
- $1.00 actual provider cost → $2.00 usage value → 200 credits.

These are arithmetic examples, not claims about the price of any particular model operation. Text, image, video and website operations can consume credits differently. A fixed pack does not imply a fixed number of generations.

## Implementation boundary

Model prices, markup policy and credit packs must be configurable server-side. The browser may display server-issued estimates but cannot determine final cost or deduction. Final usage comes from verified provider metering; reconcile estimated reservation with actual deduction through a transactional ledger. Do not expose internal provider costs in customer responses or public copy.

## User-facing transparency

Before a future operation, show a clear credit estimate or price where feasible and current balance impact. Usage history should explain operation, credits and time. Public pricing copy must avoid “unlimited,” “all operations cost the same,” unsupported savings and margin claims.

## Policy and rights

Credit expiry, transferability, taxes, regional treatment and mixed-wallet consumption order require product/legal decisions before sale. The Credits Policy preserves applicable statutory consumer rights, payment dispute channels and legally required remedies. It must not state that no refund is ever possible. Payment chargebacks and ledger reversal handling need a later audited support process.
