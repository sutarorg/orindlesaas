import { z } from "zod";
import { requireUser } from "@/lib/server/auth/guards";
import { getOwnedWebsite, websitePreviewDocument } from "@/lib/server/websites/projects";
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
    return new Response(websitePreviewDocument(website.files), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'", "X-Request-Id": id } });
  } catch (error) { return errorResponse(error, id); }
}
