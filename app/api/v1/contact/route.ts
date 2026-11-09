import { after } from "next/server";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { contactRequestSchema, queueContactMessage } from "@/lib/server/email/service";
import { dispatchOutboxEvent } from "@/lib/server/jobs/outbox";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  assertSameOrigin(request);
  await enforceRateLimit({ name: "public-contact", identifier: requestIdentifier(request), limit: 5, window: "1 h" });
  const input = await readJson(request, contactRequestSchema, 16_000);
  const result = await queueContactMessage(input);
  if (!result.duplicate && result.contactId) after(() => dispatchOutboxEvent(`contact-email:${result.contactId}`, { inline: true }));
  return json({ contactId: result.contactId, status: result.status, duplicate: result.duplicate, message: "Your message was accepted for support delivery. Delivery status is tracked separately." }, result.duplicate ? 200 : 202);
});
