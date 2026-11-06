import { z } from "zod";

export const paymentWebhookSchema = z.object({
  type: z.enum(["payment.succeeded", "payment.failed", "payment.cancelled", "payment.processing"]),
  business_id: z.string().min(1),
  timestamp: z.string().min(1),
  data: z.object({
    payment_id: z.string().min(1),
    status: z.string().nullish(),
    currency: z.string(),
    total_amount: z.number().int().nonnegative(),
    tax: z.number().int().nonnegative().nullish(),
    checkout_session_id: z.string().nullish(),
    subscription_id: z.string().nullish(),
    subscription_ids: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.string()),
    product_cart: z.array(z.object({ product_id: z.string(), quantity: z.number().int().positive() })).nullish(),
  }).loose(),
}).loose();

export type VerifiedPaymentEvent = z.infer<typeof paymentWebhookSchema>;

export type PurchaseExpectation = {
  id: string;
  userId: string;
  packId: "creator" | "pro" | "studio";
  providerProductId: string;
  subtotalUsdCents: number;
  checkoutSessionId: string | null;
};

export function paymentIdentityIssues(event: VerifiedPaymentEvent, purchase: PurchaseExpectation) {
  const payment = event.data;
  const issues: string[] = [];
  if (payment.metadata.schema_version !== "1" || payment.metadata.purchase_id !== purchase.id) issues.push("purchase_metadata_mismatch");
  if (payment.metadata.user_id !== purchase.userId || payment.metadata.pack_id !== purchase.packId) issues.push("owner_or_pack_mismatch");
  if (payment.currency.toUpperCase() !== "USD") issues.push("currency_mismatch");
  if (payment.subscription_id || payment.subscription_ids.length > 0) issues.push("subscription_not_allowed");
  if (!purchase.checkoutSessionId || payment.checkout_session_id !== purchase.checkoutSessionId) issues.push("checkout_session_mismatch");
  if (
    payment.product_cart?.length !== 1 ||
    payment.product_cart[0]?.product_id !== purchase.providerProductId ||
    payment.product_cart[0].quantity !== 1
  ) {
    issues.push("product_cart_mismatch");
  }
  const tax = payment.tax ?? 0;
  if (payment.total_amount < tax || payment.total_amount - tax !== purchase.subtotalUsdCents) {
    issues.push("pretax_amount_mismatch");
  }
  return issues;
}

export function paymentEventStatusIssues(event: VerifiedPaymentEvent) {
  if (event.type === "payment.succeeded") return [];
  const expectedStatus = event.type.split(".", 2)[1];
  return event.data.status === expectedStatus ? [] : ["payment_status_mismatch"];
}

export function paymentValidationIssues(event: VerifiedPaymentEvent, purchase: PurchaseExpectation) {
  const issues: string[] = [];
  if (event.type !== "payment.succeeded" || event.data.status !== "succeeded") issues.push("payment_not_succeeded");
  return [...issues, ...paymentIdentityIssues(event, purchase)];
}
