import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ArticleCard } from "@/components/blog/article-card";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { articles } from "@/lib/content/articles";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "AI Creator Guides & Practical Workflows",
  description: "Original Orindle guides to AI model selection, creator tools, image prompting, AI video, no-code websites and small-business content workflows.",
  path: "/blog",
  keywords: ["AI guides", "AI for creators", "AI for small business", "AI tutorials"],
});

export default function BlogPage() {
  const [featured, ...rest] = articles;
  if (!featured) return null;

  return (
    <main id="main-content">
      <PageHero eyebrow="Orindle guides & insights" title="Make better work with AI, one decision at a time." description="Practical, research-informed guides for choosing models, directing images and video, building websites and connecting AI to real creative and business workflows." breadcrumbs={[{ name: "Blog", href: "/blog" }]} actions={<Button asChild variant="secondary"><Link href="#latest-guides">Browse all six guides <ArrowRight aria-hidden="true" /></Link></Button>} />
      <section className="py-16 sm:py-20 lg:py-24" id="latest-guides">
        <Container>
          <div className="mb-10 flex items-end justify-between border-b border-line pb-6"><div><p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-teal">The connected creator series</p><h2 className="mb-0 mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">Six guides. One complete workflow.</h2></div><span className="hidden text-xs text-muted sm:block">Published 5 Nov 2026</span></div>
          <ArticleCard article={featured} featured index={0} />
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((article, index) => <ArticleCard key={article.slug} article={article} index={index + 1} />)}
          </div>
        </Container>
      </section>
      <section className="pb-20">
        <Container>
          <div className="grid gap-8 rounded-[24px] bg-soft p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-teal">Reading with a purpose</p><h2 className="mb-0 mt-3 max-w-xl font-display text-2xl font-semibold tracking-[-0.035em]">Not sure where to begin?</h2><p className="mb-0 mt-3 max-w-2xl text-sm leading-7 text-body">Start with the creator stack guide for the big picture, or go straight to model selection if you are comparing GPT, Claude and Gemini.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button asChild variant="secondary"><Link href="/blog/best-ai-tools-for-creators">Creator guide</Link></Button><Button asChild variant="secondary"><Link href="/blog/gpt-vs-claude-vs-gemini">Model guide</Link></Button></div>
          </div>
        </Container>
      </section>
    </main>
  );
}
