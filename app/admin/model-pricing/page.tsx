import type { Metadata } from "next";
import { ModelPricingWorkspace } from "@/components/admin/model-pricing-workspace";

export const metadata: Metadata = { title: "Model Pricing" };

export default function AdminModelPricingPage() {
  return <ModelPricingWorkspace />;
}
