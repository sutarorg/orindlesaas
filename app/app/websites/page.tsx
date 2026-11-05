import type { Metadata } from "next";
import { WebsitesOverview } from "@/components/dashboard/websites-overview";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Websites" };
export const dynamic = "force-dynamic";
export default async function WebsitesPage() { const identity = await requireUser(); return <WebsitesOverview data={await getWorkspaceSnapshot(identity.userId)} />; }
