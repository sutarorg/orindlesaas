"use client";

import { ArrowRight, Check, FileText, Globe2, LayoutTemplate, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EstimatePanel } from "@/components/dashboard/estimate-panel";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ActionFeedback, DemoBadge, PageHeader, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, GenerationIntentWebsite } from "@/lib/contracts/dashboard";
import { estimateGeneration } from "@/lib/dashboard/estimates";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

const availableSections = ["Hero", "Our story", "Features", "Gallery", "Testimonials", "FAQ", "Contact", "Call to action"];

export function NewWebsite() {
  const [name, setName] = useState("Stillwater Studio");
  const [brief, setBrief] = useState("A calm, editorial website for a nature-led retreat, with clear accommodation details and a simple booking enquiry path.");
  const [intent, setIntent] = useState<Omit<GenerationIntentWebsite, "brief" | "sections">>({ product: "website", modelId: "gpt-6.1-sol", siteType: "business", includeContact: true, includeFaq: false, includeSeo: true });
  const [sections, setSections] = useState(["Hero", "Our story", "Gallery", "Contact"]);
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const estimate = useMemo(() => estimateGeneration({ ...intent, brief, sections: sections.length }), [intent, brief, sections.length]);

  function toggleSection(section: string) {
    setSections((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section]);
  }

  async function create() {
    if (name.trim().length < 2) {
      setValidationError("Give the website a name of at least 2 characters.");
      return;
    }
    if (brief.trim().length < 10) {
      setValidationError("Write a brief of at least 10 characters.");
      return;
    }
    if (sections.length === 0) {
      setValidationError("Select at least one website section.");
      return;
    }
    setValidationError("");
    const response = await previewDashboardService.generate({ product: "website", modelId: intent.modelId, prompt: brief, options: { name, siteType: intent.siteType, sections: sections.join(", "), includeContact: intent.includeContact, includeFaq: intent.includeFaq, includeSeo: intent.includeSeo } });
    setResult({ ...response, message: `“${name.trim()}” was validated locally. No project, generated code, preview URL, deployment or credit deduction was created. You can continue with an existing editor fixture below.` });
  }

  return (
    <>
      <PageHeader eyebrow="Websites · New" title="Start with a clear brief" description="Define the shape of your website and review an illustrative estimate. This flow does not create a project or generate code." actions={<DemoBadge />} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <div className="space-y-6">
            <div><label htmlFor="website-name" className="mb-2 block text-sm font-semibold text-ink">Website name</label><input id="website-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
            <div><div className="mb-2 flex items-center justify-between"><label htmlFor="website-brief" className="text-sm font-semibold text-ink">Creative brief</label><span className="text-[11px] text-muted">{brief.length}/2,000</span></div><textarea id="website-brief" value={brief} onChange={(event) => setBrief(event.target.value)} maxLength={2000} rows={6} className="w-full resize-y rounded-xl border border-line bg-white px-4 py-3 text-[15px] leading-7 text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="Describe the audience, purpose, personality and essential content…" /><p className="mt-2 text-xs leading-5 text-muted">Include concrete content and avoid unverified claims. The brief remains in this browser preview.</p></div>
            <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="website-type" className="mb-2 block text-sm font-semibold text-ink">Website type</label><select id="website-type" value={intent.siteType} onChange={(event) => setIntent((current) => ({ ...current, siteType: event.target.value as GenerationIntentWebsite["siteType"] }))} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="landing">Landing page</option><option value="business">Business website</option><option value="portfolio">Portfolio</option><option value="waitlist">Waitlist</option></select></div><ModelSelector id="website-model" product="website" value={intent.modelId} onChange={(modelId) => setIntent((current) => ({ ...current, modelId }))} /></div>
            <fieldset><legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><LayoutTemplate className="size-4 text-teal" aria-hidden="true" />Sections</legend><div className="grid gap-2 sm:grid-cols-2">{availableSections.map((section) => { const checked = sections.includes(section); return <label key={section} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm font-medium transition-colors", checked ? "border-teal/30 bg-[#edf7f2] text-ink" : "border-line bg-white text-body hover:bg-soft")}><input type="checkbox" checked={checked} onChange={() => toggleSection(section)} className="peer sr-only" /><span className={cn("grid size-5 place-items-center rounded-md border", checked ? "border-teal bg-teal text-white" : "border-line bg-white text-transparent")}><Check className="size-3.5" aria-hidden="true" /></span>{section}</label>; })}</div><p className="mt-2 text-xs text-muted">{sections.length} selected · up to 8 included in this fixture estimate</p></fieldset>
            <fieldset><legend className="mb-3 text-sm font-semibold text-ink">Build options</legend><div className="grid gap-2 sm:grid-cols-3">{([{ key: "includeContact", label: "Contact form" }, { key: "includeFaq", label: "FAQ content" }, { key: "includeSeo", label: "SEO fields" }] as const).map((option) => <label key={option.key} className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 text-xs font-medium text-body"><input type="checkbox" checked={intent[option.key]} onChange={(event) => setIntent((current) => ({ ...current, [option.key]: event.target.checked }))} className="size-4 accent-teal" />{option.label}</label>)}</div></fieldset>
          </div>
        </Panel>
        <div className="space-y-4 xl:sticky xl:top-32">
          <Panel>
            <div className="mb-5 flex items-center gap-2"><FileText className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Brief summary</h2></div>
            <dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted">Type</dt><dd className="font-medium capitalize text-ink">{intent.siteType}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Sections</dt><dd className="font-medium text-ink">{sections.length}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Output</dt><dd className="text-right font-medium text-ink">Preview intent only</dd></div></dl>
            <EstimatePanel estimate={estimate} balance={workspaceFixture.wallet.balance} className="mt-5" />
            {validationError && <p role="alert" className="mt-3 text-sm font-medium text-error">{validationError}</p>}
            <Button type="button" size="lg" className="mt-4 w-full" onClick={() => void create()}><Sparkles aria-hidden="true" />Preview website creation</Button>
            <p className="mt-3 text-center text-[11px] leading-5 text-muted">No new project or website output will appear.</p>
          </Panel>
          <ActionFeedback result={result} />
          {result && <Button asChild variant="secondary" className="w-full"><Link href="/app/websites/site-stillwater/editor"><Globe2 aria-hidden="true" />Explore existing editor fixture<ArrowRight aria-hidden="true" /></Link></Button>}
        </div>
      </div>
    </>
  );
}
