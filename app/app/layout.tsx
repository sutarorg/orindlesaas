import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";

export const metadata: Metadata = { title: "Workspace", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const identity = await requireUser();
  const snapshot = await getWorkspaceSnapshot(identity.userId);
  return <DashboardShell profile={snapshot.profile} balance={snapshot.wallet.availableCredits}>{children}</DashboardShell>;
}
