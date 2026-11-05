import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { modelPrices, models, providers } from "@/lib/server/db/schema";
import { AppError, integrationUnavailable } from "@/lib/server/errors";
import { formatUsdNanodollars, nanodollarsToSafeNumber, parseUsdNanodollars } from "@/lib/server/credits/arithmetic";

export type GenerationKind = "chat" | "image" | "video" | "website";

export async function getPricedModel(modelId: string, kind: GenerationKind) {
  const now = new Date();
  const [model] = await getDb()
    .select({
      id: models.id,
      gatewayModelId: models.gatewayModelId,
      name: models.name,
      kind: models.kind,
      capabilities: models.capabilities,
      providerId: providers.id,
      inputNanoUsdPerToken: modelPrices.inputNanoUsdPerToken,
      outputNanoUsdPerToken: modelPrices.outputNanoUsdPerToken,
      operationNanoUsd: modelPrices.operationNanoUsd,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .innerJoin(modelPrices, eq(modelPrices.modelId, models.id))
    .where(
      and(
        eq(models.id, modelId),
        kind === "website" ? inArray(models.kind, ["chat", "website"]) : eq(models.kind, kind),
        eq(models.enabled, true),
        eq(providers.enabled, true),
        lte(modelPrices.effectiveFrom, now),
        or(isNull(modelPrices.effectiveTo), gt(modelPrices.effectiveTo, now)),
      ),
    )
    .orderBy(desc(modelPrices.effectiveFrom))
    .limit(1);
  if (!model) throw new AppError("not_found", 404, "That model is not enabled with a current server price.");
  return model;
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
    if (input.inputNanoUsdPerToken === null || input.outputNanoUsdPerToken === null) {
      throw integrationUnavailable("Text model estimate pricing");
    }
    const inputTokens = Math.max(1, Math.ceil(input.prompt.length / 4));
    const outputTokens = input.maxOutputTokens ?? (input.kind === "website" ? 5000 : 1200);
    const nano =
      BigInt(input.inputNanoUsdPerToken) * BigInt(inputTokens) +
      BigInt(input.outputNanoUsdPerToken) * BigInt(outputTokens);
    return formatUsdNanodollars(((nano + 9n) / 10n) * 10n);
  }
  if (input.operationNanoUsd === null) throw integrationUnavailable("Media model estimate pricing");
  const nano = BigInt(input.operationNanoUsd);
  return formatUsdNanodollars(((nano + 9n) / 10n) * 10n);
}

export function catalogPriceToNano(value: string) {
  return nanodollarsToSafeNumber(parseUsdNanodollars(value));
}

export async function listEnabledCatalog(kind?: GenerationKind) {
  const conditions = [eq(models.enabled, true), eq(providers.enabled, true)];
  if (kind) conditions.push(kind === "website" ? inArray(models.kind, ["chat", "website"]) : eq(models.kind, kind));
  return getDb()
    .select({
      id: models.id,
      name: models.name,
      kind: models.kind,
      provider: providers.name,
      modalities: models.modalities,
      capabilities: models.capabilities,
    })
    .from(models)
    .innerJoin(providers, eq(models.providerId, providers.id))
    .where(and(...conditions))
    .orderBy(models.name);
}
