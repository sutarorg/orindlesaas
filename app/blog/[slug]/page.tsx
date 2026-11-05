import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleCard } from "@/components/blog/article-card";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, createMetadata } from "@/lib/site";
import { articles, getArticle, getRelatedArticles, getReadingTime, getArticleWordCount, formatArticleDate } from "@/lib/content/articles";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return createMetadata({
    title: article.seoTitle,
    description: article.description,
    path: `/blog/${article.slug}`,
    keywords: [article.category, "AI workflow", "Orindle guide"],
    type: "article",
    publishedTime: `${article.publishedAt}T09:00:00Z`,
    modifiedTime: `${article.updatedAt}T09:00:00Z`,
  });
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const related = getRelatedArticles(article);
  const path = `/blog/${article.slug}`;

  return (
    <main id="main-content">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        datePublished: `${article.publishedAt}T09:00:00Z`,
        dateModified: `${article.updatedAt}T09:00:00Z`,
        mainEntityOfPage: absoluteUrl(path),
        author: { "@type": "Organization", name: "Orindle Editorial" },
        publisher: { "@id": absoluteUrl("/#organization") },
        articleSection: article.category,
        wordCount: getArticleWordCount(article),
      }} />
      <header className="border-b border-line bg-soft py-12 sm:py-16 lg:py-20">
        <Container>
          <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: article.category, href: path }]} />
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><span>{article.category}</span><span aria-hidden="true" className="text-line">/</span><span>Orindle Editorial</span></div>
            <h1 className="mb-0 mt-5 text-balance font-display text-[clamp(2.35rem,5.5vw,4.6rem)] font-semibold leading-[1.06] tracking-[-0.055em] text-ink">{article.title}</h1>
            <p className="mb-0 mt-6 max-w-3xl text-pretty text-base leading-8 text-body sm:text-lg">{article.excerpt}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted"><span>Published {formatArticleDate(article.publishedAt)}</span><span className="flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-3.5 text-teal" />{getReadingTime(article)} min read</span><span>Research reviewed {formatArticleDate(article.updatedAt)}</span></div>
          </div>
        </Container>
      </header>

      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[210px_minmax(0,760px)] lg:justify-center lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="Article contents" className="border-t border-line pt-5">
              <h2 className="m-0 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">In this guide</h2>
              <ol className="mt-4 space-y-3">
                {article.sections.map((section, index) => <li key={section.id} className="flex gap-2 text-xs leading-5"><span className="font-display text-[10px] text-teal">{String(index + 1).padStart(2, "0")}</span><a href={`#${section.id}`} className="text-muted underline-offset-4 transition-colors hover:text-teal hover:underline">{section.title}</a></li>)}
              </ol>
            </nav>
            <div className="mt-7 hidden border-t border-line pt-5 lg:block"><p className="m-0 text-xs leading-5 text-muted">Model capabilities and provider documentation change. Follow the external primary sources for current details.</p></div>
          </aside>
          <article className="min-w-0">
            <ArticleBody sections={article.sections} />
            <section className="mt-4 rounded-[24px] bg-ink p-7 text-white sm:p-9" aria-labelledby="article-cta">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-mint">Continue with Orindle</p>
              <h2 id="article-cta" className="mb-0 mt-4 text-balance font-display text-2xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-3xl">{article.productLink.cta}</h2>
              <p className="mb-0 mt-4 text-sm leading-7 text-white/65">Take the useful part of this guide into a connected workspace for ideas, images, video and websites.</p>
              <Button asChild variant="mint" className="mt-6"><Link href={article.productLink.href}>{article.productLink.label} <ArrowRight aria-hidden="true" /></Link></Button>
            </section>
          </article>
        </div>
      </Container>

      <section className="border-t border-line bg-soft py-16 sm:py-20" aria-labelledby="related-guides">
        <Container>
          <div className="mb-8 flex items-end justify-between"><div><p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-teal">The connected series</p><h2 id="related-guides" className="mb-0 mt-2 font-display text-2xl font-semibold tracking-[-0.035em]">Read the next useful guide</h2></div><Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/blog">All guides <ArrowRight aria-hidden="true" /></Link></Button></div>
          <div className="grid gap-5 md:grid-cols-3">{related.map((item) => <ArticleCard key={item.slug} article={item} />)}</div>
        </Container>
      </section>
    </main>
  );
}
