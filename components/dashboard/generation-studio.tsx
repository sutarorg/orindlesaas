"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Download, FileText, Globe2, Image as ImageIcon, LoaderCircle, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, InlineNotice, PageHeader, Panel } from "@/components/dashboard/ui";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";

type Kind = "image" | "video" | "website";
type Job = WorkspaceSnapshot["jobs"][number];
const terminal = new Set(["succeeded", "failed", "cancelled", "reconciliation_required"]);
const labels = { image: { title: "Image Studio", eyebrow: "Create · Images", description: "Generate an owned image asset. Final credits are calculated from actual Gateway cost.", action: "Generate image" }, video: { title: "Video Studio", eyebrow: "Create · Video", description: "Start a durable video job and poll its provider operation without duplicate submissions.", action: "Generate video" }, website: { title: "New website", eyebrow: "Create · Websites", description: "Generate a dependency-free static website, then validate it in an isolated sandbox.", action: "Generate website" } };

async function responseData<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? "The request could not be completed.");
  return body?.data as T;
}

export function GenerationStudio({ kind, data }: { kind: Kind; data: WorkspaceSnapshot }) {
  const router = useRouter();
  const availableModels = data.models.filter((model) => model.kind === kind);
  const [modelId, setModelId] = useState(availableModels[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [size, setSize] = useState("1024x1024");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("1280x720");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateError, setEstimateError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const pendingKey = useRef<string | null>(null);
  const copy = labels[kind];
  const Icon = kind === "image" ? ImageIcon : kind === "video" ? Video : Globe2;

  useEffect(() => {
    if (!modelId || !prompt.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await responseData<{ estimatedCredits: number }>(await fetch("/api/v1/catalog/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, modelId, prompt, maxOutputTokens: kind === "website" ? 5000 : undefined }), signal: controller.signal }));
        setEstimate(result.estimatedCredits); setEstimateError("");
      } catch (reason) { if (!controller.signal.aborted) { setEstimate(null); setEstimateError(reason instanceof Error ? reason.message : "Estimate unavailable"); } }
    }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, modelId, prompt]);

  async function pollJob(id: string) {
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const job = await responseData(await fetch(`/api/v1/generations/${id}`, { cache: "no-store" })) as Job;
      setCurrentJob(job);
      if (terminal.has(job.status)) { router.refresh(); return job; }
    }
    return null;
  }

  async function submit() {
    if (!prompt.trim() || !modelId || (kind === "website" && name.trim().length < 2)) { setError("Complete the required fields before generating."); return; }
    setBusy(true); setError("");
    const idempotencyKey = pendingKey.current ?? crypto.randomUUID(); pendingKey.current = idempotencyKey;
    try {
      const payload = { kind, modelId, prompt, idempotencyKey, ...(kind === "image" ? { aspectRatio, size } : {}), ...(kind === "video" ? { aspectRatio, duration, resolution, generateAudio } : {}), ...(kind === "website" ? { name } : {}) };
      const created = await responseData<{ id: string; status: Job["status"]; estimatedCredits: number }>(await fetch("/api/v1/generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
      pendingKey.current = null;
      setRetrying(false);
      setCurrentJob({ id: created.id, kind, modelId, status: created.status, result: null, errorCode: null, createdAt: new Date(), updatedAt: new Date(), estimatedCredits: created.estimatedCredits, actualCredits: null });
      await pollJob(created.id);
    } catch (reason) {
      if (pendingKey.current) {
        setRetrying(true);
        setError(`${reason instanceof Error ? reason.message : "Generation failed"} If the submission response was lost, retry this same request; do not create a new request deliberately.`);
      } else {
        setError("The job was created, but status polling was interrupted. Open History to check it; do not submit a replacement solely for a polling error.");
      }
    } finally { setBusy(false); }
  }

  const assets = data.assets.filter((asset) => asset.kind === kind);
  return <>
    <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
    <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]"><Panel className="xl:sticky xl:top-24"><div className="space-y-5">
      {kind === "website" && <div><label htmlFor="website-name" className="mb-2 block text-sm font-semibold">Website name</label><input id="website-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" placeholder="My studio website" /></div>}
      <div><div className="mb-2 flex justify-between"><label htmlFor={`${kind}-prompt`} className="text-sm font-semibold">{kind === "website" ? "Website brief" : "Prompt"}</label><span className="text-[11px] text-muted">{prompt.length}/{kind === "website" ? "8,000" : "16,000"}</span></div><textarea id={`${kind}-prompt`} value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={kind === "website" ? 8000 : 16000} rows={7} className="w-full resize-y rounded-xl border border-line px-3.5 py-3 text-sm leading-6 outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder={kind === "website" ? "Describe the audience, pages, visual direction and content…" : "Describe the subject, setting and mood…"} /></div>
      <div><label htmlFor={`${kind}-model`} className="mb-2 block text-sm font-semibold">Enabled model</label><select id={`${kind}-model`} value={modelId} onChange={(event) => setModelId(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">{availableModels.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.provider}</option>)}</select></div>
      {kind !== "website" && <div><label htmlFor={`${kind}-ratio`} className="mb-2 block text-xs font-semibold">Aspect ratio</label><select id={`${kind}-ratio`} value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">{["16:9", "1:1", "9:16", "4:3", "3:4"].map((value) => <option key={value}>{value}</option>)}</select></div>}
      {kind === "image" && <div><label htmlFor="image-size" className="mb-2 block text-xs font-semibold">Requested size</label><select id="image-size" value={size} onChange={(event) => setSize(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">{["1024x1024", "1344x768", "768x1344"].map((value) => <option key={value}>{value}</option>)}</select></div>}
      {kind === "video" && <><div className="grid grid-cols-2 gap-3"><div><label htmlFor="video-duration" className="mb-2 block text-xs font-semibold">Duration (seconds)</label><input id="video-duration" type="number" min={1} max={30} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /></div><div><label htmlFor="video-resolution" className="mb-2 block text-xs font-semibold">Resolution</label><select id="video-resolution" value={resolution} onChange={(event) => setResolution(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"><option>1280x720</option><option>1920x1080</option><option>720x1280</option></select></div></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={generateAudio} onChange={(event) => setGenerateAudio(event.target.checked)} className="size-4 accent-teal" />Generate audio when supported</label></>}
      <div className="rounded-2xl bg-soft p-4 text-sm"><div className="flex justify-between"><span className="text-body">Server estimate</span><strong>{!prompt.trim() || estimate === null ? "—" : `${estimate.toLocaleString()} credits`}</strong></div><p className="mt-2 text-[11px] leading-5 text-muted">A hold is created at submission. Final usage is charged from actual Gateway cost, never from this estimate.</p>{estimateError && <p className="mt-2 text-xs text-error">{estimateError}</p>}</div>
      {error && <p role="alert" className="text-sm leading-6 text-error">{error}</p>}
      <Button type="button" size="lg" className="w-full" onClick={() => void submit()} disabled={busy || !availableModels.length}><Sparkles />{busy ? "Processing…" : retrying ? "Retry same request" : copy.action}</Button>
      {!availableModels.length && <p className="text-center text-xs text-error">No enabled, currently priced {kind} model is available.</p>}
    </div></Panel>
    <div className="min-w-0 space-y-6">{currentJob && <Panel><div className="flex items-center gap-3"><LoaderCircle className={`size-5 text-teal ${terminal.has(currentJob.status) ? "" : "animate-spin"}`} /><div><h2 className="font-semibold capitalize">Job {currentJob.status.replaceAll("_", " ")}</h2><p className="mt-1 text-xs text-muted">{currentJob.id} · {currentJob.actualCredits ?? currentJob.estimatedCredits ?? "—"} {currentJob.actualCredits === null ? "estimated" : "actual"} credits</p></div></div>{currentJob.status === "reconciliation_required" && <InlineNotice title="Reconciliation required" tone="warning">Automatic submission retries and hold release are blocked while actual usage is reviewed.</InlineNotice>}{typeof currentJob.result?.projectId === "string" && <Button asChild className="mt-4"><Link href={`/app/websites/${currentJob.result.projectId}/editor`}>Open website project<ArrowUpRight /></Link></Button>}</Panel>}
      <section><h2 className="mb-4 text-xl font-semibold">Your {kind} assets</h2>{assets.length ? <div className="grid gap-4 sm:grid-cols-2">{assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-3xl border border-line bg-white">{kind === "image" ? <div className="relative aspect-[4/3] bg-subtle"><Image unoptimized src={asset.downloadPath} alt={asset.fileName} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" /></div> : kind === "video" ? <video controls preload="metadata" src={asset.downloadPath} className="aspect-video w-full bg-black" aria-label={asset.fileName} /> : <div className="grid aspect-[4/3] place-items-center bg-subtle"><Globe2 className="size-10 text-teal" /></div>}<div className="p-4"><h3 className="truncate text-sm font-semibold">{asset.fileName}</h3><p className="mt-1 text-xs text-muted">{Math.ceil(asset.sizeBytes / 1024).toLocaleString()} KiB · {asset.mimeType}</p><Button asChild variant="ghost" size="sm" className="mt-2"><a href={asset.downloadPath}><Download />Download</a></Button></div></article>)}</div> : <EmptyState title={`No ${kind} assets yet`} description="Completed assets owned by your account will appear here." icon={<Icon />} />}</section>
      <Panel><h2 className="mb-4 text-lg font-semibold">Recent jobs</h2>{data.jobs.filter((job) => job.kind === kind).length ? <ul className="divide-y divide-line">{data.jobs.filter((job) => job.kind === kind).slice(0, 10).map((job) => <li key={job.id} className="flex items-center gap-3 py-3"><FileText className="size-4 text-muted" /><div className="min-w-0 flex-1"><p className="truncate text-xs">{job.id}</p><p className="mt-1 text-[11px] text-muted">{job.modelId}</p></div><span className="text-xs capitalize">{job.status.replaceAll("_", " ")}</span></li>)}</ul> : <p className="text-sm text-muted">No jobs have been submitted.</p>}</Panel>
    </div></div>
  </>;
}
