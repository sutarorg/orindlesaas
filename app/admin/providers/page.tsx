import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Providers" };
export const dynamic = "force-dynamic";

export default function AdminProvidersPage() {
  return <RealAdminWorkspace section="providers" />;
}
