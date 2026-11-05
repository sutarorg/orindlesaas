import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  return <RealAdminWorkspace section="overview" />;
}
