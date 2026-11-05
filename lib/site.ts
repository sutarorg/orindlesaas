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
}: PageMetadata): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
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
      ...(type === "article"
        ? { publishedTime, modifiedTime, authors: ["Orindle Editorial"] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
