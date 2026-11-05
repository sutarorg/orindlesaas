import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Coins, History, Plus, ReceiptText, WalletCards } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FaqList } from "@/components/marketing/faq-list";
import { FinalCta } from "@/components/marketing/final-cta";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { creditPacks, creditFaqs } from "@/lib/content/pricing";
import { products } from "@/lib/content/products";
import { absoluteUrl, createMetadata } from "@/lib/site";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = createMetadata({
  title: "One-Time AI Credit Pricing",
  description: "Choose Creator, Pro or Studio one-time credit packs. Use one shared balance across Orindle Chat, Image Studio, Video Studio and Websites.",
  path: "/pricing",
  keywords: ["Orindle pricing", "AI credits", "one-time AI pricing", "AI credit packs"],
});

export default function PricingPage() {
  return (
    <main id="main-content">
      <JsonLd data={creditPacks.map((pack) => ({
        "@context": "https://schema.org",
        "@type": "Product",
        name: `Orindle ${pack.name} credit pack`,
        description: `${formatNumber(pack.credits)} credits for shared usage across Orindle products. One-time purchase; checkout availability is implemented in a later stage.`,
        category: "AI usage credits",
        brand: { "@type": "Brand", name: "Orindle" },
        offers: {
          "@type": "Offer",
          price: pack.priceUsd,
          priceCurrency: "USD",
          url: absoluteUrl(`/pricing#${pack.id}`),
        },
      }))} />

      <PageHero
        eyebrow="One-time credit pricing"
        title="Credits that work across your whole workflow."
        description="Choose the pack that fits your creative plans. Pay once, use the shared balance across all four Orindle products, and add more credits when you need them. No monthly subscription."
        breadcrumbs={[{ name: "Pricing", href: "/pricing" }]}
        actions={<Button asChild variant="secondary"><Link href="/credits-policy">Read the Credits Policy <ArrowRight aria-hidden="true" /></Link></Button>}
      />

      <section className="py-16 sm:py-20" aria-labelledby="packs-heading">
        <Container>
          <h2 id="packs-heading" className="sr-only">One-time credit packages</h2>
          <PricingCards />
          <div className="mt-6 rounded-xl border border-line bg-soft px-5 py-4 text-xs leading-5 text-muted">
            <strong className="font-semibold text-ink">Frontend-stage note:</strong> account creation and checkout are not connected yet. Pack buttons open an explicit preview handoff and do not process a payment or add credits.
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-soft py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="How credits work" title="A shared wallet with understandable usage." description="Credits are a customer-facing usage unit. They are not a promise of unlimited AI or the same allowance for every operation." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: WalletCards, step: "01", title: "Purchase once", text: "Choose a pack without a recurring renewal. The planned wallet is shared across your Orindle account." },
              { icon: Coins, step: "02", title: "Use across products", text: "Spend credits on supported Chat, Image Studio, Video Studio and Websites operations. Costs vary by model and operation." },
              { icon: History, step: "03", title: "Review your usage", text: "The future usage history is designed to show the operation and credits used, helping you make informed choices." },
            ].map((item) => <article key={item.title} className="rounded-2xl border border-line bg-white p-7"><div className="flex items-center justify-between"><item.icon aria-hidden="true" className="size-5 text-teal" /><span className="font-display text-xs text-muted">{item.step}</span></div><h3 className="mb-0 mt-8 font-display text-xl font-semibold tracking-[-0.03em]">{item.title}</h3><p className="mb-0 mt-3 text-sm leading-6 text-body">{item.text}</p></article>)}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <SectionHeading eyebrow="What you can spend credits on" title="One balance, four kinds of work." />
              <p className="mt-5 max-w-md text-sm leading-7 text-body">Use credits where they add the most value to your project. You do not need to divide a pack into fixed allowances or buy a separate plan for each product.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => <Link key={product.id} href={product.route} className="group rounded-2xl border border-line p-5 transition-colors hover:border-teal/40 hover:bg-soft"><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-teal">{product.shortName}</span><p className="mb-0 mt-3 text-sm leading-6 text-body">{product.id === "chat" && "Model-based conversations, drafting and thinking tasks."}{product.id === "image" && "Supported image generation and variation operations."}{product.id === "video" && "Supported text-to-video and image-to-video operations."}{product.id === "websites" && "Supported AI website generation and related operations."}</p><span className="mt-4 flex items-center gap-1 text-xs font-semibold text-ink">Explore product <ArrowRight aria-hidden="true" className="size-3.5 text-teal transition-transform group-hover:translate-x-1" /></span></Link>)}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-ink py-20 text-white sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.17em] text-mint">The credit unit</p>
              <h2 className="mb-0 font-display text-[clamp(2.2rem,5vw,4rem)] font-semibold tracking-[-0.05em] text-white">100 credits = $1</h2>
              <p className="mb-0 mt-4 max-w-lg text-base leading-7 text-white/65">This expresses customer-facing usage value. It is not a cash balance, and it does not mean a fixed number of images, videos or conversations.</p>
            </div>
            <div className="rounded-2xl border border-white/15 p-6 sm:p-8">
              <ReceiptText aria-hidden="true" className="size-5 text-mint" />
              <h3 className="mb-0 mt-6 font-display text-xl font-semibold text-white">How deductions are determined</h3>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-white/65">
                {["The future server uses the selected operation and verified metered AI usage.", "Where feasible, the workspace should provide an estimate before you confirm an operation.", "Final usage is recorded against the shared wallet; the browser cannot authoritatively set the deduction."].map((item) => <li key={item} className="flex gap-3"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-mint" />{item}</li>)}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid items-center gap-8 rounded-[24px] border border-line bg-soft p-7 sm:p-10 lg:grid-cols-[1fr_auto]">
            <div><Plus aria-hidden="true" className="size-5 text-teal" /><h2 className="mb-0 mt-5 font-display text-2xl font-semibold tracking-[-0.035em]">Need more room later?</h2><p className="mb-0 mt-3 max-w-2xl text-sm leading-7 text-body">Purchase another one-time pack when your work requires it. There is no need to wait for a monthly reset because this is not a subscription model.</p></div>
            <Button asChild variant="secondary"><Link href="#packs-heading">Compare packs <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </Container>
      </section>

      <section className="bg-soft py-20 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeading eyebrow="Pricing questions" title="Clear terms before you choose." description="For the complete policy context, including consumer rights and disputes, read the Credits Policy." />
            <FaqList items={creditFaqs} />
          </div>
        </Container>
      </section>
      <FinalCta title="Choose once. Create across the whole platform." description="Review the pack that fits your plans and keep every credit connected to one workspace." />
    </main>
  );
}
