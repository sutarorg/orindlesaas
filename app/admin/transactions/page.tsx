import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

export default function AdminTransactionsPage() {
  return <RealAdminWorkspace section="transactions" />;
}
