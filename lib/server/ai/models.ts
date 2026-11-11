import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { assessProductCompatibility, publicProductOptions, validateProductOptions, type CompatibilityModel, type CompatibilityParameters, type ProductKind } from "@/lib/server/ai/compatibility";
import { exactDecimalToNano, quoteExactOperation, type PriceVersionLike, type PricingData } from "@/lib/server/ai/pricing";
import { planRouting, type RoutingPlan } from "@/lib/server/ai/routing";
import { getDb } from "@/lib/server/db/client";
import { modelEndpoints, modelPrices, models, providers } from "@/lib/server/db/schema";
import { AppError, integrationUnavailable } from "@/lib/server/errors";
import { formatUsdNanodollars } from "@/lib/server/credits/arithmetic";

export type GenerationKind = ProductKind;

type ModelRow = typeof models.$inferSelect;
type PriceRow = typeof modelPrices.$inferSelect;

type ResolvedModel = {
  id: string;
  /** Canonical OpenRouter ID submitted upstream. */
  providerModelId: string;
  /** Which provider the submission goes to. */
  provider: "openrouter" | "vercel_ai_gateway";
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
  /** Server-side routing plan; null for legacy Gateway models. */
  routing?: RoutingPlan | null;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/**
 * Gateway-only availability signal. OpenRouter has no equivalent field: a model's usability there is
 * determined by its approved endpoints, which is checked separately, so this returns null for
 * OpenRouter rows rather than inventing a rule.
 */
function availabilityReason(metadata: Record<string, unknown>): string | null {
  if (typeof metadata.openrouterId === "string") return null;
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
    // The label is resolved through `resolutionPricing` when an administrator supplied a mapping
    // (historical Gateway rows), and used directly otherwise. OpenRouter endpoints publish one
    // per-second rate keyed by label, so the selected label is the key.
    pricingResolution: kind === "video"
      ? parameters.resolutionPricing?.[String(options.resolution)] ?? String(options.resolution)
      : undefined,
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
      providerModelId: model.providerModelId ?? model.gatewayModelId,
      provider: model.provider,
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

/**
 * The endpoint-aware price a quote is built from.
 *
 * A model on OpenRouter can be served by several endpoints at different rates. The *quote* used to
 * reserve credits must therefore be derived from the worst-case rate across every endpoint the
 * request is allowed to reach — not from the model-level "starting at" price, and not from the
 * first endpoint returned. `planRouting` produces both that bound and the matching `max_price`
 * sent upstream, so the reservation cannot be undercut by a provider fallback.
 *
 * A model with no approved endpoint has no safe price and cannot be bought. That is the intended
 * outcome: silently quoting the cheapest advertised figure would under-reserve on ordinary traffic.
 */
async function endpointAwarePrice(model: ModelRow, kind: GenerationKind, assessmentResolutions: string[] = []): Promise<{ price: PriceVersionLike; routing: RoutingPlan | null } | null> {
  if (model.provider !== "openrouter") return null;
  const endpoints = await getDb().select().from(modelEndpoints)
    .where(and(eq(modelEndpoints.modelId, model.id), eq(modelEndpoints.approved, true), eq(modelEndpoints.enabled, true)));
  if (endpoints.length === 0) return null;
  const pricingForEndpoints = endpoints.map((endpoint) => ({
    providerName: endpoint.providerName,
    providerSlug: endpoint.providerSlug,
    rates: endpointRateDimensions(endpoint.pricingData, kind),
  }));
  const pinned = typeof model.routingPlan?.pinnedSlug === "string" ? model.routingPlan.pinnedSlug : null;
  const plan = planRouting({ endpoints: pricingForEndpoints, pinnedSlug: pinned });
  if (!plan) return null;

  // A dimension belonging only to another product must not make this product unquotable: an image
  // endpoint prices `output_image` and has no `prompt`, so requiring both would block every image.
  const rates = plan.maximumRates;

  if (kind === "chat" || kind === "website") {
    if (rates.prompt == null || rates.completion == null) return null;
    return {
      price: {
        inputNanoUsdPerToken: null,
        outputNanoUsdPerToken: null,
        operationNanoUsd: null,
        pricingData: { input: rates.prompt, output: rates.completion },
      },
      routing: plan,
    };
  }

  // The image API bills per generated image; the rate may be declared as `output_image` or `image`.
  if (kind === "image") {
    const perImage = rates.output_image ?? rates.image;
    if (perImage == null) return null;
    return {
      price: { inputNanoUsdPerToken: null, outputNanoUsdPerToken: null, operationNanoUsd: null, pricingData: { image: perImage } },
      routing: plan,
    };
  }

  // Video is priced per second of output; the SKU name differs between endpoints.
  const perSecond = rates.per_video_second ?? rates["per-video-second"];
  if (perSecond == null) return null;
  // The quote engine matches a rate by the resolution LABEL the caller selected, so the entry must
  // carry the real label (e.g. "720p") rather than a placeholder. OpenRouter prices the same
  // per-second rate across resolutions unless it publishes a tiered SKU; when it does tier, the
  // tiered rate is the one `worstCaseRates` already selected as the maximum, so every label maps to
  // that same bounded rate and no resolution can be cheaper than the quote assumes.
  const labels = new Set<string>(assessmentResolutions);
  if (labels.size === 0) return null;
  const mapped: PricingData = {
    video_duration_pricing: [...labels].map((resolution) => ({
      resolution,
      cost_per_second: perSecond,
    })),
  };
  return {
    price: { inputNanoUsdPerToken: null, outputNanoUsdPerToken: null, operationNanoUsd: null, pricingData: mapped },
    routing: plan,
  };
}

/** Extracts only the rate dimensions relevant to one product, as exact decimal strings. */
function endpointRateDimensions(pricing: Record<string, unknown>, kind: GenerationKind): Record<string, string> {
  const rates: Record<string, string> = {};
  const take = (key: string) => {
    const value = pricing[key];
    if (typeof value === "string" && value.trim() !== "") rates[key] = value;
    else if (typeof value === "number" && Number.isFinite(value) && value >= 0) rates[key] = String(value);
  };
  if (kind === "chat" || kind === "website") { take("prompt"); take("completion"); }
  else if (kind === "image") { take("output_image"); take("image"); take("prompt"); }
  else { take("per_video_second"); take("per-video-second"); }
  return rates;
}


/**
 * The resolution labels an administrator approved for this model and product.
 *
 * Video rates are quoted per label, so the endpoint-aware pricing needs the same labels the
 * compatibility layer validated rather than a single hardcoded one.
 */
function reviewedResolutionLabels(model: ModelRow, kind: GenerationKind): string[] {
  if (kind !== "video") return [];
  const policy = model.productCompatibility.video as { parameters?: { resolutions?: unknown } } | undefined;
  const resolutions = policy?.parameters?.resolutions;
  return Array.isArray(resolutions) ? resolutions.filter((value): value is string => typeof value === "string") : [];
}

export async function resolveGenerationModel(input: {
  modelId: string;
  kind: GenerationKind;
  prompt: string;
  options?: Record<string, unknown>;
}): Promise<ResolvedModel> {
  const now = new Date();
  // The price row is LEFT-joined on purpose. For an OpenRouter model the authoritative price is the
  // approved serving endpoint, not the model-level row: a video model whose catalogue entry has no
  // per-token pricing would otherwise never resolve, even after an operator approved its endpoint.
  // Legacy Gateway rows still require a current price row, which the check below enforces.
  const [row] = await getDb().select({ model: models, provider: providers, price: modelPrices })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .leftJoin(modelPrices, and(
      eq(modelPrices.modelId, models.id),
      lte(modelPrices.effectiveFrom, now),
      or(isNull(modelPrices.effectiveTo), gt(modelPrices.effectiveTo, now)),
    ))
    .where(and(
      eq(models.id, input.modelId),
      eq(models.enabled, true),
      eq(models.discoveryStatus, "present"),
      eq(providers.enabled, true),
    ))
    .orderBy(desc(modelPrices.effectiveFrom))
    .limit(1);
  if (!row) throw new AppError("not_found", 404, "That model is not enabled and currently discovered.");
  if (row.model.provider !== "openrouter" && !row.price) {
    throw new AppError("not_found", 404, "That model is not covered by a current server price.");
  }
  if (row.model.provider === "openrouter") {
    const endpointPrice = await endpointAwarePrice(row.model, input.kind, reviewedResolutionLabels(row.model, input.kind));
    if (!endpointPrice) {
      throw new AppError("conflict", 409, "This model has no approved, priced serving endpoint. It cannot be used for a paid generation.");
    }
    const resolved = resolveWithPrice(row.model, row.provider, { ...(row.price ?? {}), ...endpointPrice.price } as PriceRow, input.kind, input.prompt, input.options ?? {});
    return { ...resolved, routing: endpointPrice.routing };
  }
  return resolveWithPrice(row.model, row.provider, row.price!, input.kind, input.prompt, input.options ?? {});
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

/**
 * Whether an administrator may enable a model.
 *
 * For an OpenRouter model the decisive question is not "is there a model-level price" but "is there
 * an approved, priced serving endpoint". Without one, `resolveGenerationModel` would refuse every
 * generation, so enabling the model would produce a selectable entry that always fails. This check
 * is synchronous on purpose; callers pass the approved endpoint count they have already read.
 */
export function assertModelCanBeEnabled(
  model: ModelRow,
  providerEnabled: boolean,
  price: PriceRow | undefined,
  approvedEndpointCount?: number,
): { ok: boolean; reason?: string } {
  if (!providerEnabled) return { ok: false, reason: "Enable the publisher before enabling this model." };
  if (model.provider === "openrouter" && approvedEndpointCount === 0) {
    return { ok: false, reason: "Approve and enable at least one priced serving endpoint before enabling this model." };
  }
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

/**
 * The customer-facing model selector.
 *
 * The price row is left-joined because an OpenRouter model is priced by its approved endpoints, not
 * by a `model_prices` row. An inner join here would return an empty selector for every migrated
 * model — the catalogue would look broken while the data was correct.
 */
export async function listEnabledCatalog(kind?: GenerationKind) {
  const now = new Date();
  const rows = await getDb().select({ model: models, provider: providers, price: modelPrices })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .leftJoin(modelPrices, and(
      eq(modelPrices.modelId, models.id),
      lte(modelPrices.effectiveFrom, now),
      or(isNull(modelPrices.effectiveTo), gt(modelPrices.effectiveTo, now)),
    ))
    .where(and(
      eq(models.enabled, true),
      eq(models.discoveryStatus, "present"),
      eq(providers.enabled, true),
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
    const priceKey = `${row.model.id}:${row.price?.id ?? "endpoint"}`;
    if (seenPrice.has(priceKey)) continue;
    seenPrice.add(priceKey);
    // A model only appears for a product when that product can actually be quoted. This is the same
    // resolution path a real generation takes, so the selector cannot offer something that fails.
    const endpointPrice = row.model.provider === "openrouter" && row.model.kind
      ? await endpointAwarePrice(row.model, row.model.kind, reviewedResolutionLabels(row.model, row.model.kind))
      : null;
    for (const product of kind ? [kind] : ["chat", "image", "video", "website"] as const) {
      const assessment = assessProductCompatibility(compatibilityModel(row.model), product);
      if (!assessment.supported || availabilityReason(row.model.gatewayMetadata)) continue;
      if (row.model.provider === "openrouter" && !endpointPrice) continue;
      const priceForQuote = row.model.provider === "openrouter"
        ? { ...(row.price ?? {}), ...(await endpointAwarePrice(row.model, product, reviewedResolutionLabels(row.model, product)))?.price }
        : row.price;
      try {
        quoteForProduct(product, row.model, priceForQuote as PriceVersionLike, assessment.parameters, "x", defaultQuoteOptions(product, assessment.parameters));
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
