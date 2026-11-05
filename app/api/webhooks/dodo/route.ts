import { apiHandler, json } from "@/lib/server/http";
import { verifyDodoWebhook } from "@/lib/server/payments/webhook-verification";
import { fulfillDodoPayment } from "@/lib/server/payments/fulfillment";

export const runtime = "nodejs";

export const POST = apiHandler(async (request, { requestId }) => {
  const verified = await verifyDodoWebhook(request);
  const result = await fulfillDodoPayment({ ...verified, requestId });
  return json(result, result.status === "reconciliation_required" ? 202 : 200);
});
