import type { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AppOverviewPage() {
  const identity = await requireUser();
  return <Overview data={await getWorkspaceSnapshot(identity.userId)} />;
}
