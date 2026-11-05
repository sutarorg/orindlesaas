"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminTrendChart } from "@/components/admin/trend-chart";
import { AdminBadge, AdminEmptyState, AdminMetricCard, AdminNotice, AdminPageHeader, AdminPanel, AdminPanelHeader, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getAdminModel, getAdminUser } from "@/lib/admin/fixtures";
import { formatCredits, formatDateTime, formatLabel, formatMoney, formatNumber, paginate } from "@/lib/admin/format";
import { adminRangeLabels, filterUsageEvents, getDailyUsage, getUsageBreakdown, getUsageMetrics } from "@/lib/admin/metrics";
import type { AdminRange } from "@/lib/contracts/admin";
import type { DashboardProduct } from "@/lib/contracts/dashboard";

export function UsageWorkspace() {
  const [range, setRange] = useState<AdminRange>("30d");
  const [product, setProduct] = useState<DashboardProduct | "all">("all");
  const [modelId, setModelId] = useState("all");
  const [page, setPage] = useState(1);
  const events = filterUsageEvents(range, { product, modelId });
  const metrics = getUsageMetrics(events);
  const daily = getDailyUsage(range, events);
  const productCosts = getUsageBreakdown(events, "product");
  const modelCosts = getUsageBreakdown(events, "modelId");
  const pagination = paginate(events, page, 6);

  function resetFilters() { setProduct("all"); setModelId("all"); setPage(1); }

  return (
    <>
      <AdminPageHeader
        eyebrow="AI operations"
        title="AI Usage & Costs"
        description="Compare fictional provider costs, customer credit deductions and gross contribution. Production actual costs require verified provider metering and invoice reconciliation."
        actions={<div><label htmlFor="usage-range" className="mb-1.5 block text-xs font-semibold text-ink">Fixture range</label><select id="usage-range" value={range} onChange={(event) => { setRange(event.target.value as AdminRange); setPage(1); }} className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15">{Object.entries(adminRangeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
      />
      <div className="mb-5"><AdminNotice title="Financial measures are not interchangeable">Customer usage value is credits deducted ÷100. Gross contribution is usage value minus provider cost, before payment fees, infrastructure, support, tax, refunds and every other operating expense. It is not actual received revenue, net profit or a complete accounting gross-profit measure.</AdminNotice></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="AI provider cost · demo" value={formatMoney(metrics.providerCostCents)} detail={`${formatNumber(metrics.eventCount)} filtered usage fixtures`} definition="Illustrative cost fields, not actual incurred Orindle provider expense." />
        <AdminMetricCard label="Customer usage value · demo" value={formatMoney(metrics.customerUsageValueCents)} detail={`${formatCredits(metrics.creditsDeducted)} credits deducted`} definition="Modeled usage value, not a cash receipt or received revenue." />
        <AdminMetricCard label="Gross contribution · demo" value={formatMoney(metrics.grossContributionCents)} detail="Usage value minus provider cost" definition="Excludes all other operating expenses." />
        <AdminMetricCard label="Cost per active user · demo" value={formatMoney(metrics.costPerActiveUserCents)} detail={`Provider cost ÷ ${metrics.activeUsers} active fixture users`} definition="A simple operational ratio, not customer lifetime economics." />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><AdminMetricCard compact label="Credits deducted" value={formatCredits(metrics.creditsDeducted)} detail="Filtered customer usage fixtures" /><AdminMetricCard compact label="Failed generation cost · demo" value={formatMoney(metrics.failedGenerationCostCents)} detail="Includes zero-cost failures where applicable" /><AdminMetricCard compact label="Unreconciled usage" value={formatNumber(metrics.unreconciledUsage)} detail="Explicit fixture review state" /></div>

      <div className="mt-5"><AdminPanel><AdminTrendChart title="Usage value and provider cost by day" description={`USD per UTC day · ${adminRangeLabels[range]} · filtered demo events`} summary={`${formatMoney(metrics.customerUsageValueCents)} of demo usage value and ${formatMoney(metrics.providerCostCents)} of demo provider cost are represented.`} points={daily.map((point) => ({ label: point.date, values: [point.creditsDeducted, point.providerCostCents] }))} series={[{ label: "Customer usage value", color: "#067a67" }, { label: "Provider cost", color: "#b42318" }]} formatValue={formatMoney} /></AdminPanel></div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <AdminPanel><AdminPanelHeader title="Product-level costs" description="Filtered demo usage grouped by product." />{productCosts.length ? <AdminTable caption="Product-level AI costs" minWidth={520}><AdminTableHeader columns={[{ label: "Product" }, { label: "Credits", align: "right" }, { label: "Provider cost", align: "right" }, { label: "Contribution", align: "right" }]} /><tbody className="divide-y divide-line">{productCosts.map((item) => <tr key={item.key}><th scope="row" className="px-4 py-3 font-medium text-ink">{formatLabel(item.key)}</th><td className="px-4 py-3 text-right tabular-nums">{formatCredits(item.creditsDeducted)}</td><td className="px-4 py-3 text-right tabular-nums">{formatMoney(item.providerCostCents)}</td><td className="px-4 py-3 text-right tabular-nums">{formatMoney(item.grossContributionCents)}</td></tr>)}</tbody></AdminTable> : <AdminEmptyState title="No product costs" description="No usage events match these filters." />}</AdminPanel>
        <AdminPanel><AdminPanelHeader title="Model-level costs" description="Filtered demo usage grouped by exact model ID." />{modelCosts.length ? <AdminTable caption="Model-level AI costs" minWidth={520}><AdminTableHeader columns={[{ label: "Model" }, { label: "Credits", align: "right" }, { label: "Provider cost", align: "right" }, { label: "Contribution", align: "right" }]} /><tbody className="divide-y divide-line">{modelCosts.map((item) => <tr key={item.key}><th scope="row" className="max-w-52 break-words px-4 py-3 font-medium text-ink">{getAdminModel(item.key)?.displayName ?? item.key}<span className="mt-0.5 block break-words text-[11px] font-normal text-muted">{item.key}</span></th><td className="px-4 py-3 text-right tabular-nums">{formatCredits(item.creditsDeducted)}</td><td className="px-4 py-3 text-right tabular-nums">{formatMoney(item.providerCostCents)}</td><td className="px-4 py-3 text-right tabular-nums">{formatMoney(item.grossContributionCents)}</td></tr>)}</tbody></AdminTable> : <AdminEmptyState title="No model costs" description="No usage events match these filters." />}</AdminPanel>
      </div>

      <AdminPanel className="mt-5">
        <AdminPanelHeader title="Usage event review" description="Safe fixture metadata only; prompts, outputs and customer content are excluded." />
        <div className="mb-4 grid gap-3 sm:grid-cols-[220px_minmax(220px,1fr)_auto] sm:items-end">
          <div><label htmlFor="usage-product" className="mb-1.5 block text-xs font-semibold text-ink">Product</label><select id="usage-product" value={product} onChange={(event) => { setProduct(event.target.value as DashboardProduct | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All products</option><option value="chat">Chat</option><option value="image">Image Studio</option><option value="video">Video Studio</option><option value="website">Websites</option></select></div>
          <div><label htmlFor="usage-model" className="mb-1.5 block text-xs font-semibold text-ink">Model</label><select id="usage-model" value={modelId} onChange={(event) => { setModelId(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All models</option>{Array.from(new Set(events.map((event) => event.modelId))).map((id) => <option key={id} value={id}>{getAdminModel(id)?.displayName ?? id}</option>)}</select></div>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={product === "all" && modelId === "all"}><RotateCcw aria-hidden="true" />Reset filters</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={events.length} total={filterUsageEvents(range).length} noun="usage events" /></div>
        {pagination.totalItems ? <><AdminTable caption="AI usage and cost events" minWidth={1080}><AdminTableHeader columns={[{ label: "Event / job" }, { label: "Customer" }, { label: "Product / model" }, { label: "Credits", align: "right" }, { label: "Provider cost", align: "right" }, { label: "Generation" }, { label: "Reconciliation" }]} /><tbody className="divide-y divide-line">{pagination.items.map((event) => <tr key={event.id}><td className="max-w-56 px-4 py-4"><p className="break-words font-medium text-ink">{event.id}</p><p className="mt-1 break-words text-[11px] text-muted">{event.jobId} · {formatDateTime(event.occurredAt)}</p></td><td className="px-4 py-4 text-xs text-body">{getAdminUser(event.userId)?.name ?? event.userId}</td><td className="max-w-56 px-4 py-4 text-xs text-body"><p>{formatLabel(event.product)}</p><p className="mt-1 break-words text-muted">{event.modelId}</p></td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatCredits(event.creditsDeducted)}</td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatMoney(event.providerCostCents)}</td><td className="px-4 py-4"><AdminBadge label={event.generationStatus} tone={getAdminStatusTone(event.generationStatus)} /></td><td className="px-4 py-4"><AdminBadge label={event.reconciliationStatus} tone={getAdminStatusTone(event.reconciliationStatus)} /></td></tr>)}</tbody></AdminTable><AdminPagination {...pagination} itemLabel="usage events" onPageChange={setPage} /></> : <AdminEmptyState title="No usage events match" description="Choose another product, model or fixture range." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>
    </>
  );
}
