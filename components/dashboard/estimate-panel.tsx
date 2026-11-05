import { Coins, Info } from "lucide-react";
import type { CreditEstimate } from "@/lib/contracts/dashboard";
import { formatCredits } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

export function EstimatePanel({ estimate, balance, className }: { estimate: CreditEstimate; balance: number; className?: string }) {
  const insufficient = estimate.credits !== null && estimate.credits > balance;
  return (
    <div className={cn("rounded-2xl border border-line bg-soft p-4", className)} aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Illustrative estimate</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.035em] text-ink">
            {estimate.credits === null ? "—" : formatCredits(estimate.credits)} <span className="text-sm font-medium text-body">credits</span>
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint/60 text-teal-dark"><Coins className="size-4" aria-hidden="true" /></span>
      </div>
      <p className="mt-2 text-xs leading-5 text-body">{estimate.explanation}</p>
      <div className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-[11px] leading-5 text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>Not a server quote or final charge. Fixture balance: {formatCredits(balance)} credits. Generating changes nothing.</p>
      </div>
      {insufficient && <p className="mt-2 text-xs font-semibold text-error">This estimate exceeds the fixture balance. No purchase or deduction is available.</p>}
    </div>
  );
}
