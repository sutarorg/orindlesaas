"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ExternalLink, Rocket, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineNotice, PageHeader, Panel } from "@/components/dashboard/ui";
import type { OwnedWebsite } from "@/lib/server/websites/projects";

export function WebsiteSettings({ website }: { website: OwnedWebsite }) {
  const router = useRouter();
  const [name, setName] = useState(website.project.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [deploymentMessage, setDeploymentMessage] = useState("");
  const deploymentKey = useRef<string | null>(null);
  const canDeploy = website.builds.some((build) => build.status === "passed" && build.sourceSha256 === website.currentSourceSha256);
  async function deployPreview() {
    setBusy(true); setError(""); setDeploymentMessage("");
    deploymentKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch(`/api/v1/websites/${website.project.id}/deployments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "preview", idempotencyKey: deploymentKey.current }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "The preview deployment could not be queued.");
      deploymentKey.current = null;
      setDeploymentMessage("Preview deployment accepted. Its provider status will appear here as it progresses; no production domain has been changed.");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Deployment request failed"); }
    finally { setBusy(false); }
  }
  async function rename() {
    setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch(`/api/v1/websites/${website.project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "The project could not be renamed.");
      setSaved(true); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Rename failed"); }
    finally { setBusy(false); }
  }
  return <><PageHeader eyebrow="Websites · Settings" title={website.project.name} description="Manage the real project record and inspect its validation and deployment history." actions={<Button asChild variant="secondary"><Link href={`/app/websites/${website.project.id}/editor`}>Open editor</Link></Button>} />
    <div className="grid gap-6 lg:grid-cols-2"><Panel><h2 className="mb-4 text-lg font-semibold">Project details</h2><label htmlFor="project-name" className="mb-2 block text-sm font-semibold">Name</label><input id="project-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /><p className="mt-3 text-xs text-muted">Slug: {website.project.slug}</p><p className="mt-1 text-xs capitalize text-muted">Status: {website.project.status}</p><Button type="button" className="mt-5" onClick={() => void rename()} disabled={busy || name.trim().length < 2}><Save />{busy ? "Saving…" : "Save name"}</Button>{saved && <div className="mt-4"><InlineNotice title="Project renamed">The database record has been updated.</InlineNotice></div>}{error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}</Panel>
      <Panel><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Deployment history</h2><Button type="button" size="sm" onClick={() => void deployPreview()} disabled={busy || !canDeploy} title={canDeploy ? "Deploy the validated source to a scoped Vercel preview" : "Save and pass validation for the current source first"}><Rocket />Deploy preview</Button></div>{!canDeploy && <p className="mb-4 text-xs leading-5 text-muted">The current saved source needs a passing validation build before preview deployment.</p>}{deploymentMessage && <div className="mb-4"><InlineNotice title="Deployment queued">{deploymentMessage}</InlineNotice></div>}{website.deployments.length ? <ul className="divide-y divide-line">{website.deployments.map((deployment) => <li key={deployment.id} className="py-3"><div className="flex justify-between gap-3"><span className="text-sm font-semibold capitalize">{deployment.target}</span><span className="text-xs capitalize">{deployment.status}</span></div>{deployment.url && <a href={deployment.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 break-all text-xs text-teal-dark">{deployment.url}<ExternalLink className="size-3 shrink-0" /></a>}<p className="mt-1 text-[11px] text-muted">{new Date(deployment.createdAt).toLocaleString()}</p></li>)}</ul> : <p className="text-sm leading-6 text-muted">No Vercel deployments have been created. A passing validation build is required before deployment.</p>}</Panel></div>
    <Panel className="mt-6"><h2 className="mb-4 text-lg font-semibold">Latest validation</h2>{website.builds[0] ? <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted">Build ID</dt><dd className="mt-1 break-all font-mono text-xs">{website.builds[0].id}</dd></div><div><dt className="text-muted">Status</dt><dd className="mt-1 capitalize">{website.builds[0].status}</dd></div><div><dt className="text-muted">Source SHA-256</dt><dd className="mt-1 break-all font-mono text-xs">{website.builds[0].sourceSha256}</dd></div></dl> : <p className="text-sm text-muted">No validation build is recorded.</p>}</Panel>
  </>;
}
