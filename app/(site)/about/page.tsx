import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Compass, Layers3, UserRoundCheck } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FinalCta } from "@/components/marketing/final-cta";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/content/products";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "About",
  description: "Learn about Orindle and our mission to make AI powered creativity more accessible through tools for AI chat, image generation, video creation, and website building.",
  path: "/about",
  absoluteTitle: true,
  keywords: [
    "about Orindle",
    "Orindle AI",
    "AI platform",
    "all in one AI software",
    "AI innovation",
    "AI creativity tools",
    "accessible AI technology",
    "AI productivity platform",
    "artificial intelligence solutions",
  ],
});

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageHero eyebrow="About Orindle" title="AI should connect the work, not fragment it." description="Orindle is being built around a simple observation: the brief, the image, the moving story and the website are often parts of the same idea. They deserve a workspace that treats them that way." breadcrumbs={[{ name: "About", href: "/about" }]} actions={<Button asChild><Link href="/features">Explore the platform <ArrowRight aria-hidden="true" /></Link></Button>} />
      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeading eyebrow="Our product thesis" title="Continuity is a creative advantage." />
            <div className="space-y-5 text-base leading-8 text-body">
              <p>Creative work rarely arrives in one step. A useful conversation becomes a brief. A visual direction becomes a sequence. The approved story needs somewhere to live. Moving between disconnected tools can make each of those handoffs feel like starting over.</p>
              <p>Orindle’s answer is not simply “more AI.” It is a more coherent place to use it: four focused products, one account, shared projects and assets, and one transparent credit wallet.</p>
              <p className="mb-0">The public website you are reading is the first implementation stage. Real accounts, generation, payments and deployment follow in dedicated stages, with clear contracts rather than simulated success.</p>
            </div>
          </div>
        </Container>
      </section>
      <section className="border-y border-line bg-soft py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Principles we build by" title="Ambition, with a clear interface." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Layers3, title: "Connected, not crowded", text: "Bring useful context forward while keeping each product focused on a specific creative job." },
              { icon: Compass, title: "Guided, not dictated", text: "Help people make informed model and workflow choices without hiding the cost or pretending there is one universal best answer." },
              { icon: UserRoundCheck, title: "Assisted, still human", text: "AI can expand the options. People remain responsible for judgment, originality, accuracy, rights and the decision to publish." },
            ].map((item) => <article key={item.title} className="rounded-2xl border border-line bg-white p-7"><item.icon aria-hidden="true" className="size-5 text-teal" /><h3 className="mb-0 mt-8 font-display text-xl font-semibold tracking-[-0.03em]">{item.title}</h3><p className="mb-0 mt-3 text-sm leading-6 text-body">{item.text}</p></article>)}
          </div>
        </Container>
      </section>
      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div><SectionHeading eyebrow="Exactly four products" title="A complete creative path, not an endless tool catalog." description="Orindle’s scope is intentionally clear. Each product has a distinct role and a reason to connect to the others." /></div>
            <ul className="border-t border-line">{products.map((product) => <li key={product.id} className="border-b border-line py-5"><Link href={product.route} className="group flex items-center justify-between gap-5"><div><span className="font-display text-lg font-semibold tracking-[-0.025em] text-ink group-hover:text-teal">{product.name}</span><p className="mb-0 mt-1 text-sm text-muted">{product.eyebrow}</p></div><ArrowRight aria-hidden="true" className="size-4 shrink-0 text-teal transition-transform group-hover:translate-x-1" /></Link></li>)}</ul>
          </div>
          <div className="mt-14 rounded-2xl bg-[#eef7f2] p-6 sm:p-8"><p className="m-0 flex items-start gap-3 text-sm leading-7 text-body"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal" /> No invented founding story, customer count or team profiles. Orindle’s public story stays focused on the product and the decisions behind it.</p></div>
        </Container>
      </section>
      <FinalCta title="Build the whole idea, not just the next output." />
    </main>
  );
}
