import type { Metadata } from "next";

const fallbackOrigin = "https://orindle.com";

function normalizeOrigin(value: string | undefined) {
  if (!value) return fallbackOrigin;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return fallbackOrigin;
    }
    return url.origin;
  } catch {
    return fallbackOrigin;
  }
}

export const siteUrl = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);

export const siteConfig = {
  name: "Orindle",
  tagline: "Everything AI. One Platform.",
  description:
    "Bring ideas to life with AI conversations, image generation, video creation and website building in one connected workspace.",
  url: siteUrl,
} as const;

export const socialImage = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: "Orindle — Everything AI. One Platform.",
};

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  /**
   * Absolute meta title for search results. Bypasses the root `%s | Orindle` template,
   * so SEO copy can differ from the shorter on-page heading without duplicating the brand.
   */
  absoluteTitle?: boolean;
};

export function createMetadata({
  title,
  description,
  path,
  keywords,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex = false,
  absoluteTitle = false,
}: PageMetadata): Metadata {
  const url = absoluteUrl(path);
  const metaTitle = absoluteTitle ? { absolute: title } : title;

  return {
    title: metaTitle,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type,
      images: [socialImage],
      ...(type === "article"
        ? { publishedTime, modifiedTime, authors: ["Orindle Editorial"] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
