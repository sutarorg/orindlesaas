import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiHandler, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { deployments, websiteProjects } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { pollDeployment } from "@/lib/server/websites/deployments";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";
type Context = { params: Promise<{ deploymentId: string }> };
export async function GET(request: Request, context: Context) {
  const { deploymentId } = await context.params;
  return apiHandler(async () => {
    const identity = await requireUser();
    await enforceRateLimit({ name: "deployment-status", identifier: requestIdentifier(request, identity.userId), limit: 60, window: "1 h" });
    const id = z.uuid().parse(deploymentId);
    const [owned] = await getDb().select({ id: deployments.id, providerDeploymentId: deployments.providerDeploymentId }).from(deployments).innerJoin(websiteProjects, eq(deployments.projectId, websiteProjects.id)).where(and(eq(deployments.id, id), eq(websiteProjects.userId, identity.userId))).limit(1);
    if (!owned) throw new AppError("not_found", 404, "The deployment was not found.");
    const result = owned.providerDeploymentId ? await pollDeployment(id) : { status: "queued" as const };
    return json({ deploymentId: id, ...result });
  })(request);
}
