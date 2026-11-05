import type { Metadata } from "next";
import { NewWebsite } from "@/components/dashboard/new-website";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "New Website" };
export const dynamic = "force-dynamic";
export default async function NewWebsitePage() { const identity = await requireUser(); return <NewWebsite data={await getWorkspaceSnapshot(identity.userId)} />; }
