import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return <RealAdminWorkspace section="payments" />;
}
