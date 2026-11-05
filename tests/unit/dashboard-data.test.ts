import { describe, expect, it } from "vitest";
import { estimateGeneration, canAffordEstimate } from "@/lib/dashboard/estimates";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { filterAssets, filterGenerations, safeFileName, searchMatches } from "@/lib/dashboard/format";
import { parseSafeMarkdown } from "@/lib/dashboard/markdown";
import { getModel, getModelsForProduct, modelRegistry } from "@/lib/dashboard/models";
import { getAppBreadcrumbs, isNavItemActive, allNavItems } from "@/lib/dashboard/navigation";

const imageIntent = { product: "image", modelId: "gemini-3.1-flash-image", prompt: "A quiet product study", negativePrompt: "", referenceName: null, ratio: "landscape", resolution: "1k", count: 2, style: "product" } as const;
const videoIntent = { product: "video", modelId: "gemini-omni-1.1-flash", mode: "text", prompt: "A gentle camera move", durationSeconds: 6, ratio: "wide", resolution: "720p", referenceName: null } as const;
const websiteIntent = { product: "website", modelId: "gpt-6.1-sol", brief: "A useful business website", siteType: "business", sections: 4, includeContact: true, includeFaq: false, includeSeo: true } as const;

describe("dashboard fixture and model integrity", () => {
  it("uses unique, documented catalogue IDs and never claims provider availability", () => {
    expect(new Set(modelRegistry.map((model) => model.id)).size).toBe(modelRegistry.length);
    expect(modelRegistry.map((model) => model.id)).toEqual(["gpt-6.1-sol", "claude-opus-5-5", "gemini-3.8-flash", "gemini-3.1-flash-image", "gpt-image-2.5-sunburst", "gemini-omni-1.1-flash"]);
    for (const model of modelRegistry) {
      expect(model.availability).toBe("catalog-fixture");
      expect(model.sourceUrl).toMatch(/^https:\/\//);
      expect(model.products.length).toBeGreaterThan(0);
      expect(model.capabilities.length).toBeGreaterThan(0);
      expect(model.pricingDisplay).toBe("Server quote required");
    }
    expect(getModel("not-a-model")).toBeNull();
    expect(getModelsForProduct("image").every((model) => model.products.includes("image"))).toBe(true);
  });

  it("keeps every cross-product fixture reference valid", () => {
    const generationIds = new Set(workspaceFixture.generations.map((generation) => generation.id));
    const assetIds = new Set(workspaceFixture.assets.map((asset) => asset.id));
    for (const project of workspaceFixture.projects) {
      expect(project.fixture).toBe(true);
      project.generationIds.forEach((id) => expect(generationIds.has(id)).toBe(true));
    }
    for (const generation of workspaceFixture.generations) {
      expect(generation.fixture).toBe(true);
      expect(getModel(generation.modelId)?.products).toContain(generation.product);
      generation.assetIds.forEach((id) => expect(assetIds.has(id)).toBe(true));
      if (generation.status === "processing") expect(generation.progress).not.toBeNull();
    }
    for (const asset of workspaceFixture.assets) {
      expect(asset.fixture).toBe(true);
      if (asset.previewUrl) expect(asset.previewUrl).toMatch(/^\/fixtures\//);
    }
    expect(Object.values(workspaceFixture.wallet.byProduct).reduce((sum, value) => sum + value, 0)).toBe(workspaceFixture.wallet.usedThisMonth);
    expect(workspaceFixture.wallet.ledger.every((entry) => entry.reference.startsWith("DEMO-"))).toBe(true);
  });
});

describe("illustrative generation estimates", () => {
  it("returns no estimate for incomplete input and never treats Auto as a model ID", () => {
    const empty = estimateGeneration({ ...imageIntent, prompt: "" });
    expect(empty.credits).toBeNull();
    expect(empty.quoteId).toBeNull();
    const auto = estimateGeneration({ product: "chat", modelId: "auto", prompt: "Draft a creative brief", attachmentNames: [] });
    expect(auto.credits).toBeGreaterThan(0);
    expect(auto.modelId).toBe("gpt-6.1-sol");
    expect(auto.pricingKind).toBe("estimate");
  });

  it("scales image count and resolution without producing a server quote", () => {
    const base = estimateGeneration(imageIntent);
    const more = estimateGeneration({ ...imageIntent, count: 4, resolution: "4k" });
    expect(more.credits!).toBeGreaterThan(base.credits!);
    expect(base.fixture).toBe(true);
    expect(base.quoteId).toBeNull();
    expect(canAffordEstimate(10_000, base)).toBe(true);
    expect(canAffordEstimate(0, base)).toBe(false);
  });

  it("requires the appropriate video input and scales duration", () => {
    expect(estimateGeneration({ ...videoIntent, mode: "image", prompt: "" }).credits).toBeNull();
    expect(estimateGeneration({ ...videoIntent, mode: "image", prompt: "", referenceName: "frame.jpg" }).credits).toBeGreaterThan(0);
    const short = estimateGeneration({ ...videoIntent, durationSeconds: 3, resolution: "360p" });
    const long = estimateGeneration({ ...videoIntent, durationSeconds: 10, resolution: "4k" });
    expect(long.credits!).toBeGreaterThan(short.credits!);
  });

  it("validates website briefs and accounts for sections", () => {
    expect(estimateGeneration({ ...websiteIntent, brief: "short" }).credits).toBeNull();
    const small = estimateGeneration({ ...websiteIntent, sections: 1 });
    const large = estimateGeneration({ ...websiteIntent, sections: 8 });
    expect(large.credits!).toBeGreaterThan(small.credits!);
  });
});

describe("navigation, filters and safe markdown", () => {
  it("derives active navigation and useful fixture breadcrumbs", () => {
    const overview = allNavItems.find((item) => item.href === "/app")!;
    const chat = allNavItems.find((item) => item.href === "/app/chat")!;
    expect(isNavItemActive(overview, "/app")).toBe(true);
    expect(isNavItemActive(overview, "/app/chat")).toBe(false);
    expect(isNavItemActive(chat, "/app/chat/conv-campaign")).toBe(true);
    expect(getAppBreadcrumbs("/app/chat/conv-campaign").map((item) => item.label)).toEqual(["Chat", "Launch campaign direction"]);
    expect(getAppBreadcrumbs("/app/websites/site-stillwater/settings").map((item) => item.label)).toEqual(["Websites", "Stillwater Retreat", "Settings"]);
  });

  it("filters shared records and normalizes download names", () => {
    expect(filterAssets(workspaceFixture.assets, "ceramic", "all")).toHaveLength(1);
    expect(filterAssets(workspaceFixture.assets, "", "document").every((asset) => asset.type === "document")).toBe(true);
    expect(filterGenerations(workspaceFixture.generations, "", "video", "failed")).toHaveLength(1);
    expect(searchMatches(["Sage Bottle"], " sage ")).toBe(true);
    expect(safeFileName("My fixture / final.jpg")).toBe("My-fixture-final.jpg");
  });

  it("parses a constrained subset and preserves raw HTML as text", () => {
    const blocks = parseSafeMarkdown("## Direction\n\n**Bold** and `code`\n\n- One\n- Two\n\n```ts\nconst safe = true;\n```\n\n<script>alert(1)</script>");
    expect(blocks.map((block) => block.type)).toEqual(["heading", "paragraph", "list", "code", "paragraph"]);
    expect(blocks.at(-1)).toEqual({ type: "paragraph", text: "<script>alert(1)</script>" });
    expect(blocks[3]).toEqual({ type: "code", language: "ts", text: "const safe = true;" });
    expect(parseSafeMarkdown("```txt\nunclosed")).toEqual([{ type: "code", language: "txt", text: "unclosed" }]);
  });
});
