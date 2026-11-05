import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { getConversationFixture } from "@/lib/dashboard/fixtures";

export const metadata: Metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const conversation = getConversationFixture(conversationId);
  if (!conversation) notFound();
  return <ChatWorkspace conversation={conversation} />;
}
