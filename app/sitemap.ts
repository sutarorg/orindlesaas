import type { MetadataRoute } from "next";
import { articles } from "@/lib/content/articles";
import { absoluteUrl } from "@/lib/site";

const staticRoutes = [
  "/",
  "/features",
  "/features/ai-chat",
  "/features/ai-image-generator",
  "/features/ai-video-generator",
  "/features/ai-website-builder",
  "/pricing",
  "/models",
  "/blog",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/credits-policy",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-05T00:00:00Z");
  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified,
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : route === "/pricing" || route === "/features" ? 0.9 : 0.7,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: new Date(`${article.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
