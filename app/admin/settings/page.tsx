import type { Metadata } from "next";
import { SettingsWorkspace } from "@/components/admin/settings-workspace";

export const metadata: Metadata = { title: "Admin Settings" };

export default function AdminSettingsPage() {
  return <SettingsWorkspace />;
}
