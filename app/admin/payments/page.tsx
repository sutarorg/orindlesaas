import type { Metadata } from "next";
import { PaymentsWorkspace } from "@/components/admin/payments-workspace";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  return <PaymentsWorkspace initialQuery={typeof params.q === "string" ? params.q : ""} />;
}
