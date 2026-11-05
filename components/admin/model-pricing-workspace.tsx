"use client";

import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { PricingConfigurationDialog } from "@/components/admin/pricing-configuration-dialog";
import { AdminBadge, AdminEmptyState, AdminNotice, AdminPageHeader, AdminPanel, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminModelPrices, getAdminModel } from "@/lib/admin/fixtures";
import { formatCredits, formatDate, formatLabel, formatMoney, matchesAdminQuery, paginate } from "@/lib/admin/format";
import type { AdminModelPrice, AdminPreviewResult } from "@/lib/contracts/admin";

export function ModelPricingWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState<AdminModelPrice | null>(null);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  const filtered = adminModelPrices.filter((price) => {
    const model = getAdminModel(price.modelId);
    return (status === "all" || price.status === status) && matchesAdminQuery(query, price.modelId, model?.displayName, model?.provider, price.version, price.unitLabel);
  });
  const pagination = paginate(filtered, page, 4);

  return (
    <>
      <AdminPageHeader eyebrow="Revenue operations" title="Model Pricing" description="Review illustrative provider-cost and customer-credit configuration by model-specific meter. No fixture price is a current provider quote or active Orindle charge." />
      <div className="mb-4 space-y-4"><AdminNotice title="Restricted cost presentation">Provider-cost fields belong only in this fictional admin view. Public/customer DTOs must never receive them. Real pricing requires immutable server versions and verified metering.</AdminNotice><AdminPreviewFeedback result={result} /></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_220px_auto] sm:items-end">
          <div><label htmlFor="pricing-search" className="mb-1.5 block text-xs font-semibold text-ink">Search pricing</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="pricing-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Model, provider, version or meter" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div>
          <div><label htmlFor="pricing-status" className="mb-1.5 block text-xs font-semibold text-ink">Version status</label><select id="pricing-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All statuses</option><option value="current-fixture">Current fixture</option><option value="scheduled-fixture">Scheduled fixture</option><option value="review-fixture">Review fixture</option></select></div>
          <Button type="button" variant="ghost" onClick={() => { setQuery(""); setStatus("all"); setPage(1); }} disabled={!query && status === "all"}><RotateCcw aria-hidden="true" />Reset</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminModelPrices.length} noun="price versions" /></div>
        {pagination.totalItems ? <>
          <AdminTable caption="Model pricing configuration" minWidth={1100}>
            <AdminTableHeader columns={[{ label: "Model" }, { label: "Meter" }, { label: "Provider cost · demo", align: "right" }, { label: "Customer credits", align: "right" }, { label: "Usage value", align: "right" }, { label: "Version / effective" }, { label: "Status" }, { label: "Action", align: "right" }]} />
            <tbody className="divide-y divide-line">{pagination.items.map((price) => { const model = getAdminModel(price.modelId); return <tr key={price.id}><td className="px-4 py-4"><p className="font-semibold text-ink">{model?.displayName ?? price.modelId}</p><p className="mt-0.5 break-words text-[11px] text-muted">{price.modelId} · {model?.provider}</p></td><td className="max-w-52 px-4 py-4 text-xs leading-5 text-body">{price.unitLabel}</td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatMoney(price.providerCostCentsPerUnit)}</td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatCredits(price.customerCreditsPerUnit)}</td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatMoney(price.customerCreditsPerUnit)}</td><td className="px-4 py-4 text-xs text-body"><p className="font-medium text-ink">{price.version}</p><p className="mt-1">{formatDate(price.effectiveAt)} UTC</p></td><td className="px-4 py-4"><AdminBadge label={formatLabel(price.status)} tone={getAdminStatusTone(price.status)} /></td><td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPrice(price)} aria-label={`Edit pricing for ${model?.displayName ?? price.modelId}`}>Edit pricing</Button></td></tr>; })}</tbody>
          </AdminTable>
          <AdminPagination {...pagination} itemLabel="price versions" onPageChange={setPage} />
        </> : <AdminEmptyState title="No price versions match" description="Try another model, meter, provider or version status." action={<Button type="button" variant="secondary" onClick={() => { setQuery(""); setStatus("all"); }}>Reset filters</Button>} />}
      </AdminPanel>
      {selectedPrice && <PricingConfigurationDialog key={selectedPrice.id} price={selectedPrice} onClose={() => setSelectedPrice(null)} onResult={setResult} />}
    </>
  );
}
