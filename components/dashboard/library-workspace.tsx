"use client";

import { Download, FileText, Film, Globe2, Image as ImageIcon, LibraryBig, Maximize2, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AssetPreviewDialog } from "@/components/dashboard/asset-preview-dialog";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ActionFeedback, DemoBadge, EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, FixtureAsset } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { filterAssets, productLabels, safeFileName } from "@/lib/dashboard/format";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

type AssetFilter = FixtureAsset["type"] | "all";
const filters: { id: AssetFilter; label: string }[] = [
  { id: "all", label: "All assets" },
  { id: "image", label: "Images" },
  { id: "video", label: "Video" },
  { id: "website", label: "Websites" },
  { id: "document", label: "Documents" },
];

function AssetTypeIcon({ type, className }: { type: FixtureAsset["type"]; className?: string }) {
  if (type === "image") return <ImageIcon className={className} aria-hidden="true" />;
  if (type === "video") return <Film className={className} aria-hidden="true" />;
  if (type === "website") return <Globe2 className={className} aria-hidden="true" />;
  return <FileText className={className} aria-hidden="true" />;
}

export function LibraryWorkspace() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AssetFilter>("all");
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const assets = filterAssets(workspaceFixture.assets, query, type);

  async function unavailableDownload(asset: FixtureAsset) {
    const response = await previewDashboardService.downloadAsset({ assetId: asset.id });
    setResult({ ...response, status: "unavailable", message: asset.type === "video" ? "This video fixture contains only a storyboard still. There is no video file to download." : "This fixture has no production file attached. No download started." });
  }

  async function deleteAsset(asset: FixtureAsset) {
    const response = await previewDashboardService.deleteAsset({ assetId: asset.id });
    setResult({ ...response, message: `Delete for “${asset.name}” was confirmed locally only. The asset remains in this fixture library.` });
  }

  return (
    <>
      <PageHeader eyebrow="Workspace · shared library" title="Library" description="Browse images, storyboard frames, website assets and documents from one fixture library. Preview and local fixture downloads work; saves and deletions do not persist." actions={<DemoBadge />} />
      <ActionFeedback result={result} />
      <div className="my-6 space-y-3 rounded-2xl border border-line bg-white p-3">
        <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><label htmlFor="asset-search" className="sr-only">Search library</label><input id="asset-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by asset name or description…" className="min-h-11 w-full rounded-xl bg-soft pl-10 pr-4 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/20" /></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Asset categories">{filters.map((filter) => <button key={filter.id} type="button" aria-pressed={type === filter.id} onClick={() => setType(filter.id)} className={cn("min-h-10 rounded-full border px-3.5 text-xs font-semibold transition-colors", type === filter.id ? "border-teal/25 bg-[#eaf6f0] text-teal-dark" : "border-line bg-white text-body hover:bg-soft")}>{filter.label}<span className="ml-1.5 font-normal text-muted">{filter.id === "all" ? workspaceFixture.assets.length : workspaceFixture.assets.filter((asset) => asset.type === filter.id).length}</span></button>)}</div>
      </div>
      {assets.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_1px_2px_rgba(21,25,24,0.02)]"><div className="relative aspect-[4/3] bg-[#eaf0ed]">{asset.previewUrl ? <><Image src={asset.previewUrl} alt={asset.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 360px" className="object-cover" /><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-teal-dark backdrop-blur">AI-generated fixture</span></> : <div className="grid h-full place-items-center p-6 text-center"><div><FileText className="mx-auto mb-3 size-10 text-teal" aria-hidden="true" /><p className="text-sm font-semibold text-ink">Text-only fixture</p><p className="mt-1 text-xs text-body">No document file attached</p></div></div>}<span className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl bg-white/90 text-teal shadow-sm backdrop-blur"><AssetTypeIcon type={asset.type} className="size-4" /></span></div><div className="p-4"><p className="text-[11px] font-semibold text-teal">{productLabels[asset.product]} · {asset.type}</p><h2 className="mt-1 text-base font-semibold tracking-[-0.02em]">{asset.name}</h2><p className="mt-1.5 text-[11px] text-muted">{asset.sizeLabel} · {asset.createdLabel}</p><div className="mt-4 flex flex-wrap gap-1 border-t border-line pt-3"><AssetPreviewDialog asset={asset} trigger={<Button type="button" variant="ghost" size="sm"><Maximize2 aria-hidden="true" />Preview</Button>} />{asset.downloadable && asset.previewUrl ? <Button asChild variant="ghost" size="sm"><a href={asset.previewUrl} download={`${safeFileName(asset.name)}.jpg`}><Download aria-hidden="true" />Download</a></Button> : <Button type="button" variant="ghost" size="sm" onClick={() => void unavailableDownload(asset)}><Download aria-hidden="true" />Download</Button>}<ConfirmDialog title={`Delete ${asset.name}?`} description="This previews the library deletion confirmation. It does not remove the asset or alter related project fixtures." confirmLabel="Validate delete" trigger={<Button type="button" variant="ghost" size="sm" className="text-error"><Trash2 aria-hidden="true" />Delete</Button>} onConfirm={() => deleteAsset(asset)} /></div></div></article>)}</div> : <><EmptyState title="No assets in this view" description="Try another category or a broader search. No fixture has been deleted." action={{ label: "Create in Image Studio", href: "/app/image-studio" }} icon={<LibraryBig aria-hidden="true" />} /><div className="mt-4 text-center"><Button type="button" variant="secondary" onClick={() => { setQuery(""); setType("all"); }}>Clear filters</Button></div></>}
    </>
  );
}
