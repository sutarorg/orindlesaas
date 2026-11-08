import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkspaceStartupError } from "@/components/dashboard/workspace-startup-error";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";

export const metadata: Metadata = { title: "Workspace", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let snapshot: WorkspaceSnapshot;
  try {
    snapshot = await getRequestWorkspace();
  } catch (error) {
    // A failure in a layout escapes the segment's error.tsx and surfaces as Next's global error
    // page, which tells the user nothing. Handle it here instead, and always log the cause so an
    // uninitialised workspace (missing profile/wallet) is diagnosable from server logs.
    console.error("[workspace] Could not build the workspace shell.", error);
    return <WorkspaceStartupError uninitialized={isUninitializedWorkspace(error)} />;
  }

  return <DashboardShell profile={snapshot.profile} balance={snapshot.wallet.availableCredits}>{children}</DashboardShell>;
}

function isUninitializedWorkspace(error: unknown) {
  return error instanceof Error && error.message === "The workspace has not been initialized.";
}
