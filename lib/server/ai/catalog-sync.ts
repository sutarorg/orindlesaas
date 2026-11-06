import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, lt, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { exactDecimalToNano, parseGatewayJson, type PricingData } from "@/lib/server/ai/pricing";
import { getDb } from "@/lib/server/db/client";
import { auditEvents, catalogPriceObservations, catalogSyncRuns, idempotencyRecords, modelPrices, models, providers } from "@/lib/server/db/schema";
import type { DbTransaction } from "@/lib/server/db/types";
import { readServerEnvironment } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";

const catalogLockKey = 1_313_825_345;
const syncLeaseMs = 120_000;

export const gatewayCatalogEntrySchema = z.looseObject({
  id: z.string().min(3).max(320).regex(/^[a-z0-9-]+\/[^\s/]+$/),
  name: z.string().trim().min(1).max(240),
  type: z.string().trim().min(1).max(80).optional(),
  owned_by: z.string().trim().min(1).max(160).optional(),
  pricing: z.record(z.string(), z.unknown()).nullish(),
  modalities: z.looseObject({
    input: z.array(z.string().max(80)).max(40).optional(),
    output: z.array(z.string().max(80)).max(40).optional(),
  }).nullish(),
  supported_specifications: z.array(z.string().max(80)).max(40).nullish(),
  context_window: z.number().int().nonnegative().max(100_000_000).nullish(),
  max_tokens: z.number().int().nonnegative().max(100_000_000).nullish(),
  model_eligibility: z.record(z.string(), z.unknown()).nullish(),
});

export type GatewayCatalogEntry = z.infer<typeof gatewayCatalogEntrySchema>;
export type GenerationKind = "chat" | "image" | "video" | "website";

export type CatalogSyncRow = {
  providerId: string;
  providerName: string;
  id: string;
  gatewayModelId: string;
  name: string;
  kind: GenerationKind | null;
  catalogType: string;
  modalities: string[];
  capabilities: Record<string, unknown>;
  gatewayMetadata: Record<string, unknown>;
  catalogHash: string;
  pricingData: PricingData | null;
  pricingHash: string;
  inputNano: number | null;
  outputNano: number | null;
  operationNano: number | null;
};

export type CatalogSyncTrigger = "manual" | "scheduled" | "recovery";
export type CatalogSyncMode = "full" | "incremental";
export type CatalogSyncSummary = {
  runId: string;
  status: "succeeded" | "partial";
  models: number;
  invalid: number;
  changed: number;
  missing: number;
  responseHash: string;
  duplicate?: boolean;
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

export function stableJson(value: unknown): string {
  const serialized = JSON.stringify(stableValue(value));
  if (serialized === undefined) throw new Error("Value is not JSON serializable.");
  return serialized;
}

export function hashCatalogValue(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function generationKindForCatalogType(type: string): GenerationKind | null {
  if (type === "language") return "chat";
  if (type === "image" || type === "video") return type;
  return null;
}

function safeLegacyNano(value: unknown): number | null {
  if (typeof value !== "string") return null;
  try {
    const nano = exactDecimalToNano(value);
    return nano != null && nano <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nano) : null;
  } catch {
    // Raw exact pricing remains authoritative; an imprecise legacy projection is not stored.
    return null;
  }
}

export function normalizeGatewayCatalog(entries: unknown[]): { rows: CatalogSyncRow[]; invalid: number } {
  const rows: CatalogSyncRow[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  for (const candidate of entries) {
    const parsed = gatewayCatalogEntrySchema.safeParse(candidate);
    if (!parsed.success || seen.has(parsed.success ? parsed.data.id : "")) {
      invalid += 1;
      continue;
    }
    const entry = parsed.data;
    seen.add(entry.id);
    const catalogType = entry.type ?? "unknown";
    const providerId = entry.id.split("/")[0]!;
    const pricingData = entry.pricing && typeof entry.pricing === "object" ? entry.pricing : null;
    const inputModalities = entry.modalities?.input ?? [];
    const outputModalities = entry.modalities?.output ?? [];
    rows.push({
      providerId,
      providerName: entry.owned_by ?? providerId,
      id: `gateway:${entry.id}`,
      gatewayModelId: entry.id,
      name: entry.name,
      kind: generationKindForCatalogType(catalogType),
      catalogType,
      modalities: [...new Set([...inputModalities, ...outputModalities])],
      capabilities: {
        gatewayModelType: catalogType,
        specificationVersion: entry.supported_specifications?.[0] ?? null,
        tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === "string") : [],
      },
      gatewayMetadata: entry as Record<string, unknown>,
      catalogHash: hashCatalogValue(entry),
      pricingData,
      pricingHash: hashCatalogValue(pricingData),
      inputNano: safeLegacyNano(pricingData?.input),
      outputNano: safeLegacyNano(pricingData?.output),
      operationNano: safeLegacyNano(pricingData?.image),
    });
  }
  return { rows, invalid };
}

export async function fetchGatewayCatalog(options: { fetchImpl?: typeof fetch; includeAvailability?: boolean } = {}) {
  const env = readServerEnvironment();
  const includeAvailability = options.includeAvailability ?? Boolean(env.AI_GATEWAY_API_KEY);
  if (includeAvailability && !env.AI_GATEWAY_API_KEY) throw new AppError("integration_unavailable", 503, "Authenticated availability requires the existing Gateway credential.");
  const url = new URL("https://ai-gateway.vercel.sh/v1/models");
  if (includeAvailability) url.searchParams.set("include_availability", "true");
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      ...(includeAvailability ? { Authorization: `Bearer ${env.AI_GATEWAY_API_KEY}` } : {}),
    },
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok) throw new AppError("integration_unavailable", 503, `Gateway catalogue discovery failed with HTTP ${response.status}; no catalogue rows were changed.`);
  const body = await response.text();
  if (body.length > 20_000_000) throw new AppError("bad_request", 502, "Gateway catalogue response exceeded the 20 MB safety bound.");
  let payload: unknown;
  try {
    payload = parseGatewayJson(body);
  } catch {
    throw new AppError("integration_unavailable", 502, "Gateway catalogue returned invalid JSON; no catalogue rows were changed.");
  }
  const envelope = z.looseObject({ object: z.literal("list"), data: z.array(z.unknown()).min(1).max(5_000) }).safeParse(payload);
  if (!envelope.success) throw new AppError("integration_unavailable", 502, "Gateway catalogue returned an invalid or empty model list; no catalogue rows were changed.");
  return { entries: envelope.data.data, responseHash: createHash("sha256").update(body).digest("hex") };
}

async function currentRun(requestId: string) {
  const [run] = await getDb().select().from(catalogSyncRuns).where(eq(catalogSyncRuns.requestId, requestId)).limit(1);
  return run;
}

function summaryFromRun(run: typeof catalogSyncRuns.$inferSelect): CatalogSyncSummary {
  if (run.status !== "succeeded" && run.status !== "partial") {
    throw new AppError("conflict", 409, `Catalogue sync request already exists with status ${run.status}.`, { details: { runId: run.id } });
  }
  return {
    runId: run.id,
    status: run.status,
    models: run.acceptedCount,
    invalid: run.invalidCount,
    changed: run.changedCount,
    missing: run.missingCount,
    responseHash: run.responseHash ?? "",
    duplicate: true,
  };
}

async function closeAndInsertPrice(tx: DbTransaction, row: CatalogSyncRow, runId: string, now: Date) {
  const [current] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, row.id), isNull(modelPrices.effectiveTo))).limit(1).for("update");
  const [latestObservation] = await tx.select().from(catalogPriceObservations).where(eq(catalogPriceObservations.modelId, row.id)).orderBy(desc(catalogPriceObservations.observedAt), desc(catalogPriceObservations.id)).limit(1);
  const changed = latestObservation?.pricingHash !== row.pricingHash;
  if (changed) {
    await tx.insert(catalogPriceObservations).values({
      runId,
      modelId: row.id,
      pricingHash: row.pricingHash,
      pricingData: row.pricingData ?? {},
      observedAt: now,
    });
  }
  if (!row.pricingData) {
    if (current?.source === "gateway_catalog") await tx.update(modelPrices).set({ effectiveTo: now }).where(eq(modelPrices.id, current.id));
    return;
  }
  if (current && (current.source !== "gateway_catalog" || !changed)) return;
  if (current) await tx.update(modelPrices).set({ effectiveTo: now }).where(eq(modelPrices.id, current.id));
  await tx.insert(modelPrices).values({
    modelId: row.id,
    inputNanoUsdPerToken: row.inputNano,
    outputNanoUsdPerToken: row.outputNano,
    operationNanoUsd: row.operationNano,
    pricingData: row.pricingData,
    source: "gateway_catalog",
    effectiveFrom: now,
    createdAt: now,
  });
}

async function applyCatalogTransaction(runId: string, actorId: string | undefined, requestId: string, normalized: { rows: CatalogSyncRow[]; invalid: number }, responseHash: string, mode: CatalogSyncMode, now: Date): Promise<CatalogSyncSummary> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${catalogLockKey})`);
    const [run] = await tx.select().from(catalogSyncRuns).where(eq(catalogSyncRuns.id, runId)).limit(1).for("update");
    if (!run || run.status !== "running") throw new AppError("conflict", 409, "Catalogue sync run is no longer active.");
    if (run.leaseExpiresAt <= now) throw new AppError("conflict", 409, "Catalogue sync lease expired before the atomic write; stale results were not applied.");
    await tx.update(catalogSyncRuns).set({ leaseExpiresAt: new Date(now.getTime() + syncLeaseMs) }).where(eq(catalogSyncRuns.id, runId));

    const existing = await tx.select({ id: models.id, catalogHash: models.catalogHash }).from(models);
    const existingById = new Map(existing.map((model) => [model.id, model]));
    const seenProvider = new Set<string>();
    let changed = 0;
    for (const row of normalized.rows) {
      if (!seenProvider.has(row.providerId)) {
        seenProvider.add(row.providerId);
        await tx.insert(providers).values({ id: row.providerId, name: row.providerName, enabled: false, firstDiscoveredAt: now, lastSeenAt: now, createdAt: now, updatedAt: now })
          .onConflictDoUpdate({ target: providers.id, set: { lastSeenAt: now, updatedAt: now } });
      }
      const previous = existingById.get(row.id);
      const metadataChanged = previous?.catalogHash !== row.catalogHash;
      if (metadataChanged) changed += 1;
      const values = {
        id: row.id,
        providerId: row.providerId,
        gatewayModelId: row.gatewayModelId,
        name: row.name,
        kind: row.kind,
        catalogType: row.catalogType,
        modalities: row.modalities,
        capabilities: row.capabilities,
        gatewayMetadata: row.gatewayMetadata,
        enabled: false,
        discoveryStatus: "present" as const,
        catalogHash: row.catalogHash,
        firstDiscoveredAt: now,
        lastSeenAt: now,
        catalogSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      const discoveryOnly = mode === "incremental" && !metadataChanged;
      await tx.insert(models).values(values).onConflictDoUpdate({
        target: models.id,
        set: discoveryOnly ? {
          discoveryStatus: "present",
          lastSeenAt: now,
          catalogSyncedAt: now,
          updatedAt: now,
        } : {
          providerId: row.providerId,
          gatewayModelId: row.gatewayModelId,
          name: row.name,
          kind: row.kind,
          catalogType: row.catalogType,
          modalities: row.modalities,
          capabilities: row.capabilities,
          gatewayMetadata: row.gatewayMetadata,
          discoveryStatus: "present",
          catalogHash: row.catalogHash,
          lastSeenAt: now,
          catalogSyncedAt: now,
          updatedAt: now,
        },
      });
      await closeAndInsertPrice(tx, row, runId, now);
    }
    const acceptedIds = normalized.rows.map((row) => row.gatewayModelId);
    const missing = await tx.update(models).set({ discoveryStatus: "missing", updatedAt: now })
      .where(and(eq(models.discoveryStatus, "present"), notInArray(models.gatewayModelId, acceptedIds))).returning({ id: models.id });
    const status = normalized.invalid > 0 ? "partial" as const : "succeeded" as const;
    await tx.update(catalogSyncRuns).set({
      status,
      acceptedCount: normalized.rows.length,
      invalidCount: normalized.invalid,
      changedCount: changed,
      missingCount: missing.length,
      responseHash,
      finishedAt: now,
      error: normalized.invalid ? `${normalized.invalid} invalid catalogue entries were quarantined.` : null,
    }).where(eq(catalogSyncRuns.id, runId));
    if (actorId) {
      await tx.insert(auditEvents).values({
        actorId,
        action: "admin.catalog_sync",
        targetType: "catalog_sync_run",
        targetId: runId,
        reason: "Manual Gateway catalogue synchronization.",
        requestId,
        before: null,
        after: { status, accepted: normalized.rows.length, invalid: normalized.invalid, changed, missing: missing.length, mode, responseHash },
      });
    }
    return { runId, status, models: normalized.rows.length, invalid: normalized.invalid, changed, missing: missing.length, responseHash };
  });
}

export async function syncGatewayCatalog(options: {
  trigger?: CatalogSyncTrigger;
  mode?: CatalogSyncMode;
  actorId?: string;
  requestId?: string;
  correlationId?: string;
  fetchImpl?: typeof fetch;
  includeAvailability?: boolean;
  now?: Date;
} = {}): Promise<CatalogSyncSummary> {
  const trigger = options.trigger ?? "manual";
  const mode = options.mode ?? "full";
  const requestId = options.requestId ?? `catalog-sync:${randomUUID()}`;
  const duplicate = await currentRun(requestId);
  if (duplicate) return summaryFromRun(duplicate);
  const now = options.now ?? new Date();
  const run = await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${catalogLockKey})`);
    const [active] = await tx.select({ id: catalogSyncRuns.id }).from(catalogSyncRuns)
      .where(and(eq(catalogSyncRuns.status, "running"), gt(catalogSyncRuns.leaseExpiresAt, now))).limit(1).for("update");
    if (active) throw new AppError("conflict", 409, "Another catalogue sync is running; try again after its lease completes.", { details: { runId: active.id } });
    const [created] = await tx.insert(catalogSyncRuns).values({
      requestId,
      trigger,
      mode,
      actorId: options.actorId,
      leaseExpiresAt: new Date(now.getTime() + syncLeaseMs),
      startedAt: now,
    }).returning();
    return created!;
  });
  try {
    const discovered = await fetchGatewayCatalog({ fetchImpl: options.fetchImpl, includeAvailability: options.includeAvailability });
    const normalized = normalizeGatewayCatalog(discovered.entries);
    return await applyCatalogTransaction(run.id, options.actorId, options.correlationId ?? requestId, normalized, discovered.responseHash, mode, new Date());
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Catalogue sync failed.";
    await getDb().update(catalogSyncRuns).set({ status: "failed", error: message, finishedAt: new Date() }).where(and(eq(catalogSyncRuns.id, run.id), eq(catalogSyncRuns.status, "running")));
    throw error;
  }
}

const storedSyncResultSchema = z.looseObject({
  runId: z.uuid(),
  status: z.enum(["succeeded", "partial"]),
  models: z.number().int().nonnegative(),
  invalid: z.number().int().nonnegative(),
  changed: z.number().int().nonnegative(),
  missing: z.number().int().nonnegative(),
  responseHash: z.string(),
});

export async function runAdminCatalogSync(input: {
  actorId: string;
  mode: CatalogSyncMode;
  reason: string;
  idempotencyKey: string;
  correlationId: string;
}) {
  const operation = { action: "run_catalog_sync", mode: input.mode, reason: input.reason };
  const requestSha256 = createHash("sha256").update(stableJson(operation)).digest("hex");
  const claimed = await getDb().transaction(async (tx) => {
    const [created] = await tx.insert(idempotencyRecords).values({
      actorId: input.actorId,
      operation: "run_catalog_sync",
      key: input.idempotencyKey,
      requestSha256,
    }).onConflictDoNothing().returning({ id: idempotencyRecords.id });
    if (created) return { id: created.id, duplicate: false as const };
    const [existing] = await tx.select().from(idempotencyRecords).where(and(
      eq(idempotencyRecords.actorId, input.actorId),
      eq(idempotencyRecords.operation, "run_catalog_sync"),
      eq(idempotencyRecords.key, input.idempotencyKey),
    )).for("update").limit(1);
    if (!existing || existing.requestSha256 !== requestSha256) throw new AppError("conflict", 409, "This request key was already used for a different catalogue sync.");
    const stored = storedSyncResultSchema.safeParse(existing.responseBody);
    if (!stored.success) throw new AppError("conflict", 409, "The previous catalogue sync did not complete successfully. Use a new explicit request key after reviewing its run record.");
    return { id: existing.id, duplicate: true as const, result: stored.data };
  });
  if (claimed.duplicate) return { ...claimed.result, duplicate: true };
  const summary = await syncGatewayCatalog({
    trigger: "manual",
    mode: input.mode,
    actorId: input.actorId,
    requestId: `catalog-sync:${input.actorId}:${input.idempotencyKey}`,
    correlationId: input.correlationId,
  });
  await getDb().update(idempotencyRecords).set({ responseStatus: 200, responseBody: summary, lockedUntil: null, updatedAt: new Date() }).where(eq(idempotencyRecords.id, claimed.id));
  return summary;
}

export async function listCatalogSyncRuns(limit = 20) {
  return getDb().select().from(catalogSyncRuns).orderBy(desc(catalogSyncRuns.startedAt)).limit(Math.min(Math.max(limit, 1), 100));
}

export async function markExpiredSyncRuns() {
  return getDb().update(catalogSyncRuns).set({ status: "failed", error: "Sync lease expired before completion; rerun recovery.", finishedAt: new Date() })
    .where(and(eq(catalogSyncRuns.status, "running"), lt(catalogSyncRuns.leaseExpiresAt, new Date()))).returning({ id: catalogSyncRuns.id });
}
