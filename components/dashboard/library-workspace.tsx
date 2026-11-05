"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Download, FileJson, Image as ImageIcon, LibraryBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";

export function LibraryWorkspace({ data }: { data: WorkspaceSnapshot }) {
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const assets = useMemo(() => data.assets.filter((asset) => (kind === "all" || asset.kind === kind) && asset.fileName.toLowerCase().includes(query.toLowerCase())), [data.assets, kind, query]);
  return <><PageHeader eyebrow="Your work" title="Asset library" description="Owned generated and uploaded assets stored in Cloudflare R2. Downloads are authorized per asset." />
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row"><div><label htmlFor="library-search" className="sr-only">Search assets</label><input id="library-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file names" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm sm:w-72" /></div><div><label htmlFor="library-kind" className="sr-only">Filter asset type</label><select id="library-kind" value={kind} onChange={(event) => setKind(event.target.value)} className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm"><option value="all">All asset types</option><option value="image">Images</option><option value="video">Videos</option><option value="website_source">Website source</option><option value="upload">Uploads</option></select></div><span className="self-center text-xs text-muted sm:ml-auto">{assets.length} assets</span></div>
    {assets.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-3xl border border-line bg-white"><div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-subtle">{asset.kind === "image" ? <Image unoptimized src={asset.downloadPath} alt={asset.fileName} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-contain" /> : asset.kind === "video" ? <video controls preload="metadata" src={asset.downloadPath} className="size-full bg-black" aria-label={asset.fileName} /> : asset.kind === "website_source" ? <FileJson className="size-10 text-teal" /> : asset.kind === "upload" ? <LibraryBig className="size-10 text-teal" /> : <ImageIcon className="size-10 text-teal" />}</div><div className="p-4"><h2 className="truncate text-sm font-semibold">{asset.fileName}</h2><p className="mt-1 text-[11px] capitalize text-muted">{asset.kind.replaceAll("_", " ")} · {Math.ceil(asset.sizeBytes / 1024).toLocaleString()} KiB</p><p className="mt-1 truncate text-[11px] text-muted">{asset.mimeType}</p><Button asChild variant="ghost" size="sm" className="mt-3"><a href={asset.downloadPath}><Download />Download</a></Button></div></article>)}</div> : <EmptyState title={data.assets.length ? "No assets match" : "Your library is empty"} description={data.assets.length ? "Clear the search or choose another asset type." : "Completed image, video and website source assets will appear here."} icon={<LibraryBig />} />}
  </>;
}
