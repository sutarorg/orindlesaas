"use client";

import {
  Bot,
  Braces,
  Check,
  ChevronRight,
  Code2,
  ExternalLink,
  FileText,
  Laptop,
  LayoutPanelTop,
  Monitor,
  RotateCcw,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Tablet,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ActionFeedback, DemoBadge, InlineNotice, PageHeader } from "@/components/dashboard/ui";
import { WebsitePreview, type PreviewViewport } from "@/components/dashboard/website-preview";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, WebsiteProject } from "@/lib/contracts/dashboard";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

type EditorPanel = "content" | "ai" | "code";

export function WebsiteEditor({ website }: { website: WebsiteProject }) {
  const [selectedPage, setSelectedPage] = useState("Home");
  const [selectedSection, setSelectedSection] = useState("Hero");
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [panel, setPanel] = useState<EditorPanel>("content");
  const [headline, setHeadline] = useState(website.previewHeadline);
  const [description, setDescription] = useState(website.previewDescription);
  const [code, setCode] = useState(website.code);
  const [aiPrompt, setAiPrompt] = useState("Make the hero feel quieter and more specific to the landscape.");
  const [modelId, setModelId] = useState("gpt-6.1-sol");
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);

  function editHeadline(value: string) { setHeadline(value); setDirty(true); }
  function editDescription(value: string) { setDescription(value); setDirty(true); }
  function editCode(value: string) { setCode(value); setDirty(true); }

  async function save() {
    const response = await previewDashboardService.saveWebsite({ projectId: website.id, code, headline });
    setResult({ ...response, message: "Local edits were validated, but nothing was saved. The structured preview and code text remain only in this open browser view." });
  }

  async function publish() {
    const response = await previewDashboardService.publishWebsite({ projectId: website.id });
    setResult({ ...response, status: "unavailable", message: "Publish and preview URLs are not connected. No deployment started, no published output changed and no URL was assigned." });
  }

  async function aiEdit() {
    if (aiPrompt.trim().length < 3) {
      setResult({ status: "unavailable", persisted: false, creditsChanged: 0, message: "Write a more specific local edit instruction before validating this preview." });
      return;
    }
    const response = await previewDashboardService.generate({ product: "website", modelId, prompt: aiPrompt, options: { targetPage: selectedPage, targetSection: selectedSection, headline } });
    setResult({ ...response, status: "unavailable", message: "No AI edit was generated or applied. Your structured preview, code text and credits are unchanged." });
  }

  function reset() {
    setHeadline(website.previewHeadline);
    setDescription(website.previewDescription);
    setCode(website.code);
    setDirty(false);
    setResult({ status: "preview", persisted: false, creditsChanged: 0, message: "Local content and code text were reset to the original fixture. No stored project changed." });
  }

  return (
    <>
      <PageHeader eyebrow="Websites · Local editor" title={website.name} description="Edit structured content, inspect generated-code text and test the actual preview width. Code is never executed and publishing is not connected." actions={<><DemoBadge /><Button asChild variant="secondary"><Link href={`/app/websites/${website.id}/settings`}><Settings2 aria-hidden="true" />Settings</Link></Button><Button type="button" variant="secondary" onClick={() => void save()}><Save aria-hidden="true" />Save preview</Button><Button type="button" onClick={() => void publish()}><UploadCloud aria-hidden="true" />Publish preview</Button></>} />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><span className="flex items-center gap-2 font-medium text-body"><span className={cn("size-2 rounded-full", dirty ? "bg-[#b87a16]" : "bg-teal")} aria-hidden="true" />{dirty ? "Unsaved local edits" : "Original local fixture"}</span><span className="text-muted">{website.publishStatus === "published" ? "Published status fixture" : "Unpublished fixture"} · no live deployment</span></div>
        <div className="flex items-center gap-2 text-muted"><ExternalLink className="size-3.5" aria-hidden="true" /><span>Preview URL: <strong className="font-medium text-body">not assigned</strong></span><button type="button" onClick={() => void publish()} className="min-h-8 rounded-lg px-2 font-semibold text-teal-dark hover:bg-soft">Request preview</button></div>
      </div>
      <ActionFeedback result={result} />

      <div className="mt-5 grid items-start gap-5 2xl:grid-cols-[210px_minmax(0,1fr)_340px]">
        <aside className="rounded-3xl border border-line bg-white p-4" aria-label="Website structure">
          <div className="mb-3 flex items-center gap-2 px-1"><LayoutPanelTop className="size-4 text-teal" aria-hidden="true" /><h2 className="text-sm font-semibold">Structure</h2></div>
          <div className="mb-5"><p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Pages</p><ul className="grid grid-cols-2 gap-1 sm:grid-cols-4 2xl:grid-cols-1">{website.pages.map((page) => <li key={page}><button type="button" onClick={() => { setSelectedPage(page); if (page !== "Home") setSelectedSection(""); }} aria-pressed={selectedPage === page} className={cn("flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-xs font-medium transition-colors", selectedPage === page ? "bg-[#eaf6f0] text-teal-dark" : "text-body hover:bg-soft")}><span className="flex items-center gap-2"><FileText className="size-3.5" aria-hidden="true" />{page}</span>{selectedPage === page && <ChevronRight className="hidden size-3.5 2xl:block" aria-hidden="true" />}</button></li>)}</ul></div>
          <div><p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Home sections</p><ul className="grid grid-cols-2 gap-1 sm:grid-cols-4 2xl:grid-cols-1">{website.sections.map((section) => <li key={section}><button type="button" onClick={() => { setSelectedPage("Home"); setSelectedSection(section); }} aria-pressed={selectedPage === "Home" && selectedSection === section} className={cn("min-h-10 w-full rounded-xl px-3 text-left text-xs font-medium transition-colors", selectedPage === "Home" && selectedSection === section ? "bg-[#eaf6f0] text-teal-dark" : "text-body hover:bg-soft")}>{section}</button></li>)}</ul></div>
          <p className="mt-4 border-t border-line px-1 pt-3 text-[10px] leading-4 text-muted">Selecting a page or section changes only this local structured preview.</p>
        </aside>

        <section id="preview" className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white scroll-mt-36" aria-labelledby="preview-heading">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="preview-heading" className="text-sm font-semibold">Structured preview</h2><p className="mt-0.5 text-[10px] text-muted">Live local fields · code not executed</p></div><div className="flex w-fit items-center rounded-xl bg-subtle p-1" role="group" aria-label="Preview viewport">{([{ id: "desktop", label: "Desktop", icon: Monitor }, { id: "tablet", label: "Tablet", icon: Tablet }, { id: "mobile", label: "Mobile", icon: Smartphone }] as const).map((item) => <button key={item.id} type="button" onClick={() => setViewport(item.id)} aria-pressed={viewport === item.id} aria-label={`${item.label} preview`} className={cn("grid size-9 place-items-center rounded-lg transition-colors", viewport === item.id ? "bg-white text-teal shadow-sm" : "text-muted hover:text-ink")}><item.icon className="size-4" aria-hidden="true" /></button>)}</div></div>
          <div className="h-[620px] overflow-y-auto overflow-x-hidden sm:h-[700px]" tabIndex={0} aria-label="Scrollable website preview"><WebsitePreview website={website} headline={headline} description={description} selectedPage={selectedPage} selectedSection={selectedSection} viewport={viewport} /></div>
          <div className="flex flex-col gap-2 border-t border-line px-4 py-3 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between"><span>{viewport === "desktop" ? "Fluid desktop" : viewport === "tablet" ? "Maximum 768px" : "Maximum 390px"} · actual content reflow</span><span>Preview ≠ code output ≠ published site</span></div>
        </section>

        <aside className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white" aria-label="Website editing panels">
          <div className="grid grid-cols-3 border-b border-line bg-[#fbfcfb] p-1.5" role="tablist" aria-label="Editor panel">{([{ id: "content", label: "Content", icon: FileText }, { id: "ai", label: "AI edit", icon: Sparkles }, { id: "code", label: "Code", icon: Code2 }] as const).map((item) => <button key={item.id} type="button" role="tab" id={`panel-tab-${item.id}`} aria-selected={panel === item.id} aria-controls={`editor-panel-${item.id}`} onClick={() => setPanel(item.id)} className={cn("flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-colors", panel === item.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}><item.icon className="size-3.5" aria-hidden="true" />{item.label}</button>)}</div>
          <div id={`editor-panel-${panel}`} role="tabpanel" aria-labelledby={`panel-tab-${panel}`} className="p-4">
            {panel === "content" && <div className="space-y-5"><InlineNotice title="Structured content fields">These fields update the local preview. They do not rewrite the code draft or published output.</InlineNotice><div><div className="mb-2 flex justify-between"><label htmlFor="editor-headline" className="text-xs font-semibold text-ink">Hero headline</label><span className="text-[10px] text-muted">{headline.length}/100</span></div><textarea id="editor-headline" value={headline} onChange={(event) => editHeadline(event.target.value)} maxLength={100} rows={3} className="w-full resize-y rounded-xl border border-line px-3 py-2.5 text-sm leading-6 text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><div><div className="mb-2 flex justify-between"><label htmlFor="editor-description" className="text-xs font-semibold text-ink">Hero description</label><span className="text-[10px] text-muted">{description.length}/240</span></div><textarea id="editor-description" value={description} onChange={(event) => editDescription(event.target.value)} maxLength={240} rows={5} className="w-full resize-y rounded-xl border border-line px-3 py-2.5 text-sm leading-6 text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><Button type="button" variant="secondary" className="w-full" onClick={() => void save()}><Save aria-hidden="true" />Validate local edits</Button><Button type="button" variant="ghost" size="sm" className="w-full" onClick={reset}><RotateCcw aria-hidden="true" />Reset local fixture</Button></div>}
            {panel === "ai" && <div className="space-y-5"><InlineNotice title="AI-edit intent only" tone="warning">No model is connected. Your instruction can be validated, but no suggestion will be generated or applied.</InlineNotice><div><label htmlFor="ai-edit-prompt" className="mb-2 block text-xs font-semibold text-ink">Edit instruction</label><textarea id="ai-edit-prompt" value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} rows={5} maxLength={1200} className="w-full resize-y rounded-xl border border-line px-3 py-2.5 text-sm leading-6 text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /><p className="mt-2 text-[10px] text-muted">Target: {selectedPage}{selectedSection ? ` · ${selectedSection}` : ""}</p></div><ModelSelector id="editor-ai-model" product="website" value={modelId} onChange={setModelId} /><Button type="button" className="w-full" onClick={() => void aiEdit()}><Bot aria-hidden="true" />Preview AI edit</Button></div>}
            {panel === "code" && <div className="space-y-4"><InlineNotice title="Generated-code fixture · text only">This editable code is a local fixture. It is not executed, synced with structured fields or deployed.</InlineNotice><div><label htmlFor="website-code" className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink"><Braces className="size-4 text-teal" aria-hidden="true" />HTML draft</label><textarea id="website-code" value={code} onChange={(event) => editCode(event.target.value)} spellCheck={false} rows={18} className="w-full resize-y rounded-xl bg-[#14211e] p-3.5 font-mono text-[11px] leading-5 text-[#e9f5ef] outline-none focus:ring-2 focus:ring-teal/40" /></div><p className="text-[10px] leading-4 text-muted">No arbitrary HTML, script or style is injected into the preview.</p><Button type="button" variant="secondary" className="w-full" onClick={() => void save()}><Check aria-hidden="true" />Validate code text</Button></div>}
          </div>
        </aside>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-xs leading-5 text-muted"><Laptop className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" /><p><strong className="font-semibold text-ink">Three distinct outputs:</strong> the structured preview uses local fields; the generated-code fixture remains text; published status is illustrative and has no deployed output.</p></div>
    </>
  );
}
