import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { FaqList } from "@/components/marketing/faq-list";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { generalFaqs, accountFaqs } from "@/lib/content/faqs";
import { creditFaqs } from "@/lib/content/pricing";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Frequently Asked Questions",
  description: "Answers about Orindle’s four AI products, planned models, one-time credit packs, shared wallet and connected workspace.",
  path: "/faq",
});

const allFaqs = [...generalFaqs, ...accountFaqs, ...creditFaqs];

export default function FaqPage() {
  return (
    <main id="main-content">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: allFaqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) }} />
      <PageHero eyebrow="Frequently asked questions" title="The details, in plain language." description="Understand the four-product workspace, one-time credit model and what is—and is not—connected in this public frontend." breadcrumbs={[{ name: "FAQ", href: "/faq" }]} />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <aside><h2 className="mb-0 font-display text-2xl font-semibold tracking-[-0.035em]">Browse by topic</h2><nav aria-label="FAQ topics" className="mt-5 flex flex-wrap gap-2 lg:flex-col lg:items-start"><a href="#platform" className="text-sm text-teal underline-offset-4 hover:underline">Platform & models</a><a href="#accounts" className="text-sm text-teal underline-offset-4 hover:underline">Accounts & access</a><a href="#credits" className="text-sm text-teal underline-offset-4 hover:underline">Credits & pricing</a></nav><div className="mt-8 rounded-2xl bg-soft p-5"><p className="m-0 text-sm leading-6 text-body">Still deciding? Explore the platform or review transparent one-time pricing.</p><Button asChild variant="secondary" size="sm" className="mt-4"><Link href="/features">Explore features <ArrowRight aria-hidden="true" /></Link></Button></div></aside>
            <div className="space-y-14">
              <section id="platform"><h2 className="mb-5 font-display text-2xl font-semibold tracking-[-0.035em]">Platform & models</h2><FaqList items={generalFaqs} /></section>
              <section id="accounts"><h2 className="mb-5 font-display text-2xl font-semibold tracking-[-0.035em]">Accounts & access</h2><FaqList items={accountFaqs} /></section>
              <section id="credits"><h2 className="mb-5 font-display text-2xl font-semibold tracking-[-0.035em]">Credits & pricing</h2><FaqList items={creditFaqs} /></section>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
