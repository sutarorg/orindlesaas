import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Adjustments & Disputes" };
export const dynamic = "force-dynamic";

export default function AdminAdjustmentsPage() {
  return <RealAdminWorkspace section="adjustments" />;
}
