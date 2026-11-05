import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { checkoutRequestSchema, createCheckout } from "@/lib/server/payments/checkout";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  await enforceRateLimit({ name: "checkout-create", identifier: requestIdentifier(request, identity.userId), limit: 5 });
  const input = await readJson(request, checkoutRequestSchema);
  const result = await createCheckout(identity.userId, input);
  return json(result, result.duplicate ? 200 : 201);
});
