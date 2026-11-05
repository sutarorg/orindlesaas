import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { auditEvents, modelPrices, models, providers } from "@/lib/server/db/schema";
import { catalogPriceToNano, type GenerationKind } from "@/lib/server/ai/models";
import { getGateway } from "@/lib/server/ai/gateway";

export type GatewayCatalogEntry = {
  id: string;
  name: string;
  modelType?: string | null;
  specification: { specificationVersion: string; provider: string; modelId: string };
  pricing?: { input: string; output: string } | null;
};
export type CatalogSyncRow = {
  providerId: string;
  providerName: string;
  modelId: string;
  gatewayModelId: string;
  name: string;
  kind: Exclude<GenerationKind, "website">;
  capabilities: Record<string, unknown>;
  inputNanoUsdPerToken: number | null;
  outputNanoUsdPerToken: number | null;
};

export function normalizeGatewayCatalog(entries: GatewayCatalogEntry[]) {
  const rows = new Map<string, CatalogSyncRow>();
  const skipped: { id: string; reason: string }[] = [];
  for (const entry of entries) {
    const kind = entry.modelType === "language" ? "chat" : entry.modelType === "image" ? "image" : entry.modelType === "video" ? "video" : null;
    const providerId = entry.id.split("/")[0] ?? "";
    if (!kind || !/^[a-z0-9][a-z0-9-]*$/.test(providerId) || entry.id.length > 300 || entry.name.trim().length === 0) {
      skipped.push({ id: entry.id, reason: "unsupported_or_invalid_metadata" });
      continue;
    }
    let inputNanoUsdPerToken: number | null = null;
    let outputNanoUsdPerToken: number | null = null;
    if (kind === "chat") {
      if (!entry.pricing) {
        skipped.push({ id: entry.id, reason: "language_price_unavailable" });
        continue;
      }
      try {
        inputNanoUsdPerToken = catalogPriceToNano(entry.pricing.input);
        outputNanoUsdPerToken = catalogPriceToNano(entry.pricing.output);
      } catch {
        skipped.push({ id: entry.id, reason: "language_price_precision_unsupported" });
        continue;
      }
    }
    const modelId = `gateway:${entry.id}`;
    rows.set(modelId, {
      providerId,
      providerName: providerId,
      modelId,
      gatewayModelId: entry.id,
      name: entry.name.trim().slice(0, 200),
      kind,
      capabilities: { gatewayModelType: entry.modelType, specificationVersion: entry.specification.specificationVersion },
      inputNanoUsdPerToken,
      outputNanoUsdPerToken,
    });
  }
  return { rows: [...rows.values()], skipped };
}

export async function syncGatewayCatalog() {
  // The external metadata read finishes before opening the database transaction.
  const response = await getGateway().getAvailableModels();
  const normalized = normalizeGatewayCatalog(response.models);
  const syncedAt = new Date();
  const requestId = crypto.randomUUID();
  return getDb().transaction(async (tx) => {
    let priceVersions = 0;
    for (const row of normalized.rows) {
      await tx.insert(providers).values({ id: row.providerId, name: row.providerName, enabled: false }).onConflictDoUpdate({ target: providers.id, set: { name: row.providerName, updatedAt: syncedAt } });
      await tx.insert(models).values({
        id: row.modelId,
        providerId: row.providerId,
        gatewayModelId: row.gatewayModelId,
        name: row.name,
        kind: row.kind,
        modalities: [],
        capabilities: row.capabilities,
        enabled: false,
        catalogSyncedAt: syncedAt,
      }).onConflictDoUpdate({ target: models.id, set: { name: row.name, providerId: row.providerId, gatewayModelId: row.gatewayModelId, kind: row.kind, capabilities: row.capabilities, catalogSyncedAt: syncedAt, updatedAt: syncedAt } });
      if (row.kind !== "chat" || row.inputNanoUsdPerToken === null || row.outputNanoUsdPerToken === null) continue;
      // Lock the model row so concurrent sync/admin price writers serialize their versions.
      await tx.select({ id: models.id }).from(models).where(eq(models.id, row.modelId)).for("update").limit(1);
      const [open] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, row.modelId), isNull(modelPrices.effectiveTo))).orderBy(desc(modelPrices.effectiveFrom)).limit(1);
      if (open && open.effectiveFrom > syncedAt) {
        normalized.skipped.push({ id: row.modelId, reason: "future_price_version_exists" });
        continue;
      }
      const current = open;
      if (current?.inputNanoUsdPerToken === row.inputNanoUsdPerToken && current.outputNanoUsdPerToken === row.outputNanoUsdPerToken && current.operationNanoUsd === null && current.source === "gateway_catalog") continue;
      if (current) await tx.update(modelPrices).set({ effectiveTo: syncedAt }).where(eq(modelPrices.id, current.id));
      await tx.insert(modelPrices).values({ modelId: row.modelId, inputNanoUsdPerToken: row.inputNanoUsdPerToken, outputNanoUsdPerToken: row.outputNanoUsdPerToken, operationNanoUsd: null, source: "gateway_catalog", effectiveFrom: syncedAt });
      priceVersions += 1;
    }
    await tx.insert(auditEvents).values({ actorId: null, action: "catalog.gateway_sync", targetType: "ai_gateway", targetId: "available_models", reason: "Authorized setup catalog synchronization", requestId, after: { models: normalized.rows.length, skipped: normalized.skipped.length, priceVersions, syncedAt: syncedAt.toISOString() } });
    return { models: normalized.rows.length, skipped: normalized.skipped, priceVersions };
  });
}
