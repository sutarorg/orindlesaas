import type { Metadata } from "next";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";
export default async function ChatPage() { const identity = await requireUser(); return <ChatWorkspace data={await getWorkspaceSnapshot(identity.userId)} />; }
