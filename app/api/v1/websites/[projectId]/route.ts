import { after } from "next/server";
import { z } from "zod";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getOwnedWebsite, renameWebsite, updateWebsiteSource } from "@/lib/server/websites/projects";
import { dispatchOutboxEvent } from "@/lib/server/jobs/outbox";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };
const updateSchema = z.union([
  z.object({ files: z.array(z.object({ path: z.enum(["index.html", "styles.css", "script.js"]), content: z.string().min(1).max(250_000) }).strict()).min(2).max(3) }).strict(),
  z.object({ name: z.string().trim().min(2).max(80) }).strict(),
]);

export async function GET(request: Request, context: Context) {
  const { projectId } = await context.params;
  return apiHandler(async () => {
    const identity = await requireUser();
    return json(await getOwnedWebsite(identity.userId, z.uuid().parse(projectId)));
  })(request);
}

export async function PATCH(request: Request, context: Context) {
  const { projectId } = await context.params;
  return apiHandler(async () => {
    assertSameOrigin(request);
    const identity = await requireUser();
    await enforceRateLimit({ name: "website-update", identifier: requestIdentifier(request, identity.userId), limit: 20 });
    const id = z.uuid().parse(projectId);
    const input = await readJson(request, updateSchema, 600_000);
    if ("name" in input) return json(await renameWebsite(identity.userId, id, input.name));
    const result = await updateWebsiteSource(identity.userId, id, input.files);
    after(() => dispatchOutboxEvent(`website-validation:${result.buildId}`, { inline: true }));
    return json(result, 202);
  })(request);
}
