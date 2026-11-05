import type { Metadata } from "next";
import { CreditHistory } from "@/components/dashboard/credit-history";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Transaction History" };
export const dynamic = "force-dynamic";
export default async function CreditHistoryPage() { const identity = await requireUser(); return <CreditHistory data={await getWorkspaceSnapshot(identity.userId)} />; }
