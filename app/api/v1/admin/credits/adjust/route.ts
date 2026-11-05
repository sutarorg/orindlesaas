import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth/guards";
import { adminCreditAdjustmentSchema, applyAdminCreditAdjustment } from "@/lib/server/admin/credit-adjustments";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";

export const POST = apiHandler(async (request, { requestId }) => {
  assertSameOrigin(request);
  const admin = await requireAdmin("credits:adjust", { stepUp: true });
  await enforceRateLimit({ name: "admin-credit-adjust", identifier: requestIdentifier(request, admin.userId), limit: 10 });
  const input = await readJson(request, adminCreditAdjustmentSchema);
  const result = await applyAdminCreditAdjustment(admin, input, requestId);
  return json(result, result.duplicate ? 200 : 201);
});
