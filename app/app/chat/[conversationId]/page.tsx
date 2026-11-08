import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { getConversation } from "@/lib/server/chat/service";
import { getRequestUser, getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";
export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  if (!z.uuid().safeParse(conversationId).success) notFound();
  const identity = await getRequestUser();
  const [data, conversation] = await Promise.all([getRequestWorkspace(), getConversation(identity.userId, conversationId).catch(() => null)]);
  if (!conversation) notFound();
  return <ChatWorkspace data={data} initialConversation={conversation} />;
}
