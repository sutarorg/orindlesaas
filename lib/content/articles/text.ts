import type { Article, ArticleBlock, RichText } from "./types";

function richTextLength(content: RichText) {
  return content.reduce((total, part) => total + (typeof part === "string" ? part : part.text).length, 0);
}

function blockTextLength(block: ArticleBlock): number {
  switch (block.type) {
    case "paragraph":
    case "callout":
      return richTextLength(block.content);
    case "heading":
      return block.title.length;
    case "list":
      return block.items.reduce((total, item) => total + richTextLength(item), 0);
    case "example":
      return block.title.length + block.text.length;
    case "table":
      return block.caption.length + block.headers.join(" ").length + block.rows.flat().join(" ").length;
    case "workflow":
      return block.title.length + block.steps.reduce((total, step) => total + step.title.length + step.text.length, 0);
  }
}

export function getArticleWordCount(article: Article) {
  const characters = article.title.length + article.excerpt.length + article.sections.reduce(
    (total, section) => total + section.title.length + section.blocks.reduce((sum, block) => sum + blockTextLength(block), 0),
    0,
  );
  return Math.round(characters / 6);
}

export function getReadingTime(article: Article) {
  return Math.max(1, Math.ceil(getArticleWordCount(article) / 220));
}

export function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
