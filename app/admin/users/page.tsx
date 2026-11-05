import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return <RealAdminWorkspace section="users" />;
}
