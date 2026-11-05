import type { Metadata } from "next";
import { ChatWorkspace, type ChatViewState } from "@/components/dashboard/chat-workspace";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ state?: string | string[] }> }) {
  const { state: value } = await searchParams;
  const state = Array.isArray(value) ? value[0] : value;
  const viewState: ChatViewState = state === "streaming" || state === "error" ? state : "default";
  return <ChatWorkspace initialState={viewState} />;
}
