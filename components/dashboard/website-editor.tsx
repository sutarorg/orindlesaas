"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Code2, Eye, LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineNotice, PageHeader, Panel } from "@/components/dashboard/ui";
import type { OwnedWebsite } from "@/lib/server/websites/projects";
import { cn } from "@/lib/utils";

export function WebsiteEditor({ website, previewDocument }: { website: OwnedWebsite; previewDocument: string }) {
  const router = useRouter();
  const [files, setFiles] = useState(website.files);
  const [active, setActive] = useState<"index.html" | "styles.css" | "script.js">("index.html");
  const [mode, setMode] = useState<"code" | "preview">("code");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const file = files.find((item) => item.path === active);

  async function save() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/v1/websites/${website.project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "The source could not be saved.");
      setMessage(`Source saved. Validation build ${body.data.buildId} is queued.`);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The source could not be saved."); }
    finally { setBusy(false); }
  }

  return <><PageHeader eyebrow="Websites · Source editor" title={website.project.name} description="Edit the validated static source. Saving creates a new source asset and isolated validation build." actions={<Button asChild variant="secondary"><a href={`/app/websites/${website.project.id}/settings`}>Project settings</a></Button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-line bg-white p-1">{(["code", "preview"] as const).map((value) => <button key={value} type="button" onClick={() => setMode(value)} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium capitalize", mode === value ? "bg-ink text-white" : "text-body hover:bg-soft")}>{value === "code" ? <Code2 className="size-4" /> : <Eye className="size-4" />}{value}</button>)}</div><Button type="button" onClick={() => void save()} disabled={busy || !files.length}><Save />{busy ? "Saving…" : "Save & validate"}</Button></div>
    {message && <div className="mb-4"><InlineNotice title="Source updated">{message}</InlineNotice></div>}{error && <p role="alert" className="mb-4 rounded-xl bg-[#fff5f3] p-3 text-sm text-error">{error}</p>}
    {mode === "preview" ? <Panel><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Eye className="size-4 text-teal" />Isolated preview</div><iframe title={`Preview of ${website.project.name}`} srcDoc={previewDocument} sandbox="allow-scripts" className="h-[680px] w-full rounded-xl border border-line bg-white" /><p className="mt-3 text-xs leading-5 text-muted">Preview runs without same-origin access, network connections, forms, or application credentials.</p></Panel> : <Panel><div className="mb-4 flex flex-wrap gap-2">{(["index.html", "styles.css", "script.js"] as const).map((path) => { const exists = files.some((item) => item.path === path); return <button key={path} type="button" disabled={!exists && path !== "script.js"} onClick={() => { if (!exists) setFiles((current) => [...current, { path, content: "// Static interactions only\n" }]); setActive(path); }} className={cn("min-h-10 rounded-lg border px-3 text-xs font-medium", active === path ? "border-teal bg-[#edf7f2] text-teal-dark" : "border-line bg-white", !exists && path !== "script.js" && "opacity-40")}>{path}{!exists ? " · add" : ""}</button>; })}</div>{file ? <><label htmlFor="website-source" className="sr-only">Edit {file.path}</label><textarea id="website-source" value={file.content} onChange={(event) => setFiles((current) => current.map((item) => item.path === active ? { ...item, content: event.target.value } : item))} spellCheck={false} className="min-h-[620px] w-full resize-y rounded-xl border border-line bg-[#101917] p-4 font-mono text-xs leading-6 text-[#e8f3ee] outline-none focus:border-teal" /></> : <p>No source is available.</p>}<p className="mt-3 text-xs leading-5 text-muted">Only local HTML, CSS and JavaScript are accepted. External scripts, iframes, network calls, dynamic code execution and inline event handlers are rejected.</p></Panel>}
    <Panel className="mt-6"><h2 className="mb-4 text-lg font-semibold">Validation builds</h2>{website.builds.length ? <ul className="divide-y divide-line">{website.builds.map((build) => <li key={build.id} className="flex items-center gap-3 py-3"><LoaderCircle className={cn("size-4 text-teal", ["queued", "building"].includes(build.status) && "animate-spin")} /><div className="min-w-0 flex-1"><p className="truncate text-xs">{build.id}</p><p className="mt-1 text-[11px] text-muted">{new Date(build.createdAt).toLocaleString()}</p></div><span className="text-xs capitalize">{build.status}</span></li>)}</ul> : <p className="text-sm text-muted">No builds have run yet.</p>}</Panel>
  </>;
}
