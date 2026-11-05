# Payments and webhooks

Status: **researched integration contract; no live charge or production webhook has been performed**.

## Official sources reviewed

- Dodo Payments official `dodopayments/skills` repository at commit `8ed38e7594155575b9f98a867cf30b20589a54ea`, especially `dodo-best-practices`, `checkout-integration`, `webhook-integration`, `credit-based-billing`, `framework-adapters` and `testing-and-go-live`.
- Dodo Checkout Sessions, Payment Detail and Retrieve Line Items API references.
- Installed-target SDK declarations for `dodopayments` 2.61.1: `checkoutSessions.create`, `webhooks.unwrap(rawBody, { headers })`, Payment `metadata`, `product_cart`, `total_amount`, `currency`, `tax`, `checkout_session_id` and `subscription_ids`.

## Checkout

The browser sends only `creator|pro|studio` and a bounded client idempotency key. The server maps the slug to the exact pack and environment-specific Dodo product ID:

| Pack | USD cents | Credits |
|---|---:|---:|
| Creator | 1900 | 1900 |
| Pro | 4900 | 4900 |
| Studio | 9900 | 9900 |

The server calls `client.checkoutSessions.create({ product_cart: [{ product_id, quantity: 1 }], customer, billing_currency: "USD", metadata, return_url })`. Metadata contains the schema version, internal purchase UUID, verified user UUID and pack slug; it contains no browser price or credential. The SDK environment is explicit and defaults to `test_mode`; live mode requires exact configuration. Discounts and subscription data are not enabled. The returned checkout URL is validated as HTTPS on an expected Dodo checkout host before it is returned.

A repeated key for a still-pending purchase returns its existing checkout state; a changed pack or a terminal/non-pending purchase is a conflict. Checkout creation is not payment success and no route uses return query parameters to grant credits.

## Verification and raw body

The route reads `await request.text()` before any JSON parsing and calls the official SDK:

```ts
client.webhooks.unwrap(rawBody, {
  headers: {
    "webhook-id": requiredId,
    "webhook-signature": requiredSignature,
    "webhook-timestamp": requiredTimestamp,
  },
});
```

Missing headers, invalid signatures/timestamps and malformed verified payloads are rejected without business writes. `unsafeUnwrap()` is never used by an application route. The endpoint stores only provider/event ID, event type and SHA-256 body digest—not raw payloads, signatures, card details or customer billing address.

## Exactly-once fulfillment

Within one transaction:

1. Insert the verified `webhook-id`; an existing processed ID is a duplicate. A mismatched body hash for the same ID is a security conflict.
2. Lock the purchase by internal metadata purchase ID and/or verified checkout/payment reference.
3. Require `payment.succeeded`, status `succeeded`, no subscription association, matching checkout session where available, expected one-product cart and quantity 1, expected product ID, expected purchase/user metadata and expected currency.
4. Validate amount semantics explicitly. Dodo `total_amount` includes tax, so the implementation checks `total_amount - (tax ?? 0)` against pack USD cents and independently retains total/tax. If provider semantics cannot establish the pre-tax amount safely, fulfillment stops as `reconciliation_required`; it never guesses.
5. Lock or create the owner's wallet and append one purchase ledger entry using `purchase:<purchaseUuid>` as the stable idempotency key.
6. Mark payment fulfilled and webhook processed in the same commit, and insert the receipt email plus dispatch outbox in that commit. Actual Resend delivery occurs only after commit.

Unique provider payment ID, webhook ID and purchase ledger key provide independent duplicate barriers. Repeated delivery returns a safe duplicate acknowledgment after verification; it does not add credits.

## Refunds, failures and disputes

Failed/processing/cancelled events update only a matched purchase state and never grant credits. The current verified webhook schema does not accept refund/dispute event types and no automatic credit reversal or admin refund/dispute mutation is implemented. Adding them requires verified provider events, legal/support policy, append-only reconciliation and separate tests; historical purchase entries remain immutable.

## Credit system separation

Orindle does not also attach automatic Dodo credit entitlements/meters to these packs. The internal ledger is authoritative. This avoids granting once from Dodo and again from the webhook, or deducting both remotely and locally. Dodo's asynchronous meter balance is not used as a request lock.

## Testing and launch limits

Unit tests use official SDK-compatible payload shapes and signature-test fakes at the adapter boundary; current tests exercise raw-body preservation, verification headers/hash, missing configuration, invalid signatures, oversize bodies and payment-expectation mismatches. Real database replay, same-ID/different-body and concurrent exactly-once fulfillment tests remain required. Live/test-mode verification also needs Dodo credentials, three environment-specific one-time products and a registered webhook. No unsigned CLI event is accepted by the production route. Go-live additionally requires KYC/business approval, live product recreation, live key/webhook configuration, receipts/refund/dispute procedures and reconciliation evidence.
