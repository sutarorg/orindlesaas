import { createHash } from "node:crypto";
import { AppError } from "@/lib/server/errors";
import { readServerEnvironment } from "@/lib/server/env";
import { integrationUnavailable } from "@/lib/server/errors";
import { createDodoClient } from "@/lib/server/payments/dodo-client";
import { paymentWebhookSchema, type VerifiedPaymentEvent } from "@/lib/server/payments/payment-validation";

export async function verifyDodoWebhook(request: Request): Promise<{ event: VerifiedPaymentEvent; eventId: string; payloadSha256: string }> {
  const env = readServerEnvironment();
  if (!env.DODO_PAYMENTS_WEBHOOK_KEY) throw integrationUnavailable("Dodo webhook verification");
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 1024 * 1024) {
    throw new AppError("payload_too_large", 413, "The webhook body is too large.");
  }
  const names = ["webhook-id", "webhook-signature", "webhook-timestamp"] as const;
  const headers: Record<string, string> = {};
  for (const name of names) {
    const value = request.headers.get(name);
    if (!value) throw new AppError("unauthorized", 401, "Webhook verification headers are required.");
    headers[name] = value;
  }
  let payload: unknown;
  try {
    payload = createDodoClient(false).webhooks.unwrap(rawBody, {
      headers,
      key: env.DODO_PAYMENTS_WEBHOOK_KEY,
    });
  } catch (error) {
    throw new AppError("unauthorized", 401, "Webhook signature verification failed.", { cause: error });
  }
  const eventId = headers["webhook-id"];
  if (!eventId) throw new AppError("unauthorized", 401, "Webhook verification headers are required.");
  return {
    event: paymentWebhookSchema.parse(payload),
    eventId,
    payloadSha256: createHash("sha256").update(rawBody).digest("hex"),
  };
}
