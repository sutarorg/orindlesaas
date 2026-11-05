import type { Metadata } from "next";
import { AdjustmentsWorkspace } from "@/components/admin/adjustments-workspace";

export const metadata: Metadata = { title: "Adjustments & Disputes" };

export default function AdminAdjustmentsPage() {
  return <AdjustmentsWorkspace />;
}
