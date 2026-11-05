"use client";

import {
  AlertCircle,
  Clock3,
  Download,
  Film,
  ImagePlus,
  LoaderCircle,
  Maximize2,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { AssetPreviewDialog } from "@/components/dashboard/asset-preview-dialog";
import { EstimatePanel } from "@/components/dashboard/estimate-panel";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ActionFeedback, DemoBadge, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, FixtureGeneration, GenerationIntentVideo } from "@/lib/contracts/dashboard";
import { estimateGeneration } from "@/lib/dashboard/estimates";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { getModel } from "@/lib/dashboard/models";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

type JobFilter = "all" | "active" | "completed" | "failed";

function JobIcon({ status }: { status: FixtureGeneration["status"] }) {
  if (status === "queued") return <Clock3 className="size-4" aria-hidden="true" />;
  if (status === "processing") return <LoaderCircle className="size-4" aria-hidden="true" />;
  if (status === "failed") return <AlertCircle className="size-4" aria-hidden="true" />;
  return <Film className="size-4" aria-hidden="true" />;
}

export function VideoStudio() {
  const [intent, setIntent] = useState<GenerationIntentVideo>({
    product: "video",
    modelId: "gemini-omni-1.1-flash",
    mode: "text",
    prompt: "Slow cinematic arrival at a timber wellness retreat, soft morning light, gentle camera movement",
    durationSeconds: 6,
    ratio: "wide",
    resolution: "720p",
    referenceName: null,
  });
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");
  const [selectedJobId, setSelectedJobId] = useState("gen-video-complete");
  const fileRef = useRef<HTMLInputElement>(null);
  const estimate = useMemo(() => estimateGeneration({ ...intent, referenceName }), [intent, referenceName]);
  const jobs = workspaceFixture.generations.filter((generation) => generation.product === "video");
  const filteredJobs = jobs.filter((job) => jobFilter === "all" || (jobFilter === "active" ? job.status === "queued" || job.status === "processing" : job.status === jobFilter));
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0]!;
  const completedAsset = workspaceFixture.assets.find((asset) => asset.id === "asset-retreat-video");

  function update<K extends keyof GenerationIntentVideo>(key: K, value: GenerationIntentVideo[K]) {
    setIntent((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    if (intent.mode === "text" && intent.prompt.trim().length < 3) {
      setValidationError("Describe the motion in at least 3 characters.");
      return;
    }
    if (intent.mode === "image" && !referenceName) {
      setValidationError("Choose a local reference file name for image-to-video mode.");
      return;
    }
    setValidationError("");
    const response = await previewDashboardService.generate({
      product: "video",
      modelId: intent.modelId,
      prompt: intent.prompt,
      attachmentNames: referenceName ? [referenceName] : [],
      options: { mode: intent.mode, durationSeconds: intent.durationSeconds, ratio: intent.ratio, resolution: intent.resolution },
    });
    setResult({ ...response, message: "Your video settings were validated locally. No job entered a queue, no reference was uploaded and no credits changed." });
  }

  async function retry(job: FixtureGeneration) {
    const response = await previewDashboardService.generate({ product: "video", modelId: job.modelId, prompt: job.title, options: { mode: "text", durationSeconds: 6, ratio: "wide", resolution: "720p" } });
    setResult({ ...response, message: `Retry for “${job.title}” is unavailable. The failed fixture remains unchanged and no new job or credit deduction occurred.` });
  }

  async function save(assetId: string) {
    setResult(await previewDashboardService.saveAsset({ assetId }));
  }

  return (
    <>
      <PageHeader eyebrow="Create · fixture workspace" title="Video Studio" description="Shape a short motion concept and inspect queued, processing, completed and failed job presentations. Progress is static and no video service is connected." actions={<DemoBadge />} />
      <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <Panel className="xl:sticky xl:top-32">
          <div className="mb-5 flex items-center gap-2"><Video className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Motion direction</h2></div>
          <fieldset className="mb-5"><legend className="sr-only">Video creation mode</legend><div className="grid grid-cols-2 rounded-xl bg-subtle p-1">{(["text", "image"] as const).map((mode) => <label key={mode} className={cn("flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors", intent.mode === mode ? "bg-white text-ink shadow-sm" : "text-body hover:text-ink")}><input type="radio" name="video-mode" value={mode} checked={intent.mode === mode} onChange={() => update("mode", mode)} className="sr-only" />{mode === "text" ? <Sparkles className="size-3.5" aria-hidden="true" /> : <ImagePlus className="size-3.5" aria-hidden="true" />}{mode === "text" ? "Text to video" : "Image to video"}</label>)}</div></fieldset>
          <div className="space-y-5">
            <div><label htmlFor="video-prompt" className="mb-2 block text-sm font-semibold text-ink">{intent.mode === "text" ? "Motion prompt" : "Motion guidance (optional)"}</label><textarea id="video-prompt" value={intent.prompt} onChange={(event) => update("prompt", event.target.value)} rows={4} maxLength={2000} className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="Describe the scene, subject and camera movement…" /></div>
            <ModelSelector id="video-model" product="video" value={intent.modelId} onChange={(value) => update("modelId", value)} />
            <div>
              <span className="mb-2 block text-sm font-semibold text-ink">Reference frame {intent.mode === "image" ? "" : "(optional)"}</span>
              <input ref={fileRef} id="video-reference" type="file" accept="image/*" className="sr-only" aria-label="Video reference frame, local name only" onChange={(event) => setReferenceName(event.target.files?.[0]?.name ?? null)} />
              {referenceName ? <div className="flex items-center gap-2 rounded-xl border border-line bg-soft p-2.5 pl-3.5"><ImagePlus className="size-4 shrink-0 text-teal" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-xs text-ink">{referenceName}</span><button type="button" onClick={() => { setReferenceName(null); if (fileRef.current) fileRef.current.value = ""; }} className="grid size-8 place-items-center rounded-full hover:bg-white" aria-label="Remove reference frame"><X className="size-4" aria-hidden="true" /></button></div> : <Button type="button" variant="secondary" className="w-full border-dashed" onClick={() => fileRef.current?.click()}><ImagePlus aria-hidden="true" />Choose a local frame</Button>}
              <p className="mt-2 text-[11px] leading-5 text-muted">File name only. No image data is read or uploaded.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="video-duration" className="mb-2 block text-xs font-semibold text-ink">Duration</label><select id="video-duration" value={intent.durationSeconds} onChange={(event) => update("durationSeconds", Number(event.target.value) as GenerationIntentVideo["durationSeconds"])} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value={3}>3 seconds</option><option value={6}>6 seconds</option><option value={10}>10 seconds</option></select></div>
              <div><label htmlFor="video-ratio" className="mb-2 block text-xs font-semibold text-ink">Aspect ratio</label><select id="video-ratio" value={intent.ratio} onChange={(event) => update("ratio", event.target.value as GenerationIntentVideo["ratio"])} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="wide">16:9 · Wide</option><option value="portrait">9:16 · Portrait</option><option value="square">1:1 · Square</option></select></div>
            </div>
            <div><label htmlFor="video-resolution" className="mb-2 block text-xs font-semibold text-ink">Resolution</label><select id="video-resolution" value={intent.resolution} onChange={(event) => update("resolution", event.target.value as GenerationIntentVideo["resolution"])} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="360p">360p</option><option value="720p">720p</option><option value="1080p">1080p</option><option value="4k">4K</option></select></div>
            <EstimatePanel estimate={estimate} balance={workspaceFixture.wallet.balance} />
            {validationError && <p role="alert" className="text-sm font-medium text-error">{validationError}</p>}
            <Button type="button" size="lg" className="w-full" onClick={() => void generate()}><Sparkles aria-hidden="true" />Preview video job</Button>
            <p className="text-center text-[11px] leading-5 text-muted">No queue, render, upload or deduction will occur.</p>
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          <ActionFeedback result={result} />
          <section aria-labelledby="video-preview-heading" className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Selected job fixture</p><h2 id="video-preview-heading" className="mt-1 text-lg font-semibold tracking-[-0.025em]">{selectedJob.title}</h2></div><StatusBadge status={selectedJob.status} /></div>
            {selectedJob.status === "completed" && completedAsset ? (
              <div role="group" aria-label="Storyboard preview player">
                <div className="relative aspect-video bg-[#dfe8e3]"><Image src={completedAsset.previewUrl ?? ""} alt={completedAsset.alt} fill sizes="(max-width: 1280px) 100vw, 800px" className="object-cover" /><div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-16"><AssetPreviewDialog asset={completedAsset} trigger={<Button type="button" variant="secondary" size="sm"><Maximize2 aria-hidden="true" />Open storyboard frame</Button>} /><span className="rounded-full bg-ink/50 px-2.5 py-1 text-[11px] text-white">Still frame · 10s concept</span></div></div>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Button type="button" variant="ghost" size="icon" disabled aria-label="Playback unavailable; no video file"><Play aria-hidden="true" /></Button><div><p className="text-xs font-semibold text-ink">Playback unavailable</p><p className="text-[11px] text-muted">This completed fixture has a storyboard still, not a video file.</p></div></div><div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setResult({ status: "unavailable", persisted: false, creditsChanged: 0, message: "There is no playable video file to download. The storyboard frame can be opened for inspection." })}><Download aria-hidden="true" />Download video</Button><Button type="button" variant="ghost" size="sm" onClick={() => void save(completedAsset.id)}><Save aria-hidden="true" />Save frame</Button></div></div>
              </div>
            ) : (
              <div className="grid min-h-[330px] place-items-center bg-soft px-6 py-12 text-center"><div className="max-w-sm"><span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-white text-teal shadow-sm"><JobIcon status={selectedJob.status} /></span><h3 className="text-lg font-semibold">{selectedJob.status === "failed" ? "This job fixture did not complete" : selectedJob.status === "queued" ? "Waiting in the fixture queue" : "Processing snapshot"}</h3><p className="mt-2 text-sm leading-6 text-body">{selectedJob.errorMessage ?? (selectedJob.status === "queued" ? "No live queue exists and this position will not advance." : "The 62% progress record is a static fixture, not a live render.")}</p>{selectedJob.status === "failed" && <Button type="button" variant="secondary" className="mt-5" onClick={() => void retry(selectedJob)}><RefreshCw aria-hidden="true" />Retry preview</Button>}</div></div>
            )}
          </section>

          <Panel id="jobs" className="scroll-mt-36">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Film className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Generation jobs</h2><DemoBadge label="Static" /></div><div><label htmlFor="job-filter" className="sr-only">Filter video jobs</label><select id="job-filter" value={jobFilter} onChange={(event) => setJobFilter(event.target.value as JobFilter)} className="min-h-10 rounded-xl border border-line bg-white px-3 text-xs font-medium text-ink outline-none focus:border-teal"><option value="all">All job states</option><option value="active">Queued & processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div></div>
            <ul className="space-y-3">
              {filteredJobs.map((job) => {
                const model = getModel(job.modelId);
                return <li key={job.id} className={cn("rounded-2xl border p-4 transition-colors", selectedJob.id === job.id ? "border-teal/30 bg-[#f5faf7]" : "border-line bg-white")}><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", job.status === "failed" ? "bg-[#fff2f0] text-error" : "bg-subtle text-teal")}><JobIcon status={job.status} /></span><div className="min-w-0 flex-1"><button type="button" onClick={() => setSelectedJobId(job.id)} className="text-left text-sm font-semibold text-ink hover:text-teal-dark">{job.title}</button><p className="mt-1 text-[11px] leading-5 text-muted">{model?.displayName ?? job.modelId} · {job.createdLabel}</p>{job.status === "processing" && <div className="mt-3"><div className="mb-1 flex justify-between text-[11px] text-body"><span>Static fixture progress</span><span>{job.progress}%</span></div><progress value={job.progress ?? 0} max={100} className="h-2 w-full accent-teal" aria-label={`Fixture progress ${job.progress}%`} /></div>}{job.status === "failed" && <p className="mt-2 text-xs leading-5 text-error">{job.errorMessage}</p>}</div><div className="flex shrink-0 items-center gap-2"><StatusBadge status={job.status} />{job.status === "failed" && <Button type="button" variant="ghost" size="sm" onClick={() => void retry(job)} aria-label={`Retry ${job.title}`}><RefreshCw aria-hidden="true" />Retry</Button>}</div></div></li>;
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
