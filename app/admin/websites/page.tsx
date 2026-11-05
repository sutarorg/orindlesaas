import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Website Projects" };
export const dynamic = "force-dynamic";

export default function AdminWebsitesPage() {
  return <RealAdminWorkspace section="websites" />;
}
