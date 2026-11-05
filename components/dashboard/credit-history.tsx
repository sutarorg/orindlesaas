import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";
import { formatCredits } from "@/lib/dashboard/format";

export function CreditHistory({ data }: { data: WorkspaceSnapshot }) {
  return <><PageHeader eyebrow="Account · Wallet" title="Transaction history" description="Append-only available-balance movements. Reservation entries also change the reserved balance shown in your wallet." actions={<Button asChild variant="secondary"><Link href="/app/credits">Back to wallet</Link></Button>} /><Panel>{data.ledger.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><caption className="sr-only">Wallet ledger</caption><thead><tr className="border-b border-line text-xs text-muted"><th className="px-3 py-3 font-medium">Description</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium">Available delta</th><th className="px-3 py-3 font-medium">Balance after</th><th className="px-3 py-3 font-medium">Recorded</th></tr></thead><tbody className="divide-y divide-line">{data.ledger.map((entry) => <tr key={entry.id}><td className="px-3 py-4 font-medium">{entry.description}</td><td className="px-3 py-4 text-xs capitalize">{entry.entryType.replaceAll("_", " ")}</td><td className="px-3 py-4 font-semibold tabular-nums">{entry.amountCredits > 0 ? "+" : ""}{formatCredits(entry.amountCredits)}</td><td className="px-3 py-4 tabular-nums">{formatCredits(entry.balanceAfterCredits)}</td><td className="px-3 py-4 text-xs text-muted">{new Date(entry.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <EmptyState title="No wallet transactions" description="Purchases, generation holds, releases and actual usage settlements will appear here." icon={<ReceiptText />} />}</Panel></>;
}
