"use client";

import { ArrowLeft, ExternalLink, Globe2, Save, Search, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionFeedback, DemoBadge, InlineNotice, PageHeader, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, WebsiteProject } from "@/lib/contracts/dashboard";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";

export function WebsiteSettings({ website }: { website: WebsiteProject }) {
  const [name, setName] = useState(website.name);
  const [description, setDescription] = useState(website.description);
  const [slug, setSlug] = useState(website.id.replace(/^site-/, ""));
  const [seoTitle, setSeoTitle] = useState(`${website.name} · ${website.previewHeadline}`);
  const [seoDescription, setSeoDescription] = useState(website.previewDescription);
  const [visibility, setVisibility] = useState("private");
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");

  async function save() {
    if (name.trim().length < 2) {
      setValidationError("Enter a website name of at least 2 characters.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setValidationError("Use lowercase letters, numbers and single hyphens for the local slug.");
      return;
    }
    setValidationError("");
    const response = await previewDashboardService.updateSettings({ section: "website", values: { projectId: website.id, name, description, slug, seoTitle, seoDescription, visibility } });
    setResult({ ...response, message: "Website settings were validated locally. No name, slug, SEO field, visibility setting or project record was saved." });
  }

  async function publish() {
    const response = await previewDashboardService.publishWebsite({ projectId: website.id });
    setResult({ ...response, status: "unavailable", message: "No deployment or preview URL service is connected. The illustrative publish status and URL remain unchanged." });
  }

  return (
    <>
      <PageHeader eyebrow="Websites · Project settings" title={`${website.name} settings`} description="Review general, search and publishing controls for this website fixture. Every save and publish action is non-persistent." actions={<><DemoBadge /><Button asChild variant="secondary"><Link href={`/app/websites/${website.id}/editor`}><ArrowLeft aria-hidden="true" />Back to editor</Link></Button></>} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel>
            <div className="mb-5 flex items-center gap-2"><Globe2 className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">General</h2></div>
            <div className="space-y-5"><div><label htmlFor="settings-site-name" className="mb-2 block text-sm font-semibold text-ink">Website name</label><input id="settings-site-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><div><label htmlFor="settings-site-description" className="mb-2 block text-sm font-semibold text-ink">Project description</label><textarea id="settings-site-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={3} className="w-full resize-y rounded-xl border border-line px-4 py-3 text-sm leading-6 text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><div><label htmlFor="settings-site-slug" className="mb-2 block text-sm font-semibold text-ink">Local URL slug</label><div className="flex min-h-12 items-center rounded-xl border border-line focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/15"><span className="pl-4 text-sm text-muted">orindle.local/</span><input id="settings-site-slug" value={slug} onChange={(event) => setSlug(event.target.value)} maxLength={60} className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-ink outline-none" /></div><p className="mt-2 text-xs text-muted">A display field only. No DNS, domain or route is created.</p></div></div>
          </Panel>
          <Panel>
            <div className="mb-5 flex items-center gap-2"><Search className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Search presentation</h2></div>
            <div className="space-y-5"><div><label htmlFor="settings-seo-title" className="mb-2 block text-sm font-semibold text-ink">SEO title</label><input id="settings-seo-title" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={100} className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><div><label htmlFor="settings-seo-description" className="mb-2 block text-sm font-semibold text-ink">SEO description</label><textarea id="settings-seo-description" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} maxLength={240} rows={4} className="w-full resize-y rounded-xl border border-line px-4 py-3 text-sm leading-6 text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><InlineNotice title="Metadata fixture">These fields are not applied to the workspace metadata or any published website.</InlineNotice></div>
          </Panel>
        </div>
        <div className="space-y-4 xl:sticky xl:top-32">
          <Panel>
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.025em]">Publishing</h2>
            <label htmlFor="site-visibility" className="mb-2 block text-sm font-semibold text-ink">Preview visibility</label><select id="site-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value)} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="private">Private · planned</option><option value="unlisted">Unlisted · planned</option></select>
            <div className="my-5 rounded-2xl bg-soft p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Current fixture</p><p className="mt-2 text-sm font-semibold capitalize text-ink">{website.publishStatus} status</p><p className="mt-1 text-xs leading-5 text-body">Preview URL: not assigned. No deployed output exists.</p></div>
            <Button type="button" variant="secondary" className="w-full" onClick={() => void publish()}><ExternalLink aria-hidden="true" />Request preview URL</Button>
            <Button type="button" className="mt-2 w-full" onClick={() => void publish()}><UploadCloud aria-hidden="true" />Publish preview</Button>
          </Panel>
          {validationError && <p role="alert" className="rounded-2xl border border-error/20 bg-[#fff5f3] p-4 text-sm font-medium text-error">{validationError}</p>}
          <ActionFeedback result={result} />
          <Button type="button" size="lg" className="w-full" onClick={() => void save()}><Save aria-hidden="true" />Save settings preview</Button>
        </div>
      </div>
    </>
  );
}
