import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "AI Models" };
export const dynamic = "force-dynamic";

export default function AdminModelsPage() {
  return <RealAdminWorkspace section="models" />;
}
