import { z } from "zod";
import { apiHandler, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getConversation } from "@/lib/server/chat/service";

export const runtime = "nodejs";
type Context = { params: Promise<{ conversationId: string }> };

export async function GET(request: Request, context: Context) {
  const { conversationId } = await context.params;
  return apiHandler(async () => {
    const identity = await requireUser();
    return json(await getConversation(identity.userId, z.uuid().parse(conversationId)));
  })(request);
}
