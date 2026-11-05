"use client";

import {
  Download,
  Image as ImageIcon,
  Maximize2,
  Paperclip,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { AssetPreviewDialog } from "@/components/dashboard/asset-preview-dialog";
import { EstimatePanel } from "@/components/dashboard/estimate-panel";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ActionFeedback, DemoBadge, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, FixtureAsset, GenerationIntentImage } from "@/lib/contracts/dashboard";
import { estimateGeneration } from "@/lib/dashboard/estimates";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { safeFileName } from "@/lib/dashboard/format";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";

const styles: { id: GenerationIntentImage["style"]; label: string }[] = [
  { id: "none", label: "No preset" },
  { id: "editorial", label: "Editorial" },
  { id: "product", label: "Product" },
  { id: "natural", label: "Natural light" },
];

export function ImageStudio() {
  const [intent, setIntent] = useState<GenerationIntentImage>({
    product: "image",
    modelId: "gemini-3.1-flash-image",
    prompt: "A premium sage reusable bottle on a pale stone plinth, soft morning shadows, restrained mint accents",
    negativePrompt: "Cluttered background, illegible text, harsh reflections",
    referenceName: null,
    ratio: "landscape",
    resolution: "1k",
    count: 2,
    style: "product",
  });
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const estimate = useMemo(() => estimateGeneration({ ...intent, referenceName }), [intent, referenceName]);
  const images = workspaceFixture.assets.filter((asset) => asset.type === "image");
  const history = workspaceFixture.generations.filter((generation) => generation.product === "image");

  function update<K extends keyof GenerationIntentImage>(key: K, value: GenerationIntentImage[K]) {
    setIntent((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    if (intent.prompt.trim().length < 3) {
      setValidationError("Describe your image in at least 3 characters.");
      return;
    }
    setValidationError("");
    setBusy(true);
    const response = await previewDashboardService.generate({
      product: "image",
      modelId: intent.modelId,
      prompt: intent.prompt,
      attachmentNames: referenceName ? [referenceName] : [],
      options: { negativePrompt: intent.negativePrompt, ratio: intent.ratio, resolution: intent.resolution, count: intent.count, style: intent.style },
    });
    setResult({ ...response, message: "Your image settings were validated locally. No generation job, output, upload or credit deduction was created; the fixtures below are unchanged." });
    setBusy(false);
  }

  async function save(asset: FixtureAsset) {
    setResult(await previewDashboardService.saveAsset({ assetId: asset.id }));
  }

  function edit(asset: FixtureAsset, variation: boolean) {
    update("prompt", variation ? `Create a restrained composition variation of ${asset.name}, preserving its material and lighting direction` : `Refine ${asset.name}: adjust the composition and leave the material palette unchanged`);
    setResult({ status: "preview", persisted: false, creditsChanged: 0, message: variation ? "A local variation prompt is ready. No image was changed or generated." : "The fixture name was used to prepare a local edit prompt. The original image is unchanged." });
    document.getElementById("image-prompt")?.focus();
  }

  return (
    <>
      <PageHeader eyebrow="Create · fixture workspace" title="Image Studio" description="Explore a visual direction with precise, approachable controls. Estimates and results are illustrative; no image model is connected." actions={<DemoBadge />} />
      <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <Panel className="xl:sticky xl:top-32">
          <div className="mb-5 flex items-center gap-2"><SlidersHorizontal className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Creative direction</h2></div>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between"><label htmlFor="image-prompt" className="text-sm font-semibold text-ink">Prompt</label><span className="text-[11px] text-muted">{intent.prompt.length}/2,000</span></div>
              <textarea id="image-prompt" value={intent.prompt} onChange={(event) => update("prompt", event.target.value)} maxLength={2000} rows={5} className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="Describe the subject, setting and mood…" />
            </div>
            <div><label htmlFor="negative-prompt" className="mb-2 block text-sm font-semibold text-ink">Negative prompt <span className="font-normal text-muted">(optional)</span></label><textarea id="negative-prompt" value={intent.negativePrompt} onChange={(event) => update("negativePrompt", event.target.value)} maxLength={1000} rows={2} className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="What should the direction avoid?" /></div>
            <ModelSelector id="image-model" product="image" value={intent.modelId} onChange={(value) => update("modelId", value)} />
            <div>
              <span className="mb-2 block text-sm font-semibold text-ink">Reference image <span className="font-normal text-muted">(optional)</span></span>
              <input ref={fileRef} id="image-reference" type="file" accept="image/*" className="sr-only" aria-label="Image reference file, local name only" onChange={(event) => setReferenceName(event.target.files?.[0]?.name ?? null)} />
              {referenceName ? <div className="flex items-center gap-2 rounded-xl border border-line bg-soft p-2.5 pl-3.5"><Paperclip className="size-4 shrink-0 text-teal" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-xs text-ink">{referenceName}</span><button type="button" onClick={() => { setReferenceName(null); if (fileRef.current) fileRef.current.value = ""; }} className="grid size-8 place-items-center rounded-full hover:bg-white" aria-label="Remove reference image"><X className="size-4" aria-hidden="true" /></button></div> : <Button type="button" variant="secondary" className="w-full border-dashed" onClick={() => fileRef.current?.click()}><Paperclip aria-hidden="true" />Choose a local reference</Button>}
              <p className="mt-2 text-[11px] leading-5 text-muted">Only the file name is retained in this preview. Nothing is uploaded or read.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="image-ratio" className="mb-2 block text-xs font-semibold text-ink">Aspect ratio</label><select id="image-ratio" value={intent.ratio} onChange={(event) => update("ratio", event.target.value as GenerationIntentImage["ratio"])} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="square">1:1 · Square</option><option value="portrait">4:5 · Portrait</option><option value="landscape">4:3 · Landscape</option><option value="wide">16:9 · Wide</option></select></div>
              <div><label htmlFor="image-resolution" className="mb-2 block text-xs font-semibold text-ink">Resolution</label><select id="image-resolution" value={intent.resolution} onChange={(event) => update("resolution", event.target.value as GenerationIntentImage["resolution"])} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="1k">1K</option><option value="2k">2K</option><option value="4k">4K</option></select></div>
            </div>
            <fieldset><legend className="mb-2 text-xs font-semibold text-ink">Style preset</legend><div className="grid grid-cols-2 gap-2">{styles.map((style) => <label key={style.id} className={`flex min-h-10 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-xs font-medium transition-colors ${intent.style === style.id ? "border-teal bg-[#edf7f2] text-teal-dark" : "border-line bg-white text-body hover:bg-soft"}`}><input type="radio" name="image-style" value={style.id} checked={intent.style === style.id} onChange={() => update("style", style.id)} className="sr-only" />{style.label}</label>)}</div></fieldset>
            <div><label htmlFor="image-count" className="mb-2 block text-xs font-semibold text-ink">Number of images</label><select id="image-count" value={intent.count} onChange={(event) => update("count", Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15">{[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count} image{count > 1 ? "s" : ""}</option>)}</select></div>
            <EstimatePanel estimate={estimate} balance={workspaceFixture.wallet.balance} />
            {validationError && <p role="alert" className="text-sm font-medium text-error">{validationError}</p>}
            <Button type="button" size="lg" className="w-full" onClick={() => void generate()} disabled={busy}><Sparkles aria-hidden="true" />{busy ? "Validating locally…" : "Preview generation"}</Button>
            <p className="text-center text-[11px] leading-5 text-muted">No job or new image will be created.</p>
          </div>
        </Panel>

        <div className="min-w-0 space-y-6" id="results">
          <ActionFeedback result={result} />
          <section aria-labelledby="image-results-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><DemoBadge label="Local image fixtures" /><h2 id="image-results-heading" className="mt-2 text-xl font-semibold tracking-[-0.03em]">Product direction studies</h2><p className="mt-1 text-sm text-body">Generated for this demo, not from your prompt or account.</p></div><span className="text-xs font-medium text-muted">{images.length} fixtures</span></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {images.map((asset) => (
                <article key={asset.id} className="overflow-hidden rounded-3xl border border-line bg-white">
                  <AssetPreviewDialog asset={asset} trigger={<button type="button" className="group relative block aspect-[4/3] w-full overflow-hidden bg-subtle text-left" aria-label={`Open full-screen preview of ${asset.name}`}><Image src={asset.previewUrl ?? ""} alt={asset.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 420px" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" /><span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/90 text-ink opacity-100 shadow-sm backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"><Maximize2 className="size-4" aria-hidden="true" /></span><span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-teal-dark backdrop-blur">AI-generated fixture</span></button>} />
                  <div className="p-4"><h3 className="text-sm font-semibold tracking-[-0.015em]">{asset.name}</h3><p className="mt-1 text-[11px] text-muted">{asset.sizeLabel}</p><div className="mt-4 flex flex-wrap gap-1.5"><AssetPreviewDialog asset={asset} /><Button asChild variant="ghost" size="sm"><a href={asset.previewUrl ?? ""} download={`${safeFileName(asset.name)}.jpg`}><Download aria-hidden="true" />Download</a></Button><Button type="button" variant="ghost" size="sm" onClick={() => void save(asset)}><Save aria-hidden="true" />Save</Button></div><div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2"><Button type="button" variant="ghost" size="sm" onClick={() => edit(asset, false)}><WandSparkles aria-hidden="true" />Edit prompt</Button><Button type="button" variant="ghost" size="sm" onClick={() => edit(asset, true)}><RefreshCw aria-hidden="true" />Variation</Button></div></div>
                </article>
              ))}
            </div>
          </section>

          <Panel>
            <div className="mb-4 flex items-center gap-2"><ImageIcon className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Image history</h2><DemoBadge label="Fixture" /></div>
            <ul className="divide-y divide-line">{history.map((generation) => <li key={generation.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-ink">{generation.title}</p><p className="mt-1 text-xs text-muted">{generation.createdLabel} · {generation.credits} fixture credits</p></div><StatusBadge status={generation.status} /></li>)}</ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
