# Dodo checkout, webhook, and reconciliation test plan

Status: **pre-execution; no payment performed**. Dodo Payments remains the required provider. Automated payment tests use fakes or explicitly configured **test_mode** only. Live mode, real cards/customers, real money, refunds, and disputes are not authorized.

## Exact pack and environment matrix

| Pack | Pre-tax USD cents | Credits | Required provider configuration |
|---|---:|---:|---|
| Creator | 1900 | 1900 | One-time test product mapped only by server env |
| Pro | 4900 | 4900 | Separate one-time test product |
| Studio | 9900 | 9900 | Separate one-time test product |

Assert the same values in shared content, database constraints/seed, checkout purchase/payment expectations, provider cart, verified fulfillment, receipt, and customer/admin projections. No subscription, browser-supplied amount, credit entitlement double metering, or test/live product/key reuse.

Before any test-mode connection, validate API key and webhook secret mode, product IDs, exact checkout hosts, `DODO_PAYMENTS_ENVIRONMENT=test_mode`, and an explicit test-run cap. Configuration-shape checks print no secret values.

## Checkout scenarios

| ID | Action | Expected result |
|---|---|---|
| PAY-C01 | Create each pack checkout as a verified active user | One pending purchase/payment; exact server price/product/currency/customer metadata; validated HTTPS Dodo URL |
| PAY-C02 | Repeat identical key before/after session persistence | Recover the same pending checkout; no duplicate purchase/payment or credits |
| PAY-C03 | Reuse key for different pack/user/target state | Safe conflict; no new external call beyond the defined provider-idempotent recovery |
| PAY-C04 | Disabled pack or mismatched database/static pack | Conflict before provider checkout |
| PAY-C05 | Provider timeout/invalid response/invalid host | Safe failure; no credits; same-key recovery only; no fabricated checkout URL |
| PAY-C06 | Return from hosted checkout with success-shaped query | Display status only from server records; zero fulfillment from return parameters |
| PAY-C07 | Anonymous/suspended/cross-origin/rate-limited request | Denied before purchase/provider effect |

## Verified webhook schema and mismatch corpus

Start from a valid `payment.succeeded` event for each pack, then independently mutate:

- missing/invalid signature, webhook ID, timestamp, raw body formatting, and oversize body;
- wrong `type` or non-succeeded `data.status`;
- wrong/missing schema version, purchase ID, user ID, pack ID;
- wrong/missing checkout session;
- wrong product, additional products, quantity 0/2, missing cart;
- non-USD currency, subscription ID/list;
- total below tax, wrong pre-tax subtotal, missing/invalid tax or total semantics;
- fulfilled purchase with a different provider payment ID;
- non-success failed/cancelled/processing event with mismatched purchase/owner/session/product identity.

**Expected:** invalid signatures never reach business logic. A fully matched success is eligible for fulfillment; every mismatch grants zero credits and leaves explicit reconciliation or unchanged safe state. Non-success events must not corrupt an unrelated purchase merely because metadata names its ID.

## Exactly-once and race suite

Run against real disposable PostgreSQL, then repeat the provider-delivery subset in Dodo test mode when authorized:

1. **Same event replay:** same ID and exact bytes after success returns duplicate with zero additional credits/email/outbox effects.
2. **ID/body substitution:** same event ID with different bytes conflicts even if the payload is otherwise valid.
3. **Concurrent delivery:** many simultaneous identical verified requests produce one grant, one successful purchase/payment transition, one purchase ledger entry, one receipt, and one dispatch outbox.
4. **Different event/same payment:** cannot fulfill another purchase or bypass unique provider payment identity.
5. **Different event/same purchase:** cannot replace the fulfilled provider payment or grant again.
6. **Failure after claim:** database/provider/email-outbox failures roll back all local fulfillment effects or leave a recoverable verified event; never mark processed while hiding an incomplete grant.
7. **Reconciliation replay:** a mismatch does not become fulfilled without a reviewed valid recovery path. A processed mismatch is not silently relabelled a duplicate success.
8. **Crash boundaries:** test before grant, after grant before payment status, after status before outbox, and after commit; transaction evidence must be all-or-nothing locally.

## Post-commit assertions

For each trial, compare purchase, payment, wallet, ledger, webhook event, email outbox, and dispatch outbox by safe test IDs:

- pack/credits/subtotal/currency and provider product/session/payment identities;
- tax, total, and pre-tax arithmetic (`total - tax = exact pack cents`);
- status, fulfillment timestamp, reconciliation reason, and processed timestamp/error;
- available/lifetime counters and exactly one `purchase:<purchaseUuid>` ledger key;
- receipt template/recipient test address and stable `purchase-receipt:<purchaseUuid>` idempotency;
- no raw payload, signature, billing address, card/bank details, or secrets persisted/logged.

Queue acceptance is not inbox delivery. Receipt delivery has separate idempotency/failure evidence and cannot roll back a verified payment.

## Optional authorized Dodo test-mode smoke

Currently **Blocked** because no Dodo credentials/products are available. If separately approved:

1. Use a unique synthetic test customer and the existing three one-time test products; never create live products or charge real money.
2. Set an explicit maximum of one hosted Creator checkout attempt and the minimum provider-supplied test events needed to verify signature/replay/fulfillment. Do not store card details in scripts or reports.
3. Use the official current Dodo test workflow, not unsigned fabricated requests to the production route.
4. Assert zero credits before verified success, exactly 1,900 after one matched success, zero additional credit after replay, and one receipt queue record.
5. Reconcile and clean only test records/resources. Preserve safe event/payment/ledger IDs and redacted evidence.

## Launch gate

Real PostgreSQL replay/race tests and Dodo test-mode signature/fulfillment evidence are mandatory. Local SDK fakes are useful regression coverage but cannot establish real signature delivery, provider semantics, or payment readiness. Any duplicate/missing grant, mismatch corruption, test/live confusion, or untracked reconciliation is P0 and blocks launch.
