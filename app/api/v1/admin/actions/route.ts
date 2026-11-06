import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth/guards";
import { adminMutationPermission, adminMutationSchema, applyAdminMutation } from "@/lib/server/admin/mutations";
import { runAdminCatalogSync } from "@/lib/server/ai/catalog-sync";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";

export const POST = apiHandler(async (request, { requestId }) => {
  assertSameOrigin(request);
  const input = await readJson(request, adminMutationSchema, 16_000);
  const admin = await requireAdmin(adminMutationPermission(input.action), { stepUp: true });
  await enforceRateLimit({ name: "admin-actions", identifier: requestIdentifier(request, admin.userId), limit: 30, window: "1 h" });
  const result = input.action === "run_catalog_sync"
    ? await runAdminCatalogSync({ actorId: admin.userId, mode: input.mode, reason: input.reason, idempotencyKey: input.idempotencyKey, correlationId: requestId })
    : await applyAdminMutation(admin, input, requestId);
  return json(result, 200);
});
