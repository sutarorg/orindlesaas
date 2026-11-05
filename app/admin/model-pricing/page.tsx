import type { Metadata } from "next";
import { RealAdminWorkspace } from "@/components/admin/real-admin-workspace";

export const metadata: Metadata = { title: "Model Pricing" };
export const dynamic = "force-dynamic";

export default function AdminModelPricingPage() {
  return <RealAdminWorkspace section="pricing" />;
}
