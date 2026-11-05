import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Check, CircleAlert } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ProductVisual } from "@/components/marketing/product-visuals";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FinalCta } from "@/components/marketing/final-cta";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { getProduct, products } from "@/lib/content/products";
import { absoluteUrl, createMetadata } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return createMetadata({
    title: `${product.name} — ${product.tagline}`,
    description: product.description,
    path: product.route,
    keywords: [product.name, product.shortName, "Orindle", "connected AI workspace"],
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <main id="main-content">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: product.name,
        description: product.description,
        url: absoluteUrl(product.route),
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        publisher: { "@id": absoluteUrl("/#organization") },
      }} />
      <PageHero
        eyebrow={product.eyebrow}
        title={product.tagline}
        description={product.longDescription}
        breadcrumbs={[{ name: "Features", href: "/features" }, { name: product.name, href: product.route }]}
        actions={<><Button asChild><Link href="/signup">Get Started <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="secondary"><Link href={product.relatedArticle}>Read the guide <BookOpen aria-hidden="true" /></Link></Button></>}
      >
        <ProductVisual id={product.id} />
      </PageHero>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow={`Why ${product.shortName}`} title="Built around the decisions that matter." />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {product.benefits.map((benefit, index) => (
              <article key={benefit.title} className="bg-white p-7 sm:p-8">
                <span className="font-display text-xs font-semibold text-teal">0{index + 1}</span>
                <h3 className="mb-0 mt-8 font-display text-xl font-semibold leading-7 tracking-[-0.03em]">{benefit.title}</h3>
                <p className="mb-0 mt-4 text-sm leading-6 text-body">{benefit.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-soft py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeading eyebrow="A practical workflow" title="From rough idea to reviewed output." description={`${product.name} works best as part of a deliberate process. AI can accelerate exploration; your judgment gives the work direction.`} />
            <ol className="border-t border-line">
              {product.workflow.map((step, index) => (
                <li key={step.title} className="grid gap-3 border-b border-line py-7 sm:grid-cols-[44px_0.75fr_1.25fr] sm:gap-5">
                  <span className="font-display text-sm font-semibold text-teal">0{index + 1}</span>
                  <h3 className="mb-0 font-display text-lg font-semibold tracking-[-0.025em]">{step.title}</h3>
                  <p className="m-0 text-sm leading-6 text-body">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading eyebrow="What you can develop" title="A focused set of capabilities." />
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {product.capabilities.map((capability) => <li key={capability} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm leading-6 text-body"><Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal" />{capability}</li>)}
              </ul>
            </div>
            <div className="rounded-[24px] bg-ink p-7 text-white sm:p-9">
              <CircleAlert aria-hidden="true" className="size-5 text-mint" />
              <h2 className="mb-0 mt-7 font-display text-2xl font-semibold tracking-[-0.035em] text-white">Good output still needs your review.</h2>
              <p className="mb-0 mt-4 text-sm leading-7 text-white/65">AI can produce plausible but inaccurate, inconsistent or unsuitable results. Check facts, ownership and usage rights, accessibility and brand fit before publishing or using the work commercially.</p>
              <div className="mt-6 flex flex-wrap gap-2">{product.useCases.map((item) => <span key={item} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-white/75">{item}</span>)}</div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-4">
        <Container>
          <Link href={product.relatedArticle} className="group flex flex-col gap-5 rounded-2xl border border-line bg-soft p-6 transition-colors hover:border-teal/40 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div><span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal">Keep learning</span><h2 className="mb-0 mt-2 font-display text-xl font-semibold tracking-[-0.03em]">{product.relatedArticleLabel}</h2></div>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-teal transition-transform group-hover:translate-x-1"><ArrowRight aria-hidden="true" className="size-4" /></span>
          </Link>
        </Container>
      </section>
      <FinalCta title={`Make your next idea with ${product.name}.`} description="Start with a clear brief and keep every useful direction connected to the project." />
    </main>
  );
}
