import { z } from "zod";
import { requireUser } from "@/lib/server/auth/guards";
import { getOwnedWebsite, websitePreviewShellDocument } from "@/lib/server/websites/projects";
import { websitePreviewShellCsp } from "@/lib/server/websites/source";
import { errorResponse } from "@/lib/server/errors";
import { requestId } from "@/lib/server/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const identity = await requireUser();
    const { projectId } = await context.params;
    const website = await getOwnedWebsite(identity.userId, z.uuid().parse(projectId));
    return new Response(websitePreviewShellDocument(website.files), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": websitePreviewShellCsp, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Request-Id": id } });
  } catch (error) { return errorResponse(error, id); }
}
