import { ArrowRight, ExternalLink, Globe2, Plus, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DemoBadge, PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { workspaceFixture } from "@/lib/dashboard/fixtures";

export function WebsitesOverview() {
  return (
    <>
      <PageHeader eyebrow="Create · fixture workspace" title="Websites" description="Shape a focused brief, refine a structured local preview and inspect editable code as text. No website is generated, saved or deployed in this demo." actions={<><DemoBadge /><Button asChild><Link href="/app/websites/new"><Plus aria-hidden="true" />New website</Link></Button></>} />
      <div className="mb-6 rounded-3xl border border-teal/10 bg-[#edf7f2] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-teal shadow-sm"><Globe2 className="size-5" aria-hidden="true" /></span><div><h2 className="text-lg font-semibold tracking-[-0.025em]">From idea to a coherent first direction</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-body">Use the creation flow to validate a brief locally, or open an existing fixture to explore pages, sections, code and responsive previews.</p></div></div><Button asChild variant="secondary" className="shrink-0"><Link href="/app/websites/new">Plan a website<ArrowRight aria-hidden="true" /></Link></Button></div>
      </div>
      <section aria-labelledby="website-projects-heading">
        <div className="mb-4 flex items-end justify-between"><div><h2 id="website-projects-heading" className="text-xl font-semibold tracking-[-0.03em]">Website projects</h2><p className="mt-1 text-sm text-body">Two illustrative projects, one shared workspace.</p></div><span className="text-xs font-medium text-muted">{workspaceFixture.websites.length} fixtures</span></div>
        <div className="grid gap-5 lg:grid-cols-2">
          {workspaceFixture.websites.map((website) => (
            <article key={website.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_1px_2px_rgba(21,25,24,0.02)]">
              <Link href={`/app/websites/${website.id}/editor`} className="group relative block aspect-[16/9] overflow-hidden bg-subtle" aria-label={`Open ${website.name} editor`}><Image src={website.previewImage} alt={website.previewImageAlt} fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" /><div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><span className="mb-2 inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-teal-dark backdrop-blur">Local preview fixture</span><p className="font-display text-2xl font-medium tracking-[-0.04em] text-white">{website.previewHeadline}</p></div></Link>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="mb-2 flex items-center gap-2"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${website.publishStatus === "published" ? "border-teal/15 bg-[#edf8f2] text-teal-dark" : "border-line bg-soft text-body"}`}>{website.publishStatus === "published" ? "Published status fixture" : "Unpublished fixture"}</span></div><h3 className="text-xl font-semibold tracking-[-0.03em]">{website.name}</h3></div><Globe2 className="size-5 text-muted" aria-hidden="true" /></div>
                <p className="mt-2 text-sm leading-6 text-body">{website.description}</p>
                <p className="mt-3 text-[11px] text-muted">Updated {website.updatedLabel} · No live URL or deployment</p>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4"><Button asChild size="sm"><Link href={`/app/websites/${website.id}/editor`}>Open editor<ArrowRight aria-hidden="true" /></Link></Button><Button asChild size="sm" variant="secondary"><Link href={`/app/websites/${website.id}/settings`}><Settings2 aria-hidden="true" />Settings</Link></Button><Button asChild size="sm" variant="ghost"><Link href={`/app/websites/${website.id}/editor#preview`}><ExternalLink aria-hidden="true" />Local preview</Link></Button></div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {["Brief and estimate", "Structured preview and code", "Publish intent without deployment"].map((title, index) => <div key={title} className="rounded-2xl border border-line bg-white p-4"><span className="text-xs font-semibold text-teal">0{index + 1}</span><h3 className="mb-1 mt-2 text-sm font-semibold">{title}</h3><p className="text-xs leading-5 text-body">{index === 0 ? "Configure pages and sections with an explicitly illustrative credit estimate." : index === 1 ? "Edit local content and code text without executing untrusted markup." : "Review publishing controls while keeping every operation unavailable and honest."}</p></div>)}
      </div>
    </>
  );
}
