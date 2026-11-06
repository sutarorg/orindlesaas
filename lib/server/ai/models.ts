import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { assessProductCompatibility, publicProductOptions, validateProductOptions, type CompatibilityModel, type CompatibilityParameters, type ProductKind } from "@/lib/server/ai/compatibility";
import { exactDecimalToNano, quoteExactOperation, type PriceVersionLike } from "@/lib/server/ai/pricing";
import { getDb } from "@/lib/server/db/client";
import { modelPrices, models, providers } from "@/lib/server/db/schema";
import { AppError, integrationUnavailable } from "@/lib/server/errors";
import { formatUsdNanodollars } from "@/lib/server/credits/arithmetic";

export type GenerationKind = ProductKind;

type ModelRow = typeof models.$inferSelect;
type PriceRow = typeof modelPrices.$inferSelect;

type ResolvedModel = {
  id: string;
  gatewayModelId: string;
  name: string;
  kind: GenerationKind;
  catalogType: string;
  providerId: string;
  providerName: string;
  priceVersionId: string;
  inputNanoUsdPerToken: number | null;
  outputNanoUsdPerToken: number | null;
  operationNanoUsd: number | null;
  pricingData: Record<string, unknown> | null;
  estimatedCostUsd: string;
  compatibilityParameters: CompatibilityParameters;
  submissionOptions: Record<string, unknown>;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function availabilityReason(metadata: Record<string, unknown>): string | null {
  const eligibility = record(metadata.model_eligibility);
  if (eligibility.status === "ineligible") return "Authenticated Gateway availability marks this model ineligible for the team.";
  return null;
}

function compatibilityModel(model: ModelRow): CompatibilityModel {
  return {
    kind: model.kind,
    catalogType: model.catalogType,
    gatewayMetadata: model.gatewayMetadata,
    productCompatibility: model.productCompatibility,
  };
}

function quoteForProduct(kind: GenerationKind, model: ModelRow, price: PriceVersionLike, parameters: CompatibilityParameters, prompt: string, options: Record<string, unknown>) {
  const inputTokens = Math.max(1, Math.ceil(prompt.length / 4));
  const outputTokens = Math.min(Number(options.maxOutputTokens ?? (kind === "website" ? 5_000 : 2_000)), parameters.maxOutputTokens ?? (kind === "website" ? 5_000 : 2_000));
  const declaredContext = model.gatewayMetadata.context_window;
  if ((kind === "chat" || kind === "website") && typeof declaredContext === "number" && inputTokens + outputTokens > declaredContext) {
    throw new AppError("bad_request", 422, "The prompt and requested output exceed this model's context window.");
  }
  return quoteExactOperation({
    kind,
    price,
    inputTokens,
    outputTokens,
    durationSeconds: kind === "video" ? Number(options.duration) : undefined,
    pricingResolution: kind === "video" ? parameters.resolutionPricing?.[String(options.resolution)] : undefined,
    generateAudio: options.generateAudio === true,
  });
}

function defaultQuoteOptions(kind: GenerationKind, parameters: CompatibilityParameters): Record<string, unknown> {
  if (kind === "video") return {
    duration: parameters.durations?.[0],
    resolution: parameters.resolutions?.[0],
    generateAudio: false,
  };
  if (kind === "chat" || kind === "website") return { maxOutputTokens: Math.min(parameters.maxOutputTokens ?? 1_200, kind === "website" ? 5_000 : 1_200) };
  return {};
}

/** Build the provider payload only from validated options; never forward the raw client object. */
function approvedSubmissionOptions(kind: GenerationKind, parameters: CompatibilityParameters, options: Record<string, unknown>): Record<string, unknown> {
  if (kind === "chat" || kind === "website") return { maxOutputTokens: Number(options.maxOutputTokens ?? parameters.maxOutputTokens ?? (kind === "website" ? 5_000 : 2_000)) };
  if (kind === "image") return Object.fromEntries((["size", "aspectRatio", "seed"] as const).filter((field) => options[field] !== undefined).map((field) => [field, options[field]]));
  return {
    duration: Number(options.duration),
    resolution: String(options.resolution),
    ...(options.aspectRatio === undefined ? {} : { aspectRatio: String(options.aspectRatio) }),
    generateAudio: options.generateAudio === true,
  };
}

function resolveWithPrice(model: ModelRow, provider: { id: string; name: string }, price: PriceRow, kind: GenerationKind, prompt: string, options: Record<string, unknown>): ResolvedModel {
  const unavailable = availabilityReason(model.gatewayMetadata);
  if (unavailable) throw new AppError("conflict", 409, unavailable);
  const assessment = assessProductCompatibility(compatibilityModel(model), kind);
  if (!assessment.supported) throw new AppError("bad_request", 422, `That model is not compatible with ${kind}: ${assessment.reason ?? "compatibility is not evidenced."}`);
  const optionError = validateProductOptions(kind, assessment.parameters, options);
  if (optionError) throw new AppError("bad_request", 422, optionError);
  try {
    const quote = quoteForProduct(kind, model, price, assessment.parameters, prompt, options);
    return {
      id: model.id,
      gatewayModelId: model.gatewayModelId,
      name: model.name,
      kind,
      catalogType: model.catalogType,
      providerId: provider.id,
      providerName: provider.name,
      priceVersionId: price.id,
      inputNanoUsdPerToken: price.inputNanoUsdPerToken,
      outputNanoUsdPerToken: price.outputNanoUsdPerToken,
      operationNanoUsd: price.operationNanoUsd,
      pricingData: price.pricingData,
      estimatedCostUsd: quote.usd,
      compatibilityParameters: assessment.parameters,
      submissionOptions: approvedSubmissionOptions(kind, assessment.parameters, options),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("bad_request", 422, "This model cannot be quoted exactly for the requested operation. No operation was submitted.", { cause: error });
  }
}

export async function resolveGenerationModel(input: {
  modelId: string;
  kind: GenerationKind;
  prompt: string;
  options?: Record<string, unknown>;
}): Promise<ResolvedModel> {
  const now = new Date();
  const [row] = await getDb().select({ model: models, provider: providers, price: modelPrices })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .innerJoin(modelPrices, eq(modelPrices.modelId, models.id))
    .where(and(
      eq(models.id, input.modelId),
      eq(models.enabled, true),
      eq(models.discoveryStatus, "present"),
      eq(providers.enabled, true),
      lte(modelPrices.effectiveFrom, now),
      or(isNull(modelPrices.effectiveTo), gt(modelPrices.effectiveTo, now)),
    ))
    .orderBy(desc(modelPrices.effectiveFrom))
    .limit(1);
  if (!row) throw new AppError("not_found", 404, "That model is not enabled, currently discovered, and covered by a current server price.");
  return resolveWithPrice(row.model, row.provider, row.price, input.kind, input.prompt, input.options ?? {});
}

/**
 * Submission-time revalidation: the queued job's frozen options must still be exactly
 * quotable against current enablement, discovery, compatibility and live prices.
 */
export async function revalidateGenerationModel(input: {
  modelId: string;
  kind: GenerationKind;
  prompt: string;
  options: Record<string, unknown>;
}): Promise<ResolvedModel> {
  return resolveGenerationModel(input);
}

/** Backward-compatible server caller; new submission code uses resolveGenerationModel directly. */
export async function getPricedModel(modelId: string, kind: GenerationKind, prompt = "", options: Record<string, unknown> = {}) {
  return resolveGenerationModel({ modelId, kind, prompt, options });
}

export function validateModelPrice(model: ModelRow, price: PriceVersionLike | undefined, kind: GenerationKind | null = model.kind): { ok: boolean; reason?: string } {
  if (!kind || !price) return { ok: false, reason: "A supported product and current exact price are required." };
  const assessment = assessProductCompatibility(compatibilityModel(model), kind);
  if (!assessment.supported) return { ok: false, reason: assessment.reason };
  try {
    quoteForProduct(kind, model, price, assessment.parameters, "x", defaultQuoteOptions(kind, assessment.parameters));
    return { ok: true };
  } catch {
    return { ok: false, reason: "The current price cannot quote the model's supported operation exactly." };
  }
}

export function assertModelCanBeEnabled(model: ModelRow, providerEnabled: boolean, price: PriceRow | undefined): { ok: boolean; reason?: string } {
  if (!providerEnabled) return { ok: false, reason: "Enable the provider before enabling this model." };
  if (!model.kind || model.discoveryStatus !== "present" || !price) return { ok: false, reason: "A supported product, current discovery, and current exact price are required." };
  const availability = availabilityReason(model.gatewayMetadata);
  if (availability) return { ok: false, reason: availability };
  return validateModelPrice(model, price, model.kind);
}

export function estimateCost(input: {
  kind: GenerationKind;
  prompt: string;
  maxOutputTokens?: number;
  inputNanoUsdPerToken: number | null;
  outputNanoUsdPerToken: number | null;
  operationNanoUsd: number | null;
}) {
  if (input.kind === "chat" || input.kind === "website") {
    if (input.inputNanoUsdPerToken === null || input.outputNanoUsdPerToken === null) throw integrationUnavailable("Text model estimate pricing");
    const inputTokens = Math.max(1, Math.ceil(input.prompt.length / 4));
    const outputTokens = input.maxOutputTokens ?? (input.kind === "website" ? 5000 : 1200);
    const nano = BigInt(input.inputNanoUsdPerToken) * BigInt(inputTokens) + BigInt(input.outputNanoUsdPerToken) * BigInt(outputTokens);
    return formatUsdNanodollars(((nano + 9n) / 10n) * 10n);
  }
  if (input.operationNanoUsd === null) throw integrationUnavailable("Media model estimate pricing");
  const nano = BigInt(input.operationNanoUsd);
  return formatUsdNanodollars(((nano + 9n) / 10n) * 10n);
}

export function catalogPriceToNano(value: string) {
  const exact = exactDecimalToNano(value);
  if (exact == null || exact > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Price exceeds the safe legacy nano-USD boundary.");
  return Number(exact);
}

export async function listEnabledCatalog(kind?: GenerationKind) {
  const now = new Date();
  const rows = await getDb().select({ model: models, provider: providers, price: modelPrices })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .innerJoin(modelPrices, eq(modelPrices.modelId, models.id))
    .where(and(
      eq(models.enabled, true),
      eq(models.discoveryStatus, "present"),
      eq(providers.enabled, true),
      lte(modelPrices.effectiveFrom, now),
      or(isNull(modelPrices.effectiveTo), gt(modelPrices.effectiveTo, now)),
    ))
    .orderBy(models.name, desc(modelPrices.effectiveFrom));
  const seenPrice = new Set<string>();
  const result: Array<{
    id: string;
    name: string;
    kind: GenerationKind;
    provider: string;
    modalities: string[];
    capabilities: Record<string, unknown>;
    options: ReturnType<typeof publicProductOptions>;
  }> = [];
  for (const row of rows) {
    const priceKey = `${row.model.id}:${row.price.id}`;
    if (seenPrice.has(priceKey)) continue;
    seenPrice.add(priceKey);
    for (const product of kind ? [kind] : ["chat", "image", "video", "website"] as const) {
      const assessment = assessProductCompatibility(compatibilityModel(row.model), product);
      if (!assessment.supported || availabilityReason(row.model.gatewayMetadata)) continue;
      try {
        quoteForProduct(product, row.model, row.price, assessment.parameters, "x", defaultQuoteOptions(product, assessment.parameters));
      } catch {
        continue;
      }
      result.push({
        id: row.model.id,
        name: row.model.name,
        kind: product,
        provider: row.provider.name,
        modalities: row.model.modalities,
        capabilities: {
          catalogType: row.model.catalogType,
          specificationVersion: row.model.capabilities.specificationVersion ?? null,
          reviewedCompatibility: assessment.reviewed,
        },
        options: publicProductOptions(assessment.parameters),
      });
    }
  }
  return result;
}
