import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Credit Packages" };
export const dynamic = "force-dynamic";

export default function AdminCreditPackagesPage() {
  return <RealAdminWorkspace section="packs" />;
}
