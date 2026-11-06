import type { CatalogProduct as ProductKind, CompatibilityParameters } from "@/lib/contracts/catalog";
import { productPolicySchema } from "@/lib/contracts/catalog";

export { catalogProducts as products, compatibilityParametersSchema, productPolicySchema } from "@/lib/contracts/catalog";
export type { CatalogProduct as ProductKind, CompatibilityParameters, ProductPolicy } from "@/lib/contracts/catalog";

export type CompatibilityModel = {
  kind: ProductKind | null;
  catalogType: string;
  gatewayMetadata: Record<string, unknown>;
  productCompatibility: Record<string, unknown>;
};

export type CompatibilityAssessment = {
  supported: boolean;
  reason?: string;
  parameters: CompatibilityParameters;
  reviewed: boolean;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function hasV4(metadata: Record<string, unknown>): boolean {
  return strings(metadata.supported_specifications).includes("v4");
}

function modalities(metadata: Record<string, unknown>, channel: "input" | "output"): string[] {
  return strings(record(metadata.modalities)[channel]);
}

function structuredOutputEvidence(metadata: Record<string, unknown>): boolean {
  if (strings(metadata.tags).some((tag) => ["structured-output", "structured_outputs", "structured-outputs"].includes(tag))) return true;
  if (Array.isArray(metadata.supported_parameters) && strings(metadata.supported_parameters).some((key) => ["response_format", "structured_outputs", "structuredOutputs"].includes(key))) return true;
  const parameters = record(metadata.supported_parameters);
  return ["response_format", "structured_outputs", "structuredOutputs"].some((key) => parameters[key] === true);
}

function unique(values: string[] | undefined): string[] | undefined {
  return values ? [...new Set(values)] : undefined;
}

export function assessProductCompatibility(model: CompatibilityModel, product: ProductKind): CompatibilityAssessment {
  const rawPolicy = model.productCompatibility[product];
  const parsedPolicy = rawPolicy === undefined ? null : productPolicySchema.safeParse(rawPolicy);
  if (rawPolicy !== undefined && !parsedPolicy?.success) return { supported: false, reviewed: false, parameters: {}, reason: "The reviewed compatibility policy is invalid." };
  const policy = parsedPolicy?.success ? parsedPolicy.data : undefined;
  if (policy?.disabled) return { supported: false, reviewed: true, parameters: {}, reason: "An administrator disabled this product route." };
  const reviewed = policy !== undefined;
  const parameters = { ...policy?.parameters };
  if (parameters.sizes) parameters.sizes = unique(parameters.sizes);
  if (parameters.aspectRatios) parameters.aspectRatios = unique(parameters.aspectRatios);
  if (parameters.resolutions) parameters.resolutions = unique(parameters.resolutions);
  if (parameters.durations) parameters.durations = [...new Set(parameters.durations)];
  const metadata = model.gatewayMetadata;
  if (!hasV4(metadata)) return { supported: false, reviewed, parameters, reason: "Gateway SDK v4 support is not evidenced." };

  if (product === "chat" || product === "website") {
    if (model.catalogType !== "language" || !["chat", "website"].includes(model.kind ?? "") || (product === "chat" && model.kind !== "chat")) {
      return { supported: false, reviewed, parameters, reason: "The model is not a language route for this product." };
    }
    if (!modalities(metadata, "input").includes("text") || !modalities(metadata, "output").includes("text")) {
      return { supported: false, reviewed, parameters, reason: "Text input/output is not evidenced." };
    }
    if (product === "website" && !reviewed && !structuredOutputEvidence(metadata)) {
      return { supported: false, reviewed, parameters, reason: "Structured website output is not evidenced." };
    }
    const declaredMaximum = typeof metadata.max_tokens === "number" && Number.isSafeInteger(metadata.max_tokens) && metadata.max_tokens > 0 ? metadata.max_tokens : 32_000;
    parameters.maxOutputTokens = Math.min(parameters.maxOutputTokens ?? (product === "chat" ? 2_000 : 5_000), declaredMaximum);
    return { supported: true, reviewed, parameters };
  }

  const output = product === "image" ? "image" : "video";
  if (!modalities(metadata, "output").includes(output)) return { supported: false, reviewed, parameters, reason: `${output} output is not evidenced.` };
  if (!reviewed && model.catalogType !== product) return { supported: false, reviewed, parameters, reason: "Cross-type media routing requires reviewed compatibility." };
  if (model.catalogType !== product && !reviewed) return { supported: false, reviewed, parameters, reason: "The Gateway model type does not match this media product." };
  if (product === "image") {
    parameters.sizes ??= [];
    parameters.aspectRatios ??= [];
    parameters.seed ??= false;
    return { supported: true, reviewed, parameters };
  }

  if (!reviewed || !parameters.durations?.length || !parameters.resolutions?.length) {
    return { supported: false, reviewed, parameters, reason: "Video routing requires reviewed durations and resolutions." };
  }
  const mapping = parameters.resolutionPricing ?? {};
  if (parameters.resolutions.some((resolution) => !mapping[resolution])) {
    return { supported: false, reviewed, parameters, reason: "Every video resolution needs an exact Gateway pricing label." };
  }
  parameters.aspectRatios ??= [];
  parameters.generateAudio ??= false;
  return { supported: true, reviewed, parameters };
}

export function validateProductOptions(product: ProductKind, parameters: CompatibilityParameters, options: Record<string, unknown>): string | null {
  const allowed = product === "image"
    ? new Set(["prompt", "size", "aspectRatio", "seed"])
    : product === "video"
      ? new Set(["prompt", "duration", "aspectRatio", "resolution", "generateAudio"])
      : product === "website" ? new Set(["prompt", "name"]) : new Set(["prompt", "messages", "maxOutputTokens"]);
  const unexpected = Object.keys(options).filter((key) => !allowed.has(key));
  if (unexpected.length) return `Options are not allowed for ${product}: ${unexpected.join(", ")}.`;
  if (product === "image") {
    if (options.size !== undefined && !parameters.sizes?.includes(String(options.size))) return "The selected image size is not allowed for this model.";
    if (options.aspectRatio !== undefined && !parameters.aspectRatios?.includes(String(options.aspectRatio))) return "The selected aspect ratio is not allowed for this model.";
    if (options.seed !== undefined && parameters.seed !== true) return "Seed is not allowed for this image model.";
  }
  if (product === "video") {
    if (!parameters.durations?.includes(Number(options.duration))) return "An allowed video duration is required.";
    if (!parameters.resolutions?.includes(String(options.resolution))) return "An allowed video resolution is required.";
    if (options.aspectRatio !== undefined && !parameters.aspectRatios?.includes(String(options.aspectRatio))) return "The selected aspect ratio is not allowed for this model.";
    if (options.generateAudio === true && parameters.generateAudio !== true) return "Audio is not allowed for this video model.";
  }
  if ((product === "chat" || product === "website") && options.maxOutputTokens !== undefined) {
    const requested = Number(options.maxOutputTokens);
    if (!Number.isInteger(requested) || requested < 1 || requested > (parameters.maxOutputTokens ?? 0)) return "The requested output token limit is not allowed for this model.";
  }
  return null;
}

export function publicProductOptions(parameters: CompatibilityParameters) {
  return {
    maxOutputTokens: parameters.maxOutputTokens,
    sizes: parameters.sizes ?? [],
    aspectRatios: parameters.aspectRatios ?? [],
    durations: parameters.durations ?? [],
    resolutions: parameters.resolutions ?? [],
    generateAudio: parameters.generateAudio === true,
    seed: parameters.seed === true,
  };
}
