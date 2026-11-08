import type { Metadata } from "next";
import { WebsitesOverview } from "@/components/dashboard/websites-overview";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Websites" };
export const dynamic = "force-dynamic";
export default async function WebsitesPage() { const data = await getRequestWorkspace(); return <WebsitesOverview data={data} />; }
