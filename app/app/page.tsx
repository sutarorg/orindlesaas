import type { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AppOverviewPage() {
  return <Overview data={await getRequestWorkspace()} />;
}
