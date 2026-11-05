import type { Metadata } from "next";
import { UsageWorkspace } from "@/components/admin/usage-workspace";

export const metadata: Metadata = { title: "AI Usage & Costs" };

export default function AdminUsagePage() {
  return <UsageWorkspace />;
}
