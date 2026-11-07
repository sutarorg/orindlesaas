import { describe, expect, it } from "vitest";
import type { Metadata } from "next";

import { metadata as home } from "@/app/(site)/page";
import { metadata as features } from "@/app/(site)/features/page";
import { metadata as pricing } from "@/app/(site)/pricing/page";
import { metadata as models } from "@/app/(site)/models/page";
import { metadata as blog } from "@/app/(site)/blog/page";
import { metadata as about } from "@/app/(site)/about/page";
import { metadata as contact } from "@/app/(site)/contact/page";
import { metadata as faq } from "@/app/(site)/faq/page";
import { metadata as privacy } from "@/app/(site)/privacy/page";
import { metadata as terms } from "@/app/(site)/terms/page";
import { metadata as creditsPolicy } from "@/app/(site)/credits-policy/page";
import { generateMetadata as productMetadata } from "@/app/(site)/features/[slug]/page";
import { generateMetadata as articleMetadata } from "@/app/(site)/blog/[slug]/page";
import { products } from "@/lib/content/products";
import { articles } from "@/lib/content/articles";
import { absoluteUrl } from "@/lib/site";

/**
 * SEO copy contract. These values are the approved meta title / description / keyword
 * sets for each public page; on-page headings are intentionally allowed to differ.
 */
const expected = {
  "/": {
    title: "AI Platform for Chat Images Video and Websites",
    description:
      "Discover Orindle, an all in one AI platform for AI chat, image generation, video creation, and website building. Create, explore, and bring your ideas to life with AI.",
    keywords: [
      "Orindle",
      "all in one AI platform",
      "AI tools online",
      "AI chat platform",
      "AI image generator",
      "AI video generator",
      "AI website builder",
      "AI content creation",
      "generative AI tools",
      "AI productivity platform",
    ],
  },
  "/features": {
    title: "AI Tools and Features for Creators and Businesses",
    description:
      "Explore Orindle AI features for intelligent chat, AI image generation, video creation, and website building. Find creative AI tools for your ideas and projects.",
    keywords: [
      "AI tools and features",
      "AI platform features",
      "AI tools for creators",
      "AI tools for business",
      "AI content creation tools",
      "AI chat tools",
      "AI image creation",
      "AI video creation",
      "AI website builder",
      "online AI software",
    ],
  },
  "/pricing": {
    title: "Orindle Pricing",
    description:
      "Explore Orindle pricing and choose an AI credit pack for your needs. Access AI chat, image generation, video creation, and website building with flexible credit options.",
    keywords: [
      "Orindle pricing",
      "AI pricing",
      "AI credit packs",
      "AI credits",
      "affordable AI tools",
      "pay as you go AI",
      "AI platform cost",
      "AI tool plans",
      "AI image generator pricing",
      "AI video generator pricing",
    ],
  },
  "/models": {
    title: "Explore AI Models for Chat Image and Video Generation",
    description:
      "Explore AI models available on Orindle for conversations, creative tasks, image generation, and video workflows. Discover AI model options for different use cases.",
    keywords: [
      "AI models",
      "AI model directory",
      "list of AI models",
      "AI language models",
      "large language models",
      "LLM models",
      "generative AI models",
      "AI model catalogue",
      "AI model options",
      "image generation models",
    ],
  },
  "/blog": {
    title: "Blogs",
    description:
      "Explore the Orindle AI blog for practical guides, tutorials, AI tool comparisons, creative tips, and insights to help you use artificial intelligence more effectively.",
    keywords: [
      "AI blog",
      "artificial intelligence blog",
      "AI guides",
      "AI tutorials",
      "AI tips",
      "AI tools guide",
      "generative AI tutorials",
      "AI for creators",
      "AI productivity tips",
      "latest AI insights",
    ],
  },
  "/about": {
    title: "About",
    description:
      "Learn about Orindle and our mission to make AI powered creativity more accessible through tools for AI chat, image generation, video creation, and website building.",
    keywords: [
      "about Orindle",
      "Orindle AI",
      "AI platform",
      "all in one AI software",
      "AI innovation",
      "AI creativity tools",
      "accessible AI technology",
      "AI productivity platform",
      "artificial intelligence solutions",
    ],
  },
  "/contact": {
    title: "Contact",
    description:
      "Contact the Orindle team for product questions, account assistance, technical support, business enquiries, or help with our AI chat, image, video, and website tools.",
    keywords: [
      "contact Orindle",
      "Orindle support",
      "Orindle contact information",
      "AI platform support",
      "customer support",
      "technical support",
      "account assistance",
      "AI software help",
      "business enquiries",
      "Orindle customer service",
    ],
  },
  "/faq": {
    title: "FAQ",
    description:
      "Find answers to frequently asked questions about Orindle, including AI features, credit packs, account access, AI image generation, video creation, and website building.",
    keywords: [
      "Orindle FAQ",
      "Orindle help",
      "Orindle questions",
      "AI platform FAQ",
      "AI credits explained",
      "AI tool support",
      "account help",
      "AI image generator FAQ",
      "AI video generator help",
      "AI website builder questions",
    ],
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "Read the Orindle Privacy Policy to understand how personal information is collected, used, stored, and protected when you access or use our AI platform.",
    keywords: [
      "Orindle privacy policy",
      "data privacy",
      "data protection",
      "personal information protection",
      "user privacy",
      "online privacy policy",
      "information security",
      "AI platform privacy",
      "privacy practices",
    ],
  },
  "/terms": {
    title: "Terms of Service",
    description:
      "Review the Orindle Terms of Service to understand the conditions, responsibilities, and rules that apply when accessing and using the Orindle platform and its AI features.",
    keywords: [
      "Orindle terms of service",
      "Orindle terms",
      "user agreement",
      "terms and conditions",
      "AI platform terms",
      "platform usage rules",
      "service agreement",
      "acceptable use policy",
      "user responsibilities",
    ],
  },
  "/credits-policy": {
    title: "AI Credits Policy",
    description:
      "Learn how Orindle AI credits work, including credit purchases, usage, balance deductions, payments, and the policies that apply to AI credit packs.",
    keywords: [
      "Orindle credits policy",
      "AI credits",
      "AI credit usage",
      "AI credit packs",
      "credit balance",
      "AI usage charges",
      "AI platform billing",
      "credit purchase policy",
      "AI payment policy",
      "Orindle payments",
    ],
  },
} as const;

function titleText(metadata: Metadata) {
  const title = metadata.title;
  if (typeof title === "string") return { text: title, absolute: false };
  if (title && typeof title === "object" && "absolute" in title) return { text: title.absolute ?? "", absolute: true };
  return { text: "", absolute: false };
}

function assertPage(path: keyof typeof expected, metadata: Metadata) {
  const spec = expected[path];
  const title = titleText(metadata);
  expect(title.text, `${path} meta title`).toBe(spec.title);
  // Absolute titles must bypass the root "%s | Orindle" template, otherwise the
  // rendered tag silently gains a brand suffix that the approved copy lacks.
  expect(title.absolute, `${path} must not inherit the title template`).toBe(true);
  expect(metadata.description, `${path} meta description`).toBe(spec.description);
  expect(metadata.keywords, `${path} keywords`).toEqual([...spec.keywords]);
  expect(metadata.alternates?.canonical, `${path} canonical`).toBe(absoluteUrl(path));
  expect(metadata.openGraph?.title, `${path} openGraph title`).toBe(spec.title);
  expect(metadata.openGraph?.description, `${path} openGraph description`).toBe(spec.description);
  expect(metadata.twitter && "title" in metadata.twitter ? metadata.twitter.title : undefined, `${path} twitter title`).toBe(spec.title);
}

describe("public page SEO metadata", () => {
  it("publishes the approved home metadata", () => assertPage("/", home));
  it("publishes the approved features metadata", () => assertPage("/features", features));
  it("publishes the approved pricing metadata", () => assertPage("/pricing", pricing));
  it("publishes the approved models metadata", () => assertPage("/models", models));
  it("publishes the approved blog metadata", () => assertPage("/blog", blog));
  it("publishes the approved about metadata", () => assertPage("/about", about));
  it("publishes the approved contact metadata", () => assertPage("/contact", contact));
  it("publishes the approved faq metadata", () => assertPage("/faq", faq));
  it("publishes the approved privacy metadata", () => assertPage("/privacy", privacy));
  it("publishes the approved terms metadata", () => assertPage("/terms", terms));
  it("publishes the approved credits-policy metadata", () => assertPage("/credits-policy", creditsPolicy));

  it("renders product pages from the product SEO fields", async () => {
    const expectedProduct = {
      "ai-chat": [
        "AI Chat for Writing Research and Productivity",
        "Chat with AI using Orindle to brainstorm ideas, write content, research topics, summarize information, and improve everyday productivity with AI assistance.",
      ],
      "ai-image-generator": [
        "AI Image Generator for Creative Images and AI Art",
        "Create original visuals with the Orindle AI image generator. Turn text prompts into AI images, explore creative styles, and bring your visual ideas to life.",
      ],
      "ai-video-generator": [
        "AI Video Generator for Text to Video Creation",
        "Create engaging videos with the Orindle AI video generator. Transform ideas and text prompts into AI generated video content for creative and digital projects.",
      ],
      "ai-website-builder": [
        "AI Website Builder to Create Websites Without Coding",
        "Build websites with AI using Orindle. Turn your ideas into website experiences with an AI powered website builder designed to simplify website creation.",
      ],
    } as const;

    for (const product of products) {
      const spec = expectedProduct[product.slug as keyof typeof expectedProduct];
      expect(spec, `missing SEO expectation for ${product.slug}`).toBeDefined();
      const [title, description] = spec;
      expect(product.seoTitle).toBe(title);
      expect(product.seoDescription).toBe(description);
      expect(product.seoKeywords).toHaveLength(10);

      const metadata = await productMetadata({ params: Promise.resolve({ slug: product.slug }) });
      const resolved = titleText(metadata);
      expect(resolved.text, `${product.route} meta title`).toBe(title);
      expect(resolved.absolute, `${product.route} must not inherit the title template`).toBe(true);
      expect(metadata.description, `${product.route} meta description`).toBe(description);
      expect(metadata.keywords, `${product.route} keywords`).toEqual([...product.seoKeywords]);
      expect(metadata.alternates?.canonical, `${product.route} canonical`).toBe(absoluteUrl(product.route));
      expect(metadata.openGraph?.title, `${product.route} openGraph title`).toBe(title);
    }
  });

  it("renders article pages from the article SEO fields", async () => {
    const expectedArticle = {
      "best-ai-tools-for-creators": [
        "Best AI Tools for Content Creators and Digital Creators",
        "Discover the best AI tools for content creators, including AI writing assistants, image generators, video creation tools, and productivity solutions for creative work.",
      ],
      "gpt-vs-claude-vs-gemini": [
        "GPT vs Claude vs Gemini AI Model Comparison Guide",
        "Compare GPT, Claude, and Gemini to understand their capabilities, strengths, differences, and use cases. Learn how to choose an AI model for your needs.",
      ],
      "ai-image-generation-guide": [
        "AI Image Generation Guide for Beginners and Creators",
        "Learn how AI image generation works, how to write effective text prompts, and how to create original visuals using AI image generators and creative tools.",
      ],
      "create-ai-videos": [
        "How to Create AI Videos with Text to Video Tools",
        "Learn how to create AI videos using text prompts and AI video generators. Explore video concepts, prompt writing, and practical ways to create AI powered content.",
      ],
      "build-website-with-ai": [
        "How to Build a Website with AI Without Coding",
        "Learn how to build a website with AI, from planning your website idea to creating layouts and content. Explore AI website builders and simpler ways to create websites.",
      ],
      "ai-for-small-business": [
        "AI for Small Business Tools Uses and Practical Benefits",
        "Discover how small businesses can use AI for content creation, marketing, customer communication, creative projects, and everyday workflows with practical AI tools.",
      ],
    } as const;

    for (const article of articles) {
      const spec = expectedArticle[article.slug as keyof typeof expectedArticle];
      expect(spec, `missing SEO expectation for ${article.slug}`).toBeDefined();
      const [title, description] = spec;
      expect(article.seoTitle).toBe(title);
      expect(article.description).toBe(description);
      expect(article.seoKeywords).toHaveLength(10);

      const metadata = await articleMetadata({ params: Promise.resolve({ slug: article.slug }) });
      const resolved = titleText(metadata);
      expect(resolved.text).toBe(title);
      expect(resolved.absolute).toBe(true);
      expect(metadata.description).toBe(description);
      expect(metadata.keywords).toEqual([...article.seoKeywords]);
      expect(metadata.alternates?.canonical).toBe(absoluteUrl(`/blog/${article.slug}`));
    }
  });

  it("keeps keyword lists free of duplicates and stray whitespace", () => {
    for (const [path, spec] of Object.entries(expected)) {
      expect(new Set(spec.keywords).size, `${path} duplicate keywords`).toBe(spec.keywords.length);
      for (const keyword of spec.keywords) {
        expect(keyword.trim(), `${path} keyword whitespace`).toBe(keyword);
        expect(keyword.length, `${path} keyword length`).toBeGreaterThan(2);
      }
    }
  });
});
