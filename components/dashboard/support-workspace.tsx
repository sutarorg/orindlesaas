"use client";

import { ArrowRight, BookOpen, CircleHelp, Coins, ExternalLink, Globe2, Image as ImageIcon, Mail, MessagesSquare, Search, Video, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DemoBadge, EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { searchMatches } from "@/lib/dashboard/format";

const topics: { title: string; description: string; keywords: string; href: string; icon: LucideIcon }[] = [
  { title: "Chat and creative briefs", description: "Explore conversations, attachments, safe message rendering and model selection.", keywords: "chat conversation model auto composer markdown attachment", href: "/app/chat", icon: MessagesSquare },
  { title: "Image direction and assets", description: "Learn about prompts, reference names, ratios, estimates and fixture downloads.", keywords: "image studio prompt reference ratio resolution library download", href: "/app/image-studio", icon: ImageIcon },
  { title: "Video jobs and storyboards", description: "Understand text/image modes, static job progress and storyboard-only previews.", keywords: "video jobs queue processing failed retry playback storyboard", href: "/app/video-studio", icon: Video },
  { title: "Website editing and publishing", description: "Work with briefs, pages, sections, code text and responsive local previews.", keywords: "website editor code publish preview url settings deploy", href: "/app/websites", icon: Globe2 },
];

const faqs = [
  { question: "Is this a real customer account?", answer: "No. The entire /app area is a labelled demo workspace with local fixtures. There is no verified session, private customer record or live synchronization. A visible dashboard is not route protection." },
  { question: "Why didn’t my prompt generate anything?", answer: "That is intentional in this frontend stage. Generation controls validate your input and explain the no-operation result. No AI provider, job queue, upload or credit deduction is connected." },
  { question: "Can I download the images I see?", answer: "The locally generated JPG fixtures can be downloaded from Image Studio or Library. Video jobs include storyboard stills only, and document or website fixtures may not have downloadable production files." },
  { question: "Are credit packs and transactions real?", answer: "No. Creator, Pro and Studio show the exact planned one-time pack pricing, but purchase buttons never open checkout. Wallet entries are fictional, clearly labelled ledger fixtures—not receipts or actual deductions." },
  { question: "Does the website editor publish my code?", answer: "No. Structured fields, editable code text and published status are separate. Code is never executed, and publish or preview-URL controls do not deploy or assign a URL." },
  { question: "What happens to settings and deletion requests?", answer: "They remain local validation previews. No profile, preference, connection, session or account deletion mutation occurs. A future backend must verify identity and permissions before any real operation." },
];

export function SupportWorkspace() {
  const [query, setQuery] = useState("");
  const filteredTopics = topics.filter((topic) => searchMatches([topic.title, topic.description, topic.keywords], query));
  const filteredFaqs = faqs.filter((faq) => searchMatches([faq.question, faq.answer], query));

  return (
    <>
      <PageHeader eyebrow="Account · guidance" title="Help & Support" description="Find your way around the demo workspace, understand its trust boundaries and open the available public resources." actions={<><DemoBadge /><Button asChild variant="secondary"><Link href="/contact"><Mail aria-hidden="true" />Public contact page</Link></Button></>} />
      <section className="rounded-[28px] border border-teal/10 bg-[#eaf5ef] px-6 py-8 text-center sm:px-8">
        <CircleHelp className="mx-auto mb-4 size-8 text-teal" aria-hidden="true" /><h2 className="text-2xl font-semibold tracking-[-0.035em]">What do you need help with?</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-body">Search product guidance and answers about fixtures, credits, downloads and publishing.</p><div className="relative mx-auto mt-6 max-w-2xl"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" /><label htmlFor="support-search" className="sr-only">Search help and support</label><input id="support-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help topics…" className="min-h-14 w-full rounded-2xl border border-white bg-white pl-12 pr-4 text-[15px] text-ink shadow-[0_8px_25px_rgba(7,95,81,0.07)] outline-none focus:ring-2 focus:ring-teal/25" /></div>
      </section>

      <section aria-labelledby="product-guides-heading" className="mt-8"><div className="mb-4 flex items-end justify-between"><div><h2 id="product-guides-heading" className="text-xl font-semibold tracking-[-0.03em]">Product guides</h2><p className="mt-1 text-sm text-body">Jump into a workspace with context.</p></div></div>{filteredTopics.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{filteredTopics.map((topic) => <Link key={topic.title} href={topic.href} className="group flex min-h-52 flex-col rounded-3xl border border-line bg-white p-5 transition-[border-color,box-shadow] hover:border-teal/25 hover:shadow-[0_12px_30px_rgba(21,25,24,0.05)]"><span className="mb-5 grid size-11 place-items-center rounded-2xl bg-[#eaf6f0] text-teal"><topic.icon className="size-5" aria-hidden="true" /></span><h3 className="text-base font-semibold tracking-[-0.02em]">{topic.title}</h3><p className="mt-2 text-sm leading-6 text-body">{topic.description}</p><span className="mt-auto flex items-center gap-1 pt-4 text-xs font-semibold text-teal-dark">Open workspace<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span></Link>)}</div> : <EmptyState title="No product guides match" description="Try a broader phrase or clear your search to see all four product guides." />}</section>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.75fr)]">
        <Panel><div className="mb-3"><h2 className="text-xl font-semibold tracking-[-0.03em]">Frequently asked questions</h2><p className="mt-1 text-sm text-body">Straight answers about this frontend stage.</p></div>{filteredFaqs.length ? <Accordion type="single" collapsible>{filteredFaqs.map((faq, index) => <AccordionItem key={faq.question} value={`faq-${index}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent>{faq.answer}</AccordionContent></AccordionItem>)}</Accordion> : <p className="py-8 text-center text-sm text-muted">No FAQ answers match “{query}”.</p>}</Panel>
        <div className="space-y-5"><Panel><div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-teal" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em]">Public resources</h2></div><ul className="space-y-1">{[{ label: "Public FAQ", href: "/faq" }, { label: "Orindle blog and guides", href: "/blog" }, { label: "Model overview", href: "/models" }, { label: "Credits policy", href: "/credits-policy" }].map((resource) => <li key={resource.href}><Link href={resource.href} className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium text-body transition-colors hover:bg-soft hover:text-ink">{resource.label}<ExternalLink className="size-3.5 text-muted" aria-hidden="true" /></Link></li>)}</ul></Panel><Panel className="bg-[#173b32] text-white"><Coins className="mb-4 size-6 text-mint" aria-hidden="true" /><h2 className="text-lg font-semibold tracking-[-0.025em] !text-white">Need a person?</h2><p className="mt-2 text-sm leading-6 text-white/70">Open the public contact page for the currently available support design. This workspace does not create a ticket or promise a response time.</p><Button asChild variant="mint" className="mt-5"><Link href="/contact">Open contact page<ArrowRight aria-hidden="true" /></Link></Button></Panel></div>
      </div>
      {(query && !filteredTopics.length && !filteredFaqs.length) && <div className="mt-6 text-center"><Button type="button" variant="secondary" onClick={() => setQuery("")}>Clear help search</Button></div>}
    </>
  );
}
