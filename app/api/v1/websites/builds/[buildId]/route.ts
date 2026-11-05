import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { apiHandler, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { websiteBuilds, websiteProjects } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";

export const runtime = "nodejs";
type Context = { params: Promise<{ buildId: string }> };

export async function GET(request: Request, context: Context) {
  const { buildId } = await context.params;
  return apiHandler(async () => {
    const identity = await requireUser();
    const [build] = await getDb().select({
      id: websiteBuilds.id,
      projectId: websiteBuilds.projectId,
      status: websiteBuilds.status,
      createdAt: websiteBuilds.createdAt,
      updatedAt: websiteBuilds.updatedAt,
    }).from(websiteBuilds).innerJoin(websiteProjects, eq(websiteBuilds.projectId, websiteProjects.id)).where(
      and(eq(websiteBuilds.id, z.uuid().parse(buildId)), eq(websiteProjects.userId, identity.userId)),
    ).limit(1);
    if (!build) throw new AppError("not_found", 404, "The website build was not found.");
    return json(build);
  })(request);
}
