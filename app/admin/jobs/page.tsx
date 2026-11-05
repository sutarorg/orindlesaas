import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Generation Jobs" };
export const dynamic = "force-dynamic";

export default function AdminJobsPage() {
  return <RealAdminWorkspace section="jobs" />;
}
