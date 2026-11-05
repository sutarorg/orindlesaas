import type { DashboardProduct, ModelRegistryEntry } from "@/lib/contracts/dashboard";

export const modelRegistry: readonly ModelRegistryEntry[] = [
  {
    id: "gpt-6.1-sol",
    displayName: "GPT-6.1 Sol",
    provider: "OpenAI",
    products: ["chat", "website"],
    capabilities: ["Reasoning", "Natural writing", "Coding", "Image understanding"],
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    contextDisplay: null,
    pricingDisplay: "Server quote required",
    availability: "catalog-fixture",
    featureTags: ["Balanced", "Code", "Vision"],
    supportsNegativePrompt: false,
    sourceUrl: "https://platform.openai.com/docs/models",
  },
  {
    id: "claude-opus-5-5",
    displayName: "Claude Opus 5.5",
    provider: "Anthropic",
    products: ["chat", "website"],
    capabilities: ["Long-horizon reasoning", "Coding", "Knowledge work", "Tool use"],
    inputModalities: ["text", "image"],
    outputModalities: ["text"],
    contextDisplay: "1M tokens documented",
    pricingDisplay: "Server quote required",
    availability: "catalog-fixture",
    featureTags: ["Deep reasoning", "Code", "Long context"],
    supportsNegativePrompt: false,
    sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
  },
  {
    id: "gemini-3.8-flash",
    displayName: "Gemini 3.8 Flash",
    provider: "Google",
    products: ["chat", "website"],
    capabilities: ["Multimodal reasoning", "Coding", "File understanding", "Fast drafting"],
    inputModalities: ["text", "image", "video", "audio", "pdf"],
    outputModalities: ["text"],
    contextDisplay: "1,048,576 input tokens",
    pricingDisplay: "Server quote required",
    availability: "catalog-fixture",
    featureTags: ["Fast", "Multimodal", "Long context"],
    supportsNegativePrompt: false,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash",
  },
  {
    id: "gemini-3.1-flash-image",
    displayName: "Gemini 3.1 Flash Image",
    provider: "Google",
    products: ["image"],
    capabilities: ["Image generation", "Image editing", "Reference guidance"],
    inputModalities: ["text", "image", "video", "pdf"],
    outputModalities: ["image", "text"],
    contextDisplay: "131,072 input tokens",
    pricingDisplay: "Server quote required",
    availability: "catalog-fixture",
    featureTags: ["Text to image", "Editing", "2K/4K options"],
    supportsNegativePrompt: false,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image",
  },
  {
    id: "gpt-image-2.5-sunburst",
    displayName: "GPT-Image-2.5 Sunburst",
    provider: "OpenAI",
    products: ["image"],
    capabilities: ["Detailed image generation", "Image editing"],
    inputModalities: ["text", "image"],
    outputModalities: ["image"],
    contextDisplay: null,
    pricingDisplay: "Server quote required",
    availability: "catalog-fixture",
    featureTags: ["Detailed", "Editing"],
    supportsNegativePrompt: false,
    sourceUrl: "https://platform.openai.com/docs/models",
  },
  {
    id: "gemini-omni-1.1-flash",
    displayName: "Gemini Omni Flash",
    provider: "Google",
    products: ["video"],
    capabilities: ["Text to video", "Image to video", "Video editing", "Native audio"],
    inputModalities: ["text", "image", "video"],
    outputModalities: ["video"],
    contextDisplay: "3–10 seconds · 360p–4K documented",
    pricingDisplay: "Server quote required",
    availability: "catalog-fixture",
    featureTags: ["Video", "Reference frames", "Audio"],
    supportsNegativePrompt: false,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-omni-flash",
  },
] as const;

export function getModelsForProduct(product: DashboardProduct) {
  return modelRegistry.filter((model) => model.products.includes(product));
}

export function getModelById(id: string) {
  return modelRegistry.find((model) => model.id === id);
}

export function getDefaultModel(product: DashboardProduct) {
  return getModelsForProduct(product)[0];
}

export const modelsForProduct = getModelsForProduct;

export function getModel(id: string) {
  return getModelById(id) ?? null;
}
