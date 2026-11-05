import type { Metadata } from "next";
import { SettingsWorkspace } from "@/components/dashboard/settings-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";
export default async function SettingsPage() { const identity = await requireUser(); return <SettingsWorkspace data={await getWorkspaceSnapshot(identity.userId)} />; }
