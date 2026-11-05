import type { Metadata } from "next";
import { CreditHistory } from "@/components/dashboard/credit-history";

export const metadata: Metadata = { title: "Transaction History" };

export default function CreditHistoryPage() {
  return <CreditHistory />;
}
