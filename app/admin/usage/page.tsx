import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "AI Usage & Costs" };
export const dynamic = "force-dynamic";

export default function AdminUsagePage() {
  return <RealAdminWorkspace section="usage" />;
}
