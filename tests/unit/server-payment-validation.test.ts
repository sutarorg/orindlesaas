import { describe, expect, it } from "vitest";
import { paymentValidationIssues, paymentWebhookSchema, type PurchaseExpectation } from "@/lib/server/payments/payment-validation";

const purchase: PurchaseExpectation = {
  id: "4d2a6a2f-2f5c-4f0d-bf5f-2eeea7f81311",
  userId: "389185db-52f2-47f1-90a1-2f8cf7f496b1",
  packId: "creator",
  providerProductId: "pdt_creator_test",
  subtotalUsdCents: 1900,
  checkoutSessionId: "cks_expected",
};

function validEvent() {
  return paymentWebhookSchema.parse({
    type: "payment.succeeded",
    business_id: "business_test",
    timestamp: new Date().toISOString(),
    data: {
      payment_id: "pay_test",
      status: "succeeded",
      currency: "USD",
      total_amount: 2052,
      tax: 152,
      checkout_session_id: "cks_expected",
      subscription_ids: [],
      metadata: { schema_version: "1", purchase_id: purchase.id, user_id: purchase.userId, pack_id: "creator" },
      product_cart: [{ product_id: "pdt_creator_test", quantity: 1 }],
      billing: { ignored: "not-retained" },
    },
  });
}

describe("Dodo payment expectations", () => {
  it("accepts a tax-inclusive total with the exact pre-tax pack amount", () => {
    expect(paymentValidationIssues(validEvent(), purchase)).toEqual([]);
  });

  it.each([
    ["wrong product", (event: ReturnType<typeof validEvent>) => { event.data.product_cart = [{ product_id: "pdt_other", quantity: 1 }]; }, "product_cart_mismatch"],
    ["subscription", (event: ReturnType<typeof validEvent>) => { event.data.subscription_ids = ["sub_1"]; }, "subscription_not_allowed"],
    ["wrong owner", (event: ReturnType<typeof validEvent>) => { event.data.metadata.user_id = "someone-else"; }, "owner_or_pack_mismatch"],
    ["wrong session", (event: ReturnType<typeof validEvent>) => { event.data.checkout_session_id = "cks_other"; }, "checkout_session_mismatch"],
    ["wrong amount", (event: ReturnType<typeof validEvent>) => { event.data.total_amount = 1900; }, "pretax_amount_mismatch"],
  ])("rejects %s", (_name, mutate, issue) => {
    const event = validEvent();
    mutate(event);
    expect(paymentValidationIssues(event, purchase)).toContain(issue);
  });
});
