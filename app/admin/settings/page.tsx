import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Admin Settings" };
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return <RealAdminWorkspace section="settings" />;
}
