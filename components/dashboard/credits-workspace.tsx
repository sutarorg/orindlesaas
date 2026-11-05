"use client";

import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, Coins, Info, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionFeedback, DemoBadge, PageHeader, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult } from "@/lib/contracts/dashboard";
import { creditPacks, type CreditPack } from "@/lib/content/pricing";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { formatCredits, productLabels } from "@/lib/dashboard/format";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

export function CreditsWorkspace() {
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);

  async function purchase(pack: CreditPack) {
    const response = await previewDashboardService.purchaseCredits({ packId: pack.id });
    setResult({ ...response, status: "unavailable", message: `${pack.name} purchase intent only: $${pack.priceUsd} / ${formatCredits(pack.credits)} credits. No checkout opened, no payment was taken, no credits were added and no receipt was created.` });
  }

  return (
    <>
      <PageHeader eyebrow="Account · universal wallet" title="Credits & Wallet" description="One illustrative balance across Chat, Image Studio, Video Studio and Websites. All packs are one-time purchases in the planned product; checkout is not connected here." actions={<DemoBadge />} />
      <ActionFeedback result={result} />
      <section className="my-6 overflow-hidden rounded-[28px] bg-[#173b32] text-white">
        <div className="relative grid gap-8 px-6 py-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div className="pointer-events-none absolute -right-16 -top-28 size-72 rounded-full border border-white/10" aria-hidden="true" /><div className="pointer-events-none absolute -right-4 -top-12 size-44 rounded-full border border-white/10" aria-hidden="true" />
          <div className="relative"><DemoBadge label="Fixture balance · not cash" className="border-white/15 bg-white/10 text-mint" /><p className="mt-5 text-sm font-medium text-white/70">Universal demo balance</p><p className="mt-1 font-display text-[clamp(2.8rem,7vw,4.5rem)] font-semibold leading-none tracking-[-0.06em] text-white">{formatCredits(workspaceFixture.wallet.balance)} <span className="text-xl font-medium tracking-[-0.02em] text-white/65">credits</span></p><p className="mt-4 max-w-lg text-sm leading-6 text-white/65">Use the same planned wallet across all four products. This number is a local fixture and cannot be spent, topped up or withdrawn.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild variant="mint" size="lg"><Link href="#packs">View one-time packs<ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="secondary" size="lg" className="border-white/15 bg-white/10 text-white hover:bg-white/15"><Link href="/app/credits/history"><ReceiptText aria-hidden="true" />Transaction fixtures</Link></Button></div></div>
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-mint">Illustrative usage this month</p><p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-white">{formatCredits(workspaceFixture.wallet.usedThisMonth)} <span className="text-sm font-medium text-white/60">credits</span></p><ul className="mt-5 space-y-3">{(Object.keys(productLabels) as (keyof typeof productLabels)[]).map((product) => <li key={product} className="flex items-center justify-between gap-4 text-sm"><span className="text-white/65">{productLabels[product]}</span><span className="font-semibold text-white">{formatCredits(workspaceFixture.wallet.byProduct[product])}</span></li>)}</ul></div>
        </div>
      </section>

      <section id="packs" aria-labelledby="packs-heading" className="scroll-mt-36">
        <div className="mb-5 text-center"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal">One-time credit packs</p><h2 id="packs-heading" className="text-2xl font-semibold tracking-[-0.035em]">Choose room for what’s next</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">No subscription or recurring charge. Buttons below validate purchase intent only and never open checkout.</p></div>
        <div className="grid gap-5 lg:grid-cols-3">
          {creditPacks.map((pack) => <article key={pack.id} className={cn("relative flex flex-col rounded-3xl border bg-white p-6", pack.featured ? "border-teal/35 shadow-[0_16px_45px_rgba(6,122,103,0.09)]" : "border-line")}>{pack.featured && <span className="absolute right-5 top-5 rounded-full bg-mint px-2.5 py-1 text-[10px] font-semibold text-teal-dark">Most flexible</span>}<p className="text-sm font-semibold text-teal">{pack.name}</p><p className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-ink">${pack.priceUsd}{" "}<span className="ml-2 text-sm font-medium tracking-normal text-muted">one time</span></p><p className="mt-2 text-sm font-semibold text-ink">{formatCredits(pack.credits)} credits</p><p className="mt-4 text-sm leading-6 text-body">{pack.description}</p><p className="mt-2 text-xs font-medium text-muted">{pack.fit}</p><ul className="my-6 space-y-2.5 border-t border-line pt-5">{["Shared across all four products", "One-time pack, not a subscription", "Server-priced usage in the future"].map((feature) => <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-body"><Check className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />{feature}</li>)}</ul><Button type="button" variant={pack.featured ? "primary" : "secondary"} className="mt-auto w-full" onClick={() => void purchase(pack)}>Preview {pack.name} purchase</Button></article>)}
        </div>
        <p className="mt-4 text-center text-[11px] leading-5 text-muted">Purchase intent only · no payment method requested · no real transaction or credit addition</p>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <Panel>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-[-0.025em]">Recent wallet activity</h2><Link href="/app/credits/history" className="flex min-h-9 items-center gap-1 text-xs font-semibold text-teal-dark hover:underline">View all<ArrowRight className="size-3.5" aria-hidden="true" /></Link></div>
          <ul className="divide-y divide-line">{workspaceFixture.wallet.ledger.slice(0, 4).map((entry) => <li key={entry.id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-0"><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", entry.kind === "purchase" ? "bg-[#eaf6f0] text-teal" : "bg-subtle text-body")}>{entry.kind === "purchase" ? <ArrowDownLeft className="size-4" aria-hidden="true" /> : <ArrowUpRight className="size-4" aria-hidden="true" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{entry.title}</p><p className="mt-1 truncate text-[11px] text-muted">{entry.detail} · {entry.createdLabel}</p></div><div className="text-right"><p className={cn("text-sm font-semibold", entry.credits > 0 ? "text-teal-dark" : "text-ink")}>{entry.credits > 0 ? "+" : ""}{formatCredits(entry.credits)}</p><p className="text-[10px] text-muted">fixture credits</p></div></li>)}</ul>
        </Panel>
        <Panel className="bg-[#f2f7f4]">
          <Coins className="mb-4 size-6 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">How credits work</h2><p className="mt-3 text-sm leading-6 text-body">In the planned product, 100 credits represent $1 of customer-facing usage value. Credits are usage units, not cash or a withdrawable balance.</p><ul className="mt-5 space-y-3 text-xs leading-5 text-body"><li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />Final usage and estimates must come from a trusted backend.</li><li className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />Model, output and operation can change credit usage.</li></ul><Button asChild variant="ghost" size="sm" className="mt-4 px-0"><Link href="/credits-policy">Read public credits policy<ArrowRight aria-hidden="true" /></Link></Button>
        </Panel>
      </div>
    </>
  );
}
