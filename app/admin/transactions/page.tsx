import type { Metadata } from "next";
import { TransactionsWorkspace } from "@/components/admin/payments-workspace";

export const metadata: Metadata = { title: "Transactions" };

export default function AdminTransactionsPage() {
  return <TransactionsWorkspace />;
}
