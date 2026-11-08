import type { Metadata } from "next";
import { SettingsWorkspace } from "@/components/dashboard/settings-workspace";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";
export default async function SettingsPage() { const data = await getRequestWorkspace(); return <SettingsWorkspace data={data} />; }
