import type { Metadata } from "next";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";
export default async function ChatPage() { const data = await getRequestWorkspace(); return <ChatWorkspace data={data} />; }
