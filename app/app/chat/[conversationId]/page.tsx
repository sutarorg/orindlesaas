import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getConversation } from "@/lib/server/chat/service";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";
export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const identity = await requireUser();
  const { conversationId } = await params;
  if (!z.uuid().safeParse(conversationId).success) notFound();
  const [data, conversation] = await Promise.all([getWorkspaceSnapshot(identity.userId), getConversation(identity.userId, conversationId).catch(() => null)]);
  if (!conversation) notFound();
  return <ChatWorkspace data={data} initialConversation={conversation} />;
}
