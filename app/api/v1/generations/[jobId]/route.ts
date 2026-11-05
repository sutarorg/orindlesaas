import { z } from "zod";
import { apiHandler, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getOwnedGeneration } from "@/lib/server/generations/service";

export const runtime = "nodejs";
type Context = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: Context) {
  const { jobId } = await context.params;
  return apiHandler(async () => {
    const identity = await requireUser();
    return json(await getOwnedGeneration(identity.userId, z.uuid().parse(jobId)));
  })(request);
}
