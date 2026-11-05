import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FolderKanban, History, WalletCards } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { EcosystemVisual, ProductVisual } from "@/components/marketing/product-visuals";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FinalCta } from "@/components/marketing/final-cta";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/content/products";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "AI Creation Tools, Connected in One Workspace",
  description: "Explore Orindle Chat, Image Studio, Video Studio and Websites: four distinct AI products connected by shared projects, assets and credits.",
  path: "/features",
  keywords: ["AI platform features", "AI creative tools", "connected AI workspace"],
});

export default function FeaturesPage() {
  return (
    <main id="main-content">
      <PageHero
        eyebrow="The Orindle platform"
        title="Four ways to make. One place to begin."
        description="Move from early thinking to images, motion and a professional web presence without losing the brief between tools. Each product has a clear role; the workspace connects them."
        breadcrumbs={[{ name: "Features", href: "/features" }]}
        actions={<><Button asChild><Link href="/signup">Get Started <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="secondary"><Link href="/pricing">View Pricing</Link></Button></>}
      >
        <EcosystemVisual />
      </PageHero>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Choose your starting point" title="A specific tool for each creative job." description="You do not need to use everything at once. Begin with the output you need and bring in another product when it adds value." />
          <div className="mt-14 space-y-20 sm:space-y-24">
            {products.map((product, index) => (
              <article key={product.id} className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                  <span className="font-display text-xs font-semibold text-teal">0{index + 1} / 04</span>
                  <h2 className="mb-0 mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">{product.name}</h2>
                  <p className="mb-0 mt-4 text-lg leading-8 text-body">{product.tagline}</p>
                  <p className="mb-0 mt-4 text-sm leading-7 text-muted">{product.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">{product.useCases.map((useCase) => <span key={useCase} className="rounded-full border border-line bg-soft px-3 py-1.5 text-xs text-body">{useCase}</span>)}</div>
                  <Button asChild variant="ghost" className="mt-6 -ml-4"><Link href={product.route}>Explore {product.shortName} <ArrowRight aria-hidden="true" /></Link></Button>
                </div>
                <ProductVisual id={product.id} className={index % 2 === 1 ? "lg:order-1" : undefined} />
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-soft py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Shared by design" title="The connective tissue is part of the product." description="The four tools are distinct. The account, assets and commercial model are intentionally shared." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: FolderKanban, title: "One project system", text: "Organize conversations and creative outputs around the work they belong to, not the tool that produced them." },
              { icon: WalletCards, title: "One universal wallet", text: "Spend one-time credits across all four products, with operation-specific costs rather than a fictional flat rate." },
              { icon: History, title: "One usage history", text: "The future account experience is designed to make credit activity visible across the entire workspace." },
            ].map((item) => <article key={item.title} className="rounded-2xl border border-line bg-white p-7"><item.icon aria-hidden="true" className="size-5 text-teal" /><h3 className="mb-0 mt-8 font-display text-xl font-semibold tracking-[-0.03em]">{item.title}</h3><p className="mb-0 mt-3 text-sm leading-6 text-body">{item.text}</p></article>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted">{["One Orindle account", "One asset library", "One settings system"].map((item) => <span key={item} className="flex items-center gap-2"><Check aria-hidden="true" className="size-3.5 text-teal" />{item}</span>)}</div>
        </Container>
      </section>
      <FinalCta title="Begin with one idea. Let the workspace connect the rest." />
    </main>
  );
}
