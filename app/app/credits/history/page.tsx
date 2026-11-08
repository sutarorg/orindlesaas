import type { Metadata } from "next";
import { CreditHistory } from "@/components/dashboard/credit-history";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Transaction History" };
export const dynamic = "force-dynamic";
export default async function CreditHistoryPage() { const data = await getRequestWorkspace(); return <CreditHistory data={data} />; }
