import { z } from "zod";
import { apiHandler, json } from "@/lib/server/http";
import { listEnabledCatalog } from "@/lib/server/ai/models";

export const runtime = "nodejs";

export const GET = apiHandler(async (request) => {
  const kind = z.enum(["chat", "image", "video", "website"]).optional().parse(new URL(request.url).searchParams.get("kind") ?? undefined);
  const models = await listEnabledCatalog(kind);
  return json({ models });
});
