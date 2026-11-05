import { describe, expect, it } from "vitest";
import { products } from "@/lib/content/products";
import { creditPacks } from "@/lib/content/pricing";
import { articles, getArticleWordCount, type Article } from "@/lib/content/articles";
import type { InlineLink, RichText } from "@/lib/content/articles/types";

const staticRoutes = new Set([
  "/", "/features", "/pricing", "/models", "/blog", "/about", "/contact", "/faq", "/privacy", "/terms", "/credits-policy", "/login", "/signup",
]);

function richLinks(content: RichText) {
  return content.filter((part): part is InlineLink => typeof part !== "string");
}

function articleLinks(article: Article) {
  return article.sections.flatMap((section) => section.blocks.flatMap((block) => {
    if (block.type === "paragraph" || block.type === "callout") return richLinks(block.content);
    if (block.type === "list") return block.items.flatMap(richLinks);
    return [];
  }));
}

describe("product and pricing integrity", () => {
  it("contains exactly the four confirmed products", () => {
    expect(products).toHaveLength(4);
    expect(products.map((product) => product.name)).toEqual([
      "Orindle Chat", "Orindle Image Studio", "Orindle Video Studio", "Orindle Websites",
    ]);
    expect(new Set(products.map((product) => product.route)).size).toBe(4);
  });

  it("matches the exact one-time credit packages", () => {
    expect(creditPacks.map(({ name, priceUsd, credits }) => ({ name, priceUsd, credits }))).toEqual([
      { name: "Creator", priceUsd: 19, credits: 1900 },
      { name: "Pro", priceUsd: 49, credits: 4900 },
      { name: "Studio", priceUsd: 99, credits: 9900 },
    ]);
    for (const pack of creditPacks) expect(pack.credits).toBe(pack.priceUsd * 100);
  });
});

describe("article cluster integrity", () => {
  it("has six unique substantial articles", () => {
    expect(articles).toHaveLength(6);
    expect(new Set(articles.map((article) => article.slug)).size).toBe(6);
    for (const article of articles) {
      expect(article.sections.length).toBeGreaterThanOrEqual(7);
      expect(getArticleWordCount(article)).toBeGreaterThan(1000);
      expect(article.description.length).toBeGreaterThan(80);
      expect(article.seoTitle.length).toBeGreaterThan(25);
    }
  });

  it("has valid related articles and unique section IDs", () => {
    for (const article of articles) {
      expect(new Set(article.sections.map((section) => section.id)).size).toBe(article.sections.length);
      expect(article.relatedSlugs).not.toContain(article.slug);
      for (const related of article.relatedSlugs) expect(articles.some((item) => item.slug === related)).toBe(true);
    }
  });

  it("resolves every internal article link and uses HTTPS externally", () => {
    const validRoutes = new Set([
      ...staticRoutes,
      ...products.map((product) => product.route),
      ...articles.map((article) => `/blog/${article.slug}`),
    ]);
    for (const article of articles) {
      for (const link of articleLinks(article)) {
        if (link.external) {
          expect(link.href.startsWith("https://")).toBe(true);
          expect(link.external).toBe(true);
        } else {
          expect(validRoutes.has(link.href)).toBe(true);
        }
      }
    }
  });
});
