import type {
  CreditEstimate,
  GenerationIntent,
  ModelRegistryEntry,
} from "@/lib/contracts/dashboard";
import { getModel } from "@/lib/dashboard/models";

const illustrativeBaseRates = {
  "gpt-6.1-sol": 4,
  "claude-opus-5-5": 8,
  "gemini-3.8-flash": 3,
  "gemini-3.1-flash-image": 12,
  "gpt-image-2.5-sunburst": 15,
  "gemini-omni-1.1-flash": 12,
} as const;

function roundCredits(value: number) {
  return Math.max(5, Math.ceil(value / 5) * 5);
}

function unavailable(product: GenerationIntent["product"], modelId: string | null): CreditEstimate {
  return {
    fixture: true,
    product,
    credits: null,
    pricingKind: "estimate",
    explanation: "Add the required brief, prompt or reference and select a compatible model to see an illustrative estimate.",
    modelId,
    quoteId: null,
  };
}

function baseRate(modelId: string) {
  return illustrativeBaseRates[modelId as keyof typeof illustrativeBaseRates] ?? 5;
}

function chatEstimate(intent: Extract<GenerationIntent, { product: "chat" }>): CreditEstimate {
  const model = getModel(intent.modelId === "auto" ? "gpt-6.1-sol" : intent.modelId);
  if (!model || !model.products.includes("chat") || intent.prompt.trim().length < 2) {
    return unavailable("chat", model?.id ?? null);
  }
  const units = Math.max(1, Math.ceil(intent.prompt.trim().length / 800));
  const credits = roundCredits(baseRate(model.id) * units);
  return {
    fixture: true,
    product: "chat",
    credits,
    pricingKind: "estimate",
    explanation: `${model.displayName} · ${units} prompt unit${units === 1 ? "" : "s"} · ${intent.modelId === "auto" ? "Auto routing presentation" : "illustrative rate"}.`,
    modelId: model.id,
    quoteId: null,
  };
}

function imageEstimate(intent: Extract<GenerationIntent, { product: "image" }>): CreditEstimate {
  const model = getModel(intent.modelId);
  if (!model || !model.products.includes("image") || intent.prompt.trim().length < 3) {
    return unavailable("image", model?.id ?? null);
  }
  const ratioMultiplier = { square: 1, portrait: 1.1, landscape: 1.2, wide: 1.3 }[intent.ratio];
  const resolutionMultiplier = { "1k": 0.6, "2k": 1, "4k": 1.8 }[intent.resolution];
  const styleMultiplier = intent.style === "none" ? 1 : 1.05;
  const count = Math.min(4, Math.max(1, Math.round(intent.count)));
  const credits = roundCredits(baseRate(model.id) * ratioMultiplier * resolutionMultiplier * styleMultiplier * count);
  return {
    fixture: true,
    product: "image",
    credits,
    pricingKind: "estimate",
    explanation: `${count} image${count === 1 ? "" : "s"} · ${intent.resolution.toUpperCase()} · ${intent.ratio}. Resolution, ratio and count are illustrative multipliers.`,
    modelId: model.id,
    quoteId: null,
  };
}

function videoEstimate(intent: Extract<GenerationIntent, { product: "video" }>): CreditEstimate {
  const model = getModel(intent.modelId);
  const missingInput = intent.mode === "text" ? intent.prompt.trim().length < 3 : !intent.referenceName;
  if (!model || !model.products.includes("video") || missingInput) {
    return unavailable("video", model?.id ?? null);
  }
  const resolutionMultiplier = { "360p": 0.5, "720p": 1, "1080p": 1.6, "4k": 3 }[intent.resolution];
  const credits = roundCredits(baseRate(model.id) * intent.durationSeconds * resolutionMultiplier * (intent.mode === "image" ? 1.15 : 1));
  return {
    fixture: true,
    product: "video",
    credits,
    pricingKind: "estimate",
    explanation: `${intent.durationSeconds}s · ${intent.resolution} · ${intent.ratio}. Duration and resolution drive this illustrative estimate.`,
    modelId: model.id,
    quoteId: null,
  };
}

function websiteEstimate(intent: Extract<GenerationIntent, { product: "website" }>): CreditEstimate {
  const model = getModel(intent.modelId);
  if (!model || !model.products.includes("website") || intent.brief.trim().length < 10) {
    return unavailable("website", model?.id ?? null);
  }
  const sections = Math.min(8, Math.max(1, Math.round(intent.sections)));
  const typeMultiplier = { landing: 1, business: 1.35, portfolio: 1.15, waitlist: 0.8 }[intent.siteType];
  const optionUnits = Number(intent.includeContact) + Number(intent.includeFaq) + Number(intent.includeSeo);
  const credits = roundCredits((baseRate(model.id) + 16 + sections * 8 + optionUnits * 4) * typeMultiplier);
  return {
    fixture: true,
    product: "website",
    credits,
    pricingKind: "estimate",
    explanation: `${sections} section${sections === 1 ? "" : "s"} · ${intent.siteType} · ${optionUnits} selected option${optionUnits === 1 ? "" : "s"}.`,
    modelId: model.id,
    quoteId: null,
  };
}

export function estimateGeneration(intent: GenerationIntent): CreditEstimate {
  switch (intent.product) {
    case "chat": return chatEstimate(intent);
    case "image": return imageEstimate(intent);
    case "video": return videoEstimate(intent);
    case "website": return websiteEstimate(intent);
  }
}

export function canAffordEstimate(balance: number, estimate: CreditEstimate) {
  return estimate.credits !== null && balance >= estimate.credits;
}

export function modelRateLabel(model: ModelRegistryEntry) {
  return `${model.pricingDisplay}; final backend rates are not connected.`;
}
