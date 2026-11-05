"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileText, Maximize2, Save, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ActionFeedback, DemoBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, FixtureAsset } from "@/lib/contracts/dashboard";
import { safeFileName } from "@/lib/dashboard/format";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";

export function AssetPreviewDialog({ asset, trigger }: { asset: FixtureAsset; trigger?: React.ReactNode }) {
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  async function save() {
    setResult(await previewDashboardService.saveAsset({ assetId: asset.id }));
  }
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button type="button" variant="secondary" size="sm"><Maximize2 aria-hidden="true" />Preview</Button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-3xl border border-white/20 bg-white shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <DemoBadge />
              <Dialog.Title className="mt-2 text-lg font-semibold tracking-[-0.025em]">{asset.name}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted">{asset.sizeLabel}</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close preview"><X aria-hidden="true" /></Button></Dialog.Close>
          </div>
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative min-h-[300px] bg-[#eaf0ed] sm:min-h-[480px] lg:min-h-[600px]">
              {asset.previewUrl ? (
                <Image src={asset.previewUrl} alt={asset.alt} fill sizes="(max-width: 1024px) 100vw, 800px" className="object-contain" priority />
              ) : (
                <div className="absolute inset-0 grid place-items-center p-8 text-center"><div><FileText className="mx-auto mb-4 size-12 text-teal" aria-hidden="true" /><p className="font-semibold text-ink">Text-only document fixture</p><p className="mt-2 text-sm text-body">There is no downloadable document file.</p></div></div>
              )}
            </div>
            <div className="space-y-5 border-t border-line p-5 lg:border-l lg:border-t-0">
              <div>
                <h3 className="mb-2 text-sm font-semibold">About this preview</h3>
                <p className="text-sm leading-6 text-body">This is an AI-generated local fixture, not a private upload or production generation.</p>
                {asset.type === "video" && <p className="mt-3 rounded-xl bg-[#fff9e9] p-3 text-xs leading-5 text-[#725511]">Storyboard still only. No playable video or video download exists.</p>}
              </div>
              <div className="flex flex-col gap-2">
                {asset.downloadable && asset.previewUrl ? (
                  <Button asChild variant="secondary"><a href={asset.previewUrl} download={`${safeFileName(asset.name)}.jpg`}><Download aria-hidden="true" />Download fixture</a></Button>
                ) : <Button type="button" variant="secondary" disabled><Download aria-hidden="true" />No file available</Button>}
                <Button type="button" variant="ghost" onClick={save}><Save aria-hidden="true" />Save to library</Button>
              </div>
              <ActionFeedback result={result} />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
