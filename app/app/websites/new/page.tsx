import type { Metadata } from "next";
import { NewWebsite } from "@/components/dashboard/new-website";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "New Website" };
export const dynamic = "force-dynamic";
export default async function NewWebsitePage() { const data = await getRequestWorkspace(); return <NewWebsite data={data} />; }
