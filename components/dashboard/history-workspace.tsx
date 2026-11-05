"use client";

import { ArrowRight, History, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DemoBadge, EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardProduct, GenerationStatus } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { filterGenerations, productLabels } from "@/lib/dashboard/format";
import { getModel } from "@/lib/dashboard/models";

function historyHref(product: DashboardProduct) {
  if (product === "chat") return "/app/chat/conv-campaign";
  if (product === "image") return "/app/image-studio#results";
  if (product === "video") return "/app/video-studio#jobs";
  return "/app/websites/site-stillwater/editor";
}

export function HistoryWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<DashboardProduct | "all">("all");
  const [status, setStatus] = useState<GenerationStatus | "all">("all");
  const [projectId, setProjectId] = useState(initialProjectId ?? "all");
  const generations = filterGenerations(workspaceFixture.generations, query, product, status).filter((generation) => projectId === "all" || generation.projectId === projectId);

  function clearFilters() {
    setQuery("");
    setProduct("all");
    setStatus("all");
    setProjectId("all");
  }

  return (
    <>
      <PageHeader eyebrow="Workspace · unified history" title="Generation history" description="Review product, model, provider, status, credit and date fixtures across the shared workspace. Active progress is static and no record is a live backend status." actions={<DemoBadge />} />
      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_200px]">
        <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><label htmlFor="history-search" className="sr-only">Search generation history</label><input id="history-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or model ID…" className="min-h-11 w-full rounded-xl bg-soft pl-10 pr-4 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/20" /></div>
        <div><label htmlFor="history-product" className="sr-only">Filter history by product</label><select id="history-product" value={product} onChange={(event) => setProduct(event.target.value as DashboardProduct | "all")} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="all">All products</option>{(Object.keys(productLabels) as DashboardProduct[]).map((id) => <option key={id} value={id}>{productLabels[id]}</option>)}</select></div>
        <div><label htmlFor="history-status" className="sr-only">Filter history by status</label><select id="history-status" value={status} onChange={(event) => setStatus(event.target.value as GenerationStatus | "all")} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="all">All statuses</option><option value="queued">Queued</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div>
        <div><label htmlFor="history-project" className="sr-only">Filter history by project</label><select id="history-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="all">All projects</option>{workspaceFixture.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>
      </div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted"><span>{generations.length} of {workspaceFixture.generations.length} fixture records</span>{(query || product !== "all" || status !== "all" || projectId !== "all") && <button type="button" onClick={clearFilters} className="min-h-9 rounded-lg px-2 font-semibold text-teal-dark hover:bg-soft">Clear filters</button>}</div>
      {generations.length ? <>
        <div className="hidden overflow-hidden rounded-3xl border border-line bg-white md:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Illustrative generation history</caption>
            <thead><tr className="border-b border-line bg-[#fbfcfb] text-[11px] font-semibold uppercase tracking-[0.1em] text-muted"><th scope="col" className="px-5 py-4">Generation</th><th scope="col" className="px-4 py-4">Model & provider</th><th scope="col" className="px-4 py-4">Status</th><th scope="col" className="px-4 py-4">Credits</th><th scope="col" className="px-4 py-4">Date</th><th scope="col" className="px-5 py-4"><span className="sr-only">Open</span></th></tr></thead>
            <tbody className="divide-y divide-line">{generations.map((generation) => { const model = getModel(generation.modelId); return <tr key={generation.id} className="text-sm transition-colors hover:bg-[#fbfcfb]"><td className="max-w-64 px-5 py-4"><p className="font-semibold text-ink">{generation.title}</p><p className="mt-1 text-[11px] font-normal text-muted">{productLabels[generation.product]}</p></td><td className="px-4 py-4"><p className="text-xs font-medium text-ink">{model?.displayName ?? generation.modelId}</p><p className="mt-1 text-[11px] text-muted">{model?.provider ?? "Catalogue fixture"}</p></td><td className="px-4 py-4"><StatusBadge status={generation.status} />{generation.status === "processing" && <p className="mt-1 text-[10px] text-muted">{generation.progress}% static</p>}</td><td className="px-4 py-4 text-xs font-semibold text-ink">{generation.credits}<span className="block text-[10px] font-normal text-muted">fixture</span></td><td className="whitespace-nowrap px-4 py-4 text-[11px] text-body">{generation.createdLabel}</td><td className="px-5 py-4"><Link href={historyHref(generation.product)} className="grid size-9 place-items-center rounded-full text-teal hover:bg-soft" aria-label={`Open ${generation.title}`}><ArrowRight className="size-4" aria-hidden="true" /></Link></td></tr>; })}</tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">{generations.map((generation) => { const model = getModel(generation.modelId); return <li key={generation.id} className="rounded-2xl border border-line bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-teal">{productLabels[generation.product]}</p><h2 className="mt-1 text-sm font-semibold text-ink">{generation.title}</h2></div><StatusBadge status={generation.status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted">Model</dt><dd className="mt-1 font-medium text-ink">{model?.displayName ?? generation.modelId}</dd></div><div><dt className="text-muted">Provider</dt><dd className="mt-1 font-medium text-ink">{model?.provider ?? "Fixture"}</dd></div><div><dt className="text-muted">Fixture credits</dt><dd className="mt-1 font-medium text-ink">{generation.credits}</dd></div><div><dt className="text-muted">Date</dt><dd className="mt-1 font-medium text-ink">{generation.createdLabel}</dd></div></dl><Button asChild variant="ghost" size="sm" className="mt-3 w-full justify-between"><Link href={historyHref(generation.product)}>Open related workspace<ArrowRight aria-hidden="true" /></Link></Button></li>; })}</ul>
      </> : <><EmptyState title="No generation records match" description="Adjust the product, status, project or search filters. No history was removed." icon={<History aria-hidden="true" />} /><div className="mt-4 text-center"><Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button></div></>}
    </>
  );
}
