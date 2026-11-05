import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { chatRequestSchema, createChatStream, listConversations } from "@/lib/server/chat/service";
import { enforceRateLimit, requestIdentifier } from "@/lib/server/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = apiHandler(async (request, { requestId }) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  await enforceRateLimit({ name: "chat-create", identifier: requestIdentifier(request, identity.userId), limit: 10 });
  return createChatStream(identity.userId, await readJson(request, chatRequestSchema), requestId);
});

export const GET = apiHandler(async () => {
  const identity = await requireUser();
  return json({ conversations: await listConversations(identity.userId) });
});
