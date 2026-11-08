import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkspaceStartupError } from "@/components/dashboard/workspace-startup-error";
import { resolveWorkspaceAccess } from "@/lib/server/auth/guards";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";

export const metadata: Metadata = { title: "Workspace", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await resolveWorkspaceAccess();
  if ("denial" in access) {
    // A missing session belongs at the login page. An absent or inactive profile is a property of
    // the account, so telling the user to retry would loop them forever.
    if (access.denial === "unauthenticated") redirect("/login?next=%2Fapp");
    return <WorkspaceStartupError reason={access.denial === "inactive" ? "inactive" : "uninitialized"} />;
  }

  let snapshot: WorkspaceSnapshot;
  try {
    snapshot = await getRequestWorkspace();
  } catch (error) {
    // A failure in a layout escapes the segment's error.tsx and surfaces as Next's global error
    // page, which tells the user nothing. Handle it here instead, and always log the cause.
    console.error("[workspace] Could not build the workspace shell.", error);
    return <WorkspaceStartupError reason="unavailable" />;
  }

  return <DashboardShell profile={snapshot.profile} balance={snapshot.wallet.availableCredits}>{children}</DashboardShell>;
}
