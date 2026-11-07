export type InlineLink = {
  kind: "link";
  text: string;
  href: string;
  external?: boolean;
};

export type RichText = readonly (string | InlineLink)[];

export type ArticleBlock =
  | { type: "paragraph"; content: RichText }
  | { type: "heading"; id: string; title: string }
  | { type: "list"; ordered: boolean; items: readonly RichText[] }
  | { type: "example"; label: string; title: string; text: string }
  | { type: "callout"; title: string; content: RichText }
  | { type: "table"; caption: string; headers: readonly string[]; rows: readonly (readonly string[])[] }
  | { type: "workflow"; title: string; steps: readonly { title: string; text: string }[] };

export type ArticleSection = {
  id: string;
  title: string;
  blocks: readonly ArticleBlock[];
};

export type Article = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  category: "Creator workflows" | "Model guides" | "Image" | "Video" | "Websites" | "Small business";
  /** Search keywords for this article page. */
  seoKeywords: readonly string[];
  publishedAt: string;
  updatedAt: string;
  sections: readonly ArticleSection[];
  relatedSlugs: readonly string[];
  productLink: { href: string; label: string; cta: string };
};

export function link(text: string, href: string, external = false): InlineLink {
  return { kind: "link", text, href, external };
}

export function p(...content: RichText): ArticleBlock {
  return { type: "paragraph", content };
}

export function h3(id: string, title: string): ArticleBlock {
  return { type: "heading", id, title };
}

export function ul(...items: RichText[]): ArticleBlock {
  return { type: "list", ordered: false, items };
}

export function ol(...items: RichText[]): ArticleBlock {
  return { type: "list", ordered: true, items };
}

export function example(title: string, text: string, label = "Worked example"): ArticleBlock {
  return { type: "example", label, title, text };
}

export function callout(title: string, ...content: RichText): ArticleBlock {
  return { type: "callout", title, content };
}

export function table(caption: string, headers: readonly string[], rows: readonly (readonly string[])[]): ArticleBlock {
  return { type: "table", caption, headers, rows };
}

export function workflow(title: string, steps: readonly { title: string; text: string }[]): ArticleBlock {
  return { type: "workflow", title, steps };
}

export const publicationDate = "2026-11-05";
