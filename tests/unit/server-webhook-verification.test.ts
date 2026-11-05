import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ unwrap: vi.fn() }));
vi.mock("@/lib/server/payments/dodo-client", () => ({ createDodoClient: () => ({ webhooks: { unwrap: mocks.unwrap } }) }));

import { verifyDodoWebhook } from "@/lib/server/payments/webhook-verification";

const rawBody = JSON.stringify({ type: "payment.succeeded", business_id: "business", timestamp: "2026-11-05T00:00:00Z", data: { payment_id: "pay_123", status: "succeeded", currency: "USD", total_amount: 1900, tax: 0, checkout_session_id: "cs_123", subscription_ids: [], metadata: { schema_version: "1", purchase_id: "purchase", user_id: "user", pack_id: "creator" }, product_cart: [{ product_id: "product", quantity: 1 }] } });
function request(body = rawBody) {
  return new Request("https://orindle.example/api/webhooks/dodo", { method: "POST", body, headers: { "webhook-id": "evt_123", "webhook-signature": "v1,signature", "webhook-timestamp": "1762380000" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DODO_PAYMENTS_WEBHOOK_KEY", "whsec_test");
  mocks.unwrap.mockReturnValue(JSON.parse(rawBody));
});
afterEach(() => vi.unstubAllEnvs());

describe("Dodo raw-body webhook verification", () => {
  it("passes the exact bytes and verification headers to the SDK and retains only a payload hash", async () => {
    const verified = await verifyDodoWebhook(request());
    expect(mocks.unwrap).toHaveBeenCalledWith(rawBody, { headers: { "webhook-id": "evt_123", "webhook-signature": "v1,signature", "webhook-timestamp": "1762380000" }, key: "whsec_test" });
    expect(verified.eventId).toBe("evt_123");
    expect(verified.payloadSha256).toBe(createHash("sha256").update(rawBody).digest("hex"));
    expect(JSON.stringify(verified)).not.toContain("v1,signature");
  });

  it("maps signature failure to a safe 401 and never processes the payload", async () => {
    mocks.unwrap.mockImplementation(() => { throw new Error("bad signature"); });
    await expect(verifyDodoWebhook(request())).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });

  it("fails closed when verification is not configured", async () => {
    vi.stubEnv("DODO_PAYMENTS_WEBHOOK_KEY", "");
    await expect(verifyDodoWebhook(request())).rejects.toMatchObject({ status: 503, code: "integration_unavailable" });
    expect(mocks.unwrap).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before SDK verification", async () => {
    await expect(verifyDodoWebhook(request(`{"padding":"${"x".repeat(1024 * 1024)}"}`))).rejects.toMatchObject({ status: 413, code: "payload_too_large" });
    expect(mocks.unwrap).not.toHaveBeenCalled();
  });
});
