import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/server/db/client", () => ({ getDb: () => ({ transaction: mocks.transaction }) }));

import { fulfillDodoPayment } from "@/lib/server/payments/fulfillment";
import { payments, purchases, webhookEvents } from "@/lib/server/db/schema";
import { paymentWebhookSchema } from "@/lib/server/payments/payment-validation";

const purchase = {
  id: "00000000-0000-4000-8000-000000000201",
  userId: "00000000-0000-4000-8000-000000000202",
  packId: "creator" as const,
  credits: 1900,
  subtotalUsdCents: 1900,
  providerProductId: "pdt_creator_test",
  checkoutSessionId: "cks_expected",
  status: "pending",
};
let state: {
  purchaseStatus: string;
  paymentStatus: string;
  providerPaymentId: string | null;
  webhookError: string | null;
};

function nonSuccessEvent(type: "payment.failed" | "payment.cancelled" | "payment.processing" = "payment.failed") {
  return paymentWebhookSchema.parse({
    type,
    business_id: "business_test",
    timestamp: "2026-11-05T00:00:00Z",
    data: {
      payment_id: "pay_test",
      status: type.split(".")[1],
      currency: "USD",
      total_amount: 1900,
      tax: 0,
      checkout_session_id: "cks_expected",
      subscription_ids: [],
      metadata: { schema_version: "1", purchase_id: purchase.id, user_id: purchase.userId, pack_id: "creator" },
      product_cart: [{ product_id: "pdt_creator_test", quantity: 1 }],
    },
  });
}

const tx = {
  insert(table: unknown) {
    if (table !== webhookEvents) throw new Error("Unexpected insert");
    return { values: () => ({ onConflictDoNothing: () => ({ returning: async () => [{ id: "webhook-row" }] }) }) };
  },
  select() {
    return {
      from(table: unknown) {
        return { where: () => ({ for: () => ({ limit: async () => {
          if (table === purchases) return [purchase];
          if (table === payments) return [{ id: "payment-row", purchaseId: purchase.id, status: state.paymentStatus, providerPaymentId: state.providerPaymentId, fulfilledAt: null }];
          throw new Error("Unexpected select");
        } }) }) };
      },
    };
  },
  update(table: unknown) {
    return { set: (values: Record<string, unknown>) => ({ where: async () => {
      if (table === purchases) state.purchaseStatus = String(values.status);
      else if (table === payments) {
        state.paymentStatus = String(values.status);
        state.providerPaymentId = values.providerPaymentId === undefined ? state.providerPaymentId : String(values.providerPaymentId);
      } else if (table === webhookEvents) state.webhookError = values.processingError === undefined ? null : String(values.processingError);
      else throw new Error("Unexpected update");
      return [];
    } }) };
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  state = { purchaseStatus: "pending", paymentStatus: "pending", providerPaymentId: null, webhookError: null };
  purchase.status = "pending";
  mocks.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));
});

describe("verified non-success payment events", () => {
  it("does not mutate a purchase when owner metadata is mismatched", async () => {
    const event = nonSuccessEvent();
    event.data.metadata.user_id = "someone-else";
    const result = await fulfillDodoPayment({ event, eventId: "evt_mismatch", payloadSha256: "a".repeat(64), requestId: "request" });
    expect(result).toMatchObject({ status: "reconciliation_required", creditsGranted: 0 });
    expect(state.purchaseStatus).toBe("pending");
    expect(state.paymentStatus).toBe("pending");
    expect(state.providerPaymentId).toBeNull();
    expect(state.webhookError).toContain("owner_or_pack_mismatch");
  });

  it("records a fully matched failed payment without granting credits", async () => {
    const result = await fulfillDodoPayment({ event: nonSuccessEvent(), eventId: "evt_failed", payloadSha256: "b".repeat(64), requestId: "request" });
    expect(result).toMatchObject({ status: "failed", creditsGranted: 0 });
    expect(state.purchaseStatus).toBe("failed");
    expect(state.paymentStatus).toBe("failed");
    expect(state.providerPaymentId).toBe("pay_test");
  });
});
