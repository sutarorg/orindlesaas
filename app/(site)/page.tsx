import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Coins, FolderKanban, MessageSquareText, PanelsTopLeft, ShieldCheck, Sparkles, Video, WandSparkles } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { EcosystemVisual, ProductVisual } from "@/components/marketing/product-visuals";
import { SectionHeading } from "@/components/marketing/section-heading";
import { MotionReveal } from "@/components/marketing/motion-reveal";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { FaqList } from "@/components/marketing/faq-list";
import { FinalCta } from "@/components/marketing/final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { products } from "@/lib/content/products";
import { modelFamilies } from "@/lib/content/models";
import { generalFaqs } from "@/lib/content/faqs";
import { createMetadata, absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = createMetadata({
  title: "AI Platform for Chat Images Video and Websites",
  description: "Discover Orindle, an all in one AI platform for AI chat, image generation, video creation, and website building. Create, explore, and bring your ideas to life with AI.",
  path: "/",
  absoluteTitle: true,
  keywords: [
    "Orindle",
    "all in one AI platform",
    "AI tools online",
    "AI chat platform",
    "AI image generator",
    "AI video generator",
    "AI website builder",
    "AI content creation",
    "generative AI tools",
    "AI productivity platform",
  ],
});

const productIcons = { chat: MessageSquareText, image: WandSparkles, video: Video, websites: PanelsTopLeft } as const;

export default function HomePage() {
  return (
    <main id="main-content">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Orindle",
        url: absoluteUrl(),
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "A connected AI workspace for conversations, image creation, video creation and website building.",
        publisher: { "@id": absoluteUrl("/#organization") },
      }} />

      <section className="overflow-hidden border-b border-line py-14 sm:py-20 lg:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-soft px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-teal">
                <Sparkles aria-hidden="true" className="size-3.5" /> Four products. One flow.
              </div>
              <h1 className="mb-0 text-balance font-display text-[clamp(2.9rem,6.4vw,5.35rem)] font-semibold leading-[0.99] tracking-[-0.065em] text-ink">Everything AI.<br /><span className="text-teal">One Platform.</span></h1>
              <p className="mb-0 mt-7 max-w-xl text-pretty text-[17px] leading-8 text-body sm:text-lg">Bring your ideas to life with AI-powered conversations, image generation, video creation and website building — all in one powerful workspace.</p>
              <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
                <Button asChild size="lg"><Link href="/signup">Get Started <ArrowRight aria-hidden="true" /></Link></Button>
                <Button asChild variant="secondary" size="lg"><Link href="/features">Explore Products <ArrowUpRight aria-hidden="true" /></Link></Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                <span className="flex items-center gap-1.5"><Check aria-hidden="true" className="size-3.5 text-teal" /> One shared workspace</span>
                <span className="flex items-center gap-1.5"><Check aria-hidden="true" className="size-3.5 text-teal" /> One-time credit packs</span>
              </div>
            </div>
            <MotionReveal><EcosystemVisual /></MotionReveal>
          </div>
        </Container>
      </section>

      <section aria-labelledby="products-heading" className="py-20 sm:py-24 lg:py-28">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="Meet your workspace" title="Different tools. A shared train of thought." description="Start anywhere. Each Orindle product is designed around a distinct creative job, with projects and assets connecting what comes next." />
            <Button asChild variant="ghost" className="self-start lg:self-auto"><Link href="/features">Compare all features <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <h2 id="products-heading" className="sr-only">Orindle products</h2>
        </Container>

        <div className="mt-14 space-y-6 sm:mt-20 sm:space-y-8">
          {products.map((product, index) => (
            <article key={product.id} className={cn("py-8 sm:py-12", index % 2 === 1 && "bg-soft")}>
              <Container>
                <div className={cn("grid items-center gap-9 lg:grid-cols-2 lg:gap-20", index % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
                  <div className="max-w-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="font-display text-xs font-semibold text-teal">0{index + 1}</span>
                      <span className="h-px w-8 bg-line" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">{product.eyebrow}</span>
                    </div>
                    <h3 className="mb-0 font-display text-xl font-semibold tracking-[-0.035em] text-teal">{product.name}</h3>
                    <h4 className="mb-0 mt-3 text-balance font-display text-[clamp(1.85rem,3.4vw,2.85rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-ink">{product.tagline}</h4>
                    <p className="mb-0 mt-5 text-base leading-7 text-body">{product.longDescription}</p>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {product.capabilities.slice(0, 4).map((capability) => <li key={capability} className="flex items-start gap-2 text-sm leading-6 text-body"><Check aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-teal" />{capability}</li>)}
                    </ul>
                    <Button asChild variant="ghost" className="mt-6 -ml-4"><Link href={product.route}>Explore {product.shortName} <ArrowRight aria-hidden="true" /></Link></Button>
                  </div>
                  <ProductVisual id={product.id} />
                </div>
              </Container>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink py-20 text-white sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.17em] text-mint">A flexible model ecosystem</p>
              <h2 className="mb-0 text-balance font-display text-[clamp(2rem,4vw,3.15rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-white">The right model is the one that fits your task.</h2>
              <p className="mb-0 mt-5 max-w-lg text-base leading-7 text-white/65">Orindle is designed to help you choose by the work in front of you—not by a one-size-fits-all leaderboard.</p>
              <Button asChild variant="mint" className="mt-7"><Link href="/models">Explore AI Models <ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <div className="divide-y divide-white/12 border-y border-white/12">
              {modelFamilies.map((model) => (
                <div key={model.name} className="grid gap-3 py-5 sm:grid-cols-[100px_1fr_auto] sm:items-center sm:gap-5">
                  <div><p className="m-0 font-display text-lg font-semibold text-white">{model.name}</p><p className="m-0 mt-1 text-[11px] text-white/60">{model.provider}</p></div>
                  <p className="m-0 text-sm leading-6 text-white/65">{model.summary}</p>
                  <span className="w-fit rounded-full border border-mint/25 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-mint">{model.status}</span>
                </div>
              ))}
              <p className="mb-0 pt-4 text-[11px] leading-5 text-white/60">Exact model IDs and connected availability depend on the launch configuration. This public website does not make model calls.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24 lg:py-28">
        <Container>
          <SectionHeading eyebrow="Why Orindle" title="Less tool management. More creative continuity." description="A unified platform should remove practical friction, not add another layer of it." />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {[
              { icon: FolderKanban, number: "01", title: "Context stays with the project", text: "Keep briefs, creative assets and website work connected, so each new step begins with more than a blank prompt." },
              { icon: Coins, number: "02", title: "One wallet, clearer usage", text: "Use one credit balance across every product and understand variable AI costs through a shared usage history." },
              { icon: ShieldCheck, number: "03", title: "You make the final call", text: "Use AI to explore and accelerate, then review facts, rights, accessibility and quality before the work goes live." },
            ].map((item) => (
              <div key={item.title} className="bg-white p-7 sm:p-8">
                <div className="flex items-center justify-between"><item.icon aria-hidden="true" className="size-5 text-teal" /><span className="font-display text-xs text-muted">{item.number}</span></div>
                <h3 className="mb-0 mt-10 font-display text-xl font-semibold leading-7 tracking-[-0.03em]">{item.title}</h3>
                <p className="mb-0 mt-4 text-sm leading-6 text-body">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-soft py-20 sm:py-24 lg:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <SectionHeading eyebrow="A connected AI workflow" title="One campaign. Four creative modes." description="Imagine a small studio launching a new product. The handoff is deliberate: each step creates something useful for the next." />
              <p className="mt-6 max-w-md text-xs leading-5 text-muted">A workflow example, not a customer story or performance claim.</p>
            </div>
            <MotionReveal>
              <ol className="relative space-y-3">
                {[
                  { icon: MessageSquareText, name: "Chat", title: "Find the angle", text: "Turn audience notes into a focused message and campaign brief." },
                  { icon: WandSparkles, name: "Image Studio", title: "Set the visual world", text: "Explore art direction and select images that fit the brief." },
                  { icon: Video, name: "Video Studio", title: "Build the sequence", text: "Develop selected frames into a short, shot-by-shot story." },
                  { icon: PanelsTopLeft, name: "Websites", title: "Bring it all together", text: "Use the approved story and assets to shape a responsive landing page." },
                ].map((step, index) => (
                  <li key={step.name} className="relative grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-[42px_90px_1fr] sm:items-center sm:p-6">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-subtle text-teal"><step.icon aria-hidden="true" className="size-4" /></span>
                    <div><span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">Step 0{index + 1}</span><span className="mt-1 block text-xs font-semibold text-teal">{step.name}</span></div>
                    <div><h3 className="mb-0 font-display text-lg font-semibold tracking-[-0.025em]">{step.title}</h3><p className="mb-0 mt-1.5 text-sm leading-6 text-body">{step.text}</p></div>
                  </li>
                ))}
              </ol>
            </MotionReveal>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24 lg:py-28">
        <Container>
          <SectionHeading eyebrow="Made for the work you actually do" title="From solo idea to business launch." />
          <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
            <article className="rounded-[24px] border border-line bg-[#f1f9f5] p-7 sm:p-10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">For creators</span>
              <h3 className="mb-0 mt-5 max-w-md font-display text-3xl font-semibold leading-tight tracking-[-0.04em]">Keep more of your creative energy for the creative part.</h3>
              <ul className="mt-8 space-y-5">
                {["Develop a content series from one clear theme", "Explore cohesive image and motion directions", "Shape a portfolio that feels like your work"].map((item) => <li key={item} className="flex gap-3 border-t border-teal/10 pt-4 text-sm leading-6 text-body"><ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal" />{item}</li>)}
              </ul>
              <Button asChild variant="ghost" className="mt-6 -ml-4"><Link href="/blog/best-ai-tools-for-creators">Read the creator workflow guide <ArrowRight aria-hidden="true" /></Link></Button>
            </article>
            <article className="rounded-[24px] border border-line bg-[#f3f5fa] p-7 sm:p-10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#426a9c]">For businesses</span>
              <h3 className="mb-0 mt-5 max-w-md font-display text-3xl font-semibold leading-tight tracking-[-0.04em]">Build a content system your whole team can understand.</h3>
              <ul className="mt-8 space-y-5">
                {["Turn positioning into a practical campaign brief", "Create coordinated launch assets across formats", "Bring the story together on a reviewed website"].map((item) => <li key={item} className="flex gap-3 border-t border-[#426a9c]/10 pt-4 text-sm leading-6 text-body"><ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-[#426a9c]" />{item}</li>)}
              </ul>
              <Button asChild variant="ghost" className="mt-6 -ml-4"><Link href="/blog/ai-for-small-business">Read the small-business playbook <ArrowRight aria-hidden="true" /></Link></Button>
            </article>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-soft py-20 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading eyebrow="Unified credits" title="One wallet. No recurring subscription." description="Choose a one-time credit pack and use the balance across Chat, Image Studio, Video Studio and Websites. Different operations use different amounts, so you can spend where the work matters most." />
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild><Link href="/pricing">See credit packs <ArrowRight aria-hidden="true" /></Link></Button>
                <Button asChild variant="ghost"><Link href="/credits-policy">Read the Credits Policy</Link></Button>
              </div>
            </div>
            <div className="rounded-[24px] border border-line bg-white p-6 sm:p-8">
              <div className="flex items-start justify-between border-b border-line pb-6"><div><p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">The simple unit</p><p className="mb-0 mt-2 font-display text-3xl font-semibold tracking-[-0.045em] text-ink">100 credits <span className="text-muted">=</span> $1</p></div><Coins aria-hidden="true" className="size-6 text-teal" /></div>
              <p className="mb-0 mt-3 text-[11px] leading-5 text-muted">Customer-facing usage value, not a cash balance or a fixed generation allowance.</p>
              <div className="mt-6 grid grid-cols-2 gap-2">{products.map((product) => { const Icon = productIcons[product.id]; return <div key={product.id} className="flex items-center gap-2.5 rounded-xl bg-soft px-3 py-3 text-xs font-semibold text-ink"><Icon aria-hidden="true" className="size-4 text-teal" />{product.shortName}</div>; })}</div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24 lg:py-28">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Simple, one-time pricing" title="Choose the room your ideas need." description="Every pack works across the whole platform. No monthly renewal, no separate product wallets." />
            <Button asChild variant="ghost" className="self-start"><Link href="/pricing">Pricing details <ArrowUpRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="mt-12"><PricingCards compact /></div>
          <p className="mb-0 mt-5 text-center text-xs leading-5 text-muted">Choosing a pack starts account setup. Any purchase is completed separately through hosted checkout after sign-in; selecting a pack alone takes no payment and grants no credits.</p>
        </Container>
      </section>

      <section className="bg-soft py-20 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div><SectionHeading eyebrow="Questions, answered" title="A clearer way to understand Orindle." description="The essentials about products, models and one-time credits." /><Button asChild variant="ghost" className="mt-5 -ml-4"><Link href="/faq">View all FAQs <ArrowRight aria-hidden="true" /></Link></Button></div>
            <FaqList items={generalFaqs.slice(0, 5)} />
          </div>
        </Container>
      </section>

      <FinalCta />
    </main>
  );
}
