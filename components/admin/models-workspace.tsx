"use client";

import { RotateCcw, Search, Settings2 } from "lucide-react";
import { useState } from "react";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { ModelConfigurationDialog } from "@/components/admin/model-configuration-dialog";
import { AdminBadge, AdminEmptyState, AdminPageHeader, AdminPanel, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminModels } from "@/lib/admin/fixtures";
import { formatLabel, matchesAdminQuery, paginate } from "@/lib/admin/format";
import type { AdminModel, AdminPreviewResult } from "@/lib/contracts/admin";
import type { DashboardProduct, ModelProvider } from "@/lib/contracts/dashboard";

export function ModelsWorkspace({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [provider, setProvider] = useState<ModelProvider | "all">("all");
  const [product, setProduct] = useState<DashboardProduct | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedModel, setSelectedModel] = useState<AdminModel | null>(null);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  const filtered = adminModels.filter((model) =>
    (provider === "all" || model.provider === provider) &&
    (product === "all" || model.products.includes(product)) &&
    matchesAdminQuery(query, model.id, model.displayName, model.provider, ...model.capabilities),
  );
  const pagination = paginate(filtered, page, 4);

  function resetFilters() {
    setQuery("");
    setProvider("all");
    setProduct("all");
    setPage(1);
  }

  return (
    <>
      <AdminPageHeader eyebrow="AI operations" title="AI Models" description="Manage fictional model availability with per-model products, capabilities and modalities. Catalogue IDs are researched fixtures, not proof of provider connectivity." />
      <div className="mb-4"><AdminPreviewFeedback result={result} /></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-end">
          <div><label htmlFor="model-search" className="mb-1.5 block text-xs font-semibold text-ink">Search models</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="model-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Name, model ID or capability" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div>
          <div><label htmlFor="model-provider" className="mb-1.5 block text-xs font-semibold text-ink">Provider</label><select id="model-provider" value={provider} onChange={(event) => { setProvider(event.target.value as ModelProvider | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All providers</option><option value="OpenAI">OpenAI</option><option value="Anthropic">Anthropic</option><option value="Google">Google</option></select></div>
          <div><label htmlFor="model-product" className="mb-1.5 block text-xs font-semibold text-ink">Product</label><select id="model-product" value={product} onChange={(event) => { setProduct(event.target.value as DashboardProduct | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All products</option><option value="chat">Chat</option><option value="image">Image Studio</option><option value="video">Video Studio</option><option value="website">Websites</option></select></div>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={!query && provider === "all" && product === "all"}><RotateCcw aria-hidden="true" />Reset</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminModels.length} noun="models" /></div>
        {pagination.totalItems ? (
          <>
            <AdminTable caption="AI model configuration" minWidth={1160}>
              <AdminTableHeader columns={[{ label: "Model / capabilities" }, { label: "Provider" }, { label: "Products" }, { label: "Input → output" }, { label: "Pricing" }, { label: "Availability" }, { label: "Action", align: "right" }]} />
              <tbody className="divide-y divide-line">
                {pagination.items.map((model) => (
                  <tr key={model.id}>
                    <td className="max-w-72 px-4 py-4"><p className="font-semibold text-ink">{model.displayName}</p><p className="mt-0.5 break-words text-[11px] text-muted">{model.id}</p><p className="mt-2 text-xs leading-5 text-body">{model.capabilities.join(" · ")}</p></td>
                    <td className="px-4 py-4 text-xs text-body">{model.provider}</td>
                    <td className="px-4 py-4"><div className="flex max-w-48 flex-wrap gap-1">{model.products.map((item) => <AdminBadge key={item} label={item} />)}</div></td>
                    <td className="px-4 py-4 text-xs leading-5 text-body"><p>In: {model.inputModalities.join(", ")}</p><p className="mt-1">Out: {model.outputModalities.join(", ")}</p></td>
                    <td className="px-4 py-4 text-xs text-body"><p className="font-medium text-ink">{model.priceVersion}</p><p className="mt-1">{model.pricingSummary}</p></td>
                    <td className="px-4 py-4"><AdminBadge label={formatLabel(model.operationalStatus)} tone={getAdminStatusTone(model.operationalStatus)} /><p className="mt-1.5 text-[11px] text-muted">{model.enabled ? "Enabled" : "Disabled"} · {model.availability}</p></td>
                    <td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedModel(model)} aria-label={`Configure ${model.displayName}`}><Settings2 aria-hidden="true" />Configure</Button></td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <AdminPagination {...pagination} itemLabel="models" onPageChange={setPage} />
          </>
        ) : <AdminEmptyState title="No models match these filters" description="Try another provider, product, model ID or capability." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>
      {selectedModel && <ModelConfigurationDialog key={selectedModel.id} model={selectedModel} onClose={() => setSelectedModel(null)} onResult={setResult} />}
    </>
  );
}
