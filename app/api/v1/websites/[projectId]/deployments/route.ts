import { after } from "next/server";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { deploymentRequestSchema, queueDeployment } from "@/lib/server/websites/deployments";
import { assertOutboxConfigured, dispatchOutboxEvent } from "@/lib/server/jobs/outbox";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };
export async function POST(request: Request, context: Context) {
  const { projectId } = await context.params;
  return apiHandler(async () => {
    assertSameOrigin(request);
    const identity = await requireUser();
    await enforceRateLimit({ name: "website-deployment", identifier: requestIdentifier(request, identity.userId), limit: 5, window: "1 h" });
    const input = await readJson(request, deploymentRequestSchema);
    assertOutboxConfigured();
    const result = await queueDeployment(identity.userId, z.uuid().parse(projectId), input);
    if (!result.duplicate) after(() => dispatchOutboxEvent(`deployment:${result.deploymentId}`));
    return json(result, result.duplicate ? 200 : 202);
  })(request);
}
