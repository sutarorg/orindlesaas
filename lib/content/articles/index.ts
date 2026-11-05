import type { Article } from "./types";
import { bestAiToolsArticle } from "./best-ai-tools";
import { modelComparisonArticle } from "./model-comparison";
import { imageGuideArticle } from "./image-guide";
import { videoGuideArticle } from "./video-guide";
import { websiteGuideArticle } from "./website-guide";
import { smallBusinessArticle } from "./small-business-guide";

export const articles: readonly Article[] = [
  bestAiToolsArticle,
  modelComparisonArticle,
  imageGuideArticle,
  videoGuideArticle,
  websiteGuideArticle,
  smallBusinessArticle,
] as const;

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getRelatedArticles(article: Article) {
  return article.relatedSlugs.map((slug) => getArticle(slug)).filter((item): item is Article => Boolean(item));
}

export type { Article } from "./types";
export { getArticleWordCount, getReadingTime, formatArticleDate } from "./text";
