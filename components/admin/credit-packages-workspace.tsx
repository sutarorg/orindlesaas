"use client";

import { Check, Package, Settings2 } from "lucide-react";
import { useState } from "react";
import { PackageConfigurationDialog } from "@/components/admin/package-configuration-dialog";
import { AdminBadge, AdminNotice, AdminPageHeader, AdminPreviewFeedback } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminCreditPackages } from "@/lib/admin/fixtures";
import { formatCredits, formatMoney } from "@/lib/admin/format";
import type { AdminCreditPackage, AdminPreviewResult } from "@/lib/contracts/admin";

export function CreditPackagesWorkspace() {
  const [selectedPackage, setSelectedPackage] = useState<AdminCreditPackage | null>(null);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  return (
    <>
      <AdminPageHeader eyebrow="Revenue operations" title="Credit Packages" description="Configure fictional versions of Orindle’s three one-time packs. Initial values match the public pricing contract; editing never saves or changes checkout." />
      <div className="mb-5 space-y-4"><AdminNotice title="Shared wallet and usage value">All four products use one wallet. 100 credits represent $1 of customer-facing usage value, not $1 of received revenue. Pack credits initially equal pack dollars ×100.</AdminNotice><AdminPreviewFeedback result={result} /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        {adminCreditPackages.map((creditPackage) => (
          <article key={creditPackage.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf8f2] text-teal"><Package className="size-5" aria-hidden="true" /></span><AdminBadge label={creditPackage.enabled ? "Enabled · demo" : "Disabled · demo"} tone={creditPackage.enabled ? "success" : "neutral"} /></div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-ink">{creditPackage.name}</h2>
            <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">{formatMoney(creditPackage.priceCents)}</p>
            <p className="mt-1 text-sm font-medium text-body">one-time payment · demo</p>
            <p className="mt-4 text-lg font-semibold tabular-nums text-ink">{formatCredits(creditPackage.credits)} <span className="text-sm font-medium text-body">credits</span></p>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-body"><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />Shared across all four products</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />{formatMoney(creditPackage.credits)} customer usage value</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />No recurring subscription</li></ul>
            <Button type="button" variant="secondary" className="mt-6 w-full" onClick={() => setSelectedPackage(creditPackage)}><Settings2 aria-hidden="true" />Configure {creditPackage.name}</Button>
          </article>
        ))}
      </div>
      {selectedPackage && <PackageConfigurationDialog key={selectedPackage.id} creditPackage={selectedPackage} onClose={() => setSelectedPackage(null)} onResult={setResult} />}
    </>
  );
}
