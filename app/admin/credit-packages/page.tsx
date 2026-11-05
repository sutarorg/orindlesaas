import type { Metadata } from "next";
import { CreditPackagesWorkspace } from "@/components/admin/credit-packages-workspace";

export const metadata: Metadata = { title: "Credit Packages" };

export default function AdminCreditPackagesPage() {
  return <CreditPackagesWorkspace />;
}
