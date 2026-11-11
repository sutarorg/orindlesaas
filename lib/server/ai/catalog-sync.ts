import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull, lt, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { exactDecimalToNano, type PricingData } from "@/lib/server/ai/pricing";
import { listModelEndpoints, listModels } from "@/lib/server/ai/openrouter-api";
import { openRouterEndpointSchema, openRouterModelSchema } from "@/lib/server/ai/contracts";

/** An endpoint listing as returned by `GET /models/{author}/{slug}/endpoints`. */
type EndpointListing = ReturnType<typeof openRouterEndpointSchema.parse>;
import { getDb } from "@/lib/server/db/client";
import { auditEvents, catalogPriceObservations, catalogSyncRuns, idempotencyRecords, modelEndpoints, modelPrices, models, providers } from "@/lib/server/db/schema";
import type { DbTransaction } from "@/lib/server/db/types";
import { readServerEnvironment } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";

const catalogLockKey = 1_313_825_345;
const syncLeaseMs = 120_000;

/**
 * Catalogue normalisation for OpenRouter.
 *
 * The Gateway shape and the OpenRouter shape are not interchangeable, so this is a rewrite rather
 * than a URL swap. The differences that matter:
 *
 * - Identity is `author/slug` and the *author* is the publisher, **not** the serving provider.
 *   Conflating them would attribute a model to a company that merely publishes it, and would make
 *   endpoint pricing nonsense. Serving providers are modelled separately in `model_endpoints`.
 * - Product type comes from `architecture.output_modalities`, not from a `type` field.
 * - Prices are per-token decimal strings in `pricing`, and may be `"0"` or absent; both are
 *   unverified, and an unverified price must never become a billable quote.
 */
export const openRouterCatalogEntry = openRouterModelSchema;

export type GenerationKind = "chat" | "image" | "video" | "website";

export type CatalogSyncRow = {
  id: string;
  providerModelId: string;
  author: string;
  name: string;
  kind: GenerationKind | null;
  catalogType: string;
  modalities: string[];
  capabilities: Record<string, unknown>;
  metadata: Record<string, unknown>;
  catalogHash: string;
  /** Raw advertised pricing retained verbatim; never coerced into a float. */
  pricingData: PricingData | null;
  pricingHash: string;
  /** Bounded projection used only for the legacy nano-dollar estimate columns. */
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

/**
 * Maps an OpenRouter model's output modalities onto an Orindle product.
 *
 * Only text, image and video have a product today. Audio, speech, transcription, embeddings,
 * reranking and future categories are preserved in the registry as `unknown` (and therefore
 * non-selectable) rather than being coerced into a product they cannot serve.
 */
export function generationKindForModalities(output: string[]): GenerationKind | null {
  if (output.includes("video")) return "video";
  if (output.includes("image")) return "image";
  if (output.includes("text")) return "chat";
  return null;
}

/** The catalogue "type" column, kept for admin filtering and compatibility evidence. */
export function catalogTypeForModalities(output: string[]): string {
  if (output.includes("video")) return "video";
  if (output.includes("image")) return "image";
  if (output.includes("text")) return "language";
  return output[0] ?? "unknown";
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

/**
 * Converts the model-level `pricing` map into the shape the existing quote engine understands.
 *
 * OpenRouter prices per token (`prompt`, `completion`) and per image sometimes as `image`. The
 * quote engine already speaks `input` / `output` / `image`, so the keys are mapped explicitly rather
 * than by position. Values are copied as strings, untouched.
 */
export function pricingForQuote(pricing: Record<string, unknown> | null | undefined): PricingData | null {
  if (!pricing || typeof pricing !== "object") return null;
  const mapped: Record<string, unknown> = {};
  const take = (source: string, target: string) => {
    const value = pricing[source];
    if (typeof value === "string" && value.trim() !== "") mapped[target] = value;
    else if (typeof value === "number" && Number.isFinite(value)) mapped[target] = String(value);
  };
  take("prompt", "input");
  take("completion", "output");
  take("image", "image");
  // Retained for auditing and for endpoint comparisons; never used as a quote by itself.
  for (const [key, value] of Object.entries(pricing)) {
    if (key === "prompt" || key === "completion" || key === "image") continue;
    if (typeof value === "string" || typeof value === "number") mapped[`raw_${key}`] = String(value);
  }
  return Object.keys(mapped).length > 0 ? mapped : null;
}

export function normalizeOpenRouterCatalog(entries: readonly unknown[]): { rows: CatalogSyncRow[]; invalid: number } {
  const rows: CatalogSyncRow[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  for (const candidate of entries) {
    const parsed = openRouterCatalogEntry.safeParse(candidate);
    if (!parsed.success) { invalid += 1; continue; }
    const entry = parsed.data;
    // A duplicate canonical ID is a catalogue defect, not a second model.
    if (seen.has(entry.id)) { invalid += 1; continue; }
    seen.add(entry.id);
    const input = entry.architecture?.input_modalities ?? [];
    const output = entry.architecture?.output_modalities ?? [];
    const catalogType = catalogTypeForModalities(output);
    const pricingData = pricingForQuote(entry.pricing);
    const supported = entry.supported_parameters;
    const parameters = Array.isArray(supported) ? supported : supported ? Object.keys(supported) : [];
    rows.push({
      // The internal ID is the canonical OpenRouter ID. Keeping them identical means existing
      // foreign keys stay stable and there is exactly one identity to reason about.
      id: entry.id,
      providerModelId: entry.id,
      author: entry.id.split("/")[0]!,
      name: entry.name,
      kind: generationKindForModalities(output),
      catalogType,
      modalities: [...new Set([...input, ...output])],
      capabilities: {
        catalogType,
        inputModalities: input,
        outputModalities: output,
        supportedParameters: parameters.slice(0, 120),
        // Evidence the existing compatibility layer reads. OpenRouter serves the AI SDK v4 wire
        // shape for chat models, and the catalogue proves text in/out directly.
        specificationVersion: output.includes("text") ? "v4" : null,
        modalities: { input, output },
        contextWindow: entry.context_length ?? entry.top_provider?.context_length ?? null,
        maxTokens: entry.top_provider?.max_completion_tokens ?? null,
        structuredOutput: parameters.includes("response_format") || parameters.includes("structured_outputs"),
      },
      metadata: {
        // Stored under the historical column name so every existing reader keeps working.
        openrouterId: entry.id,
        canonicalSlug: entry.canonical_slug ?? entry.id,
        author: entry.id.split("/")[0]!,
        description: entry.description ?? null,
        created: entry.created ?? null,
        context_window: entry.context_length ?? null,
        max_tokens: entry.top_provider?.max_completion_tokens ?? null,
        modalities: { input, output },
        supported_parameters: parameters.slice(0, 120),
        endpoints: entry.endpoints ?? null,
        top_provider: entry.top_provider ?? null,
      },
      catalogHash: hashCatalogValue({ id: entry.id, name: entry.name, architecture: entry.architecture, pricing: entry.pricing, context: entry.context_length, supported: entry.supported_parameters }),
      pricingData,
      pricingHash: hashCatalogValue(pricingData),
      inputNano: safeLegacyNano(pricingData?.input),
      outputNano: safeLegacyNano(pricingData?.output),
      operationNano: safeLegacyNano(pricingData?.image),
    });
  }
  return { rows, invalid };
}

/**
 * Fetches every catalogue category Orindle cares about.
 *
 * `output_modalities` is mandatory: the endpoint defaults to `text`, so image and video models are
 * invisible without it, which would silently empty two products.
 */
export async function fetchOpenRouterCatalog(options: { fetchImpl?: typeof fetch; modalities?: string[] } = {}) {
  const modalities = options.modalities ?? ["text", "image", "video"];
  const discovered = await listModels({ outputModalities: modalities, fetchImpl: options.fetchImpl });
  return {
    entries: discovered.models,
    invalid: discovered.invalid,
    responseHash: createHash("sha256").update(stableJson(discovered.models)).digest("hex"),
  };
}


/** How many endpoint lookups one sync will make. Keeps a scheduled sync inside its budget. */
const MAX_ENDPOINT_LOOKUPS = 60;

/**
 * Fetches serving endpoints for the models that can actually be sold.
 *
 * Only models with a product mapping are queried: an embeddings or audio model has no Orindle
 * product, so its endpoints are irrelevant and each lookup costs a request. Failures are collected
 * rather than thrown — one unavailable model must not fail the whole catalogue.
 */
async function discoverEndpoints(
  rows: CatalogSyncRow[],
  options: { fetchImpl?: typeof fetch; modalities?: string[] },
): Promise<EndpointDiscovery> {
  const byModel = new Map<string, EndpointListing[]>();
  const failed = new Set<string>();
  const sellable = rows.filter((row) => row.kind !== null).slice(0, MAX_ENDPOINT_LOOKUPS);
  // Endpoint discovery needs its own credentials. If they are absent the catalogue itself is still
  // worth recording, so this is skipped rather than failing the whole sync: models land with
  // `endpoint_status = unknown` and stay unbillable until an administrator configures the key.
  if (!readServerEnvironment().OPENROUTER_API_KEY) return { byModel, failed };
  for (const row of sellable) {
    try {
      const result = await listModelEndpoints(row.id, { fetchImpl: options.fetchImpl });
      byModel.set(row.id, result.endpoints);
    } catch {
      failed.add(row.id);
    }
  }
  return { byModel, failed };
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
    if (current?.source === "openrouter_catalog") await tx.update(modelPrices).set({ effectiveTo: now }).where(eq(modelPrices.id, current.id));
    return;
  }
  if (current && (current.source !== "openrouter_catalog" || !changed)) return;
  if (current) await tx.update(modelPrices).set({ effectiveTo: now }).where(eq(modelPrices.id, current.id));
  await tx.insert(modelPrices).values({
    modelId: row.id,
    inputNanoUsdPerToken: row.inputNano,
    outputNanoUsdPerToken: row.outputNano,
    operationNanoUsd: row.operationNano,
    pricingData: row.pricingData,
    source: "openrouter_catalog",
    effectiveFrom: now,
    createdAt: now,
  });
}

/**
 * Records the serving endpoints for one model.
 *
 * Endpoint prices are the basis of every quote, so they are stored per endpoint instead of being
 * flattened. Crucially, an endpoint that already exists keeps its `approved`/`enabled` flags: a
 * re-sync must never silently approve a newly discovered or re-priced route, and it must never
 * discard an administrator's decision. A price change on an approved endpoint clears
 * `approved_pricing_hash` so the operator has to re-approve the new figure — otherwise a partner
 * could raise prices and Orindle would keep quoting the old, cheaper bound.
 */
async function recordEndpoints(tx: DbTransaction, modelId: string, endpoints: EndpointListing[], now: Date) {
  let written = 0;
  for (const endpoint of endpoints) {
    const rates = endpointRates(endpoint.pricing);
    if (!rates) continue;
    const pricingHash = hashCatalogValue(rates);
    const [existing] = await tx.select().from(modelEndpoints)
      .where(and(eq(modelEndpoints.modelId, modelId), eq(modelEndpoints.providerName, endpoint.provider_name))).limit(1);
    if (!existing) {
      await tx.insert(modelEndpoints).values({
        modelId,
        providerName: endpoint.provider_name,
        providerSlug: endpoint.provider_slug ?? null,
        pricingData: rates,
        capabilities: {
          supportedParameters: endpoint.supported_parameters ?? null,
          contextLength: endpoint.context_length ?? null,
          maxCompletionTokens: endpoint.max_completion_tokens ?? null,
          quantization: endpoint.quantization ?? null,
        },
        contextLength: endpoint.context_length ?? null,
        maxCompletionTokens: endpoint.max_completion_tokens ?? null,
        approved: false,
        enabled: false,
        approvedPricingHash: null,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      });
      written += 1;
      continue;
    }
    const priceChanged = existing.approvedPricingHash !== null && existing.approvedPricingHash !== pricingHash;
    await tx.update(modelEndpoints).set({
      providerSlug: endpoint.provider_slug ?? existing.providerSlug,
      pricingData: rates,
      capabilities: {
        supportedParameters: endpoint.supported_parameters ?? null,
        contextLength: endpoint.context_length ?? null,
        maxCompletionTokens: endpoint.max_completion_tokens ?? null,
        quantization: endpoint.quantization ?? null,
      },
      contextLength: endpoint.context_length ?? existing.contextLength,
      maxCompletionTokens: endpoint.max_completion_tokens ?? existing.maxCompletionTokens,
      // A price change on an approved endpoint revokes approval until an operator re-reviews it.
      ...(priceChanged ? { approved: false, enabled: false, approvedPricingHash: null } : {}),
      lastSeenAt: now,
      updatedAt: now,
    }).where(eq(modelEndpoints.id, existing.id));
    written += 1;
  }
  return written;
}

/** Normalises an endpoint's advertised pricing into exact decimal strings keyed by dimension. */
export function endpointRates(pricing: Record<string, unknown> | null | undefined): Record<string, string> | null {
  if (!pricing || typeof pricing !== "object") return null;
  const rates: Record<string, string> = {};
  for (const [key, value] of Object.entries(pricing)) {
    if (typeof value === "string" && value.trim() !== "") rates[key] = value;
    else if (typeof value === "number" && Number.isFinite(value) && value >= 0) rates[key] = String(value);
  }
  return Object.keys(rates).length > 0 ? rates : null;
}

type EndpointDiscovery = {
  byModel: Map<string, EndpointListing[]>;
  /** Models whose endpoint discovery failed; they keep their previous state and are never approved. */
  failed: Set<string>;
};

async function applyCatalogTransaction(runId: string, actorId: string | undefined, requestId: string, normalized: { rows: CatalogSyncRow[]; invalid: number }, responseHash: string, mode: CatalogSyncMode, now: Date, endpointDiscovery: EndpointDiscovery = { byModel: new Map(), failed: new Set() }): Promise<CatalogSyncSummary> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${catalogLockKey})`);
    const [run] = await tx.select().from(catalogSyncRuns).where(eq(catalogSyncRuns.id, runId)).limit(1).for("update");
    if (!run || run.status !== "running") throw new AppError("conflict", 409, "Catalogue sync run is no longer active.");
    if (run.leaseExpiresAt <= now) throw new AppError("conflict", 409, "Catalogue sync lease expired before the atomic write; stale results were not applied.");
    await tx.update(catalogSyncRuns).set({ leaseExpiresAt: new Date(now.getTime() + syncLeaseMs) }).where(eq(catalogSyncRuns.id, runId));

    const existing = await tx.select({ id: models.id, catalogHash: models.catalogHash }).from(models);
    const existingById = new Map(existing.map((model) => [model.id, model]));
    const seenAuthor = new Set<string>();
    let changed = 0;
    for (const row of normalized.rows) {
      // The registry's "provider" row records the model PUBLISHER (author). Serving providers live
      // in model_endpoints; conflating the two would mislabel every endpoint price.
      if (!seenAuthor.has(row.author)) {
        seenAuthor.add(row.author);
        await tx.insert(providers).values({ id: row.author, name: row.author, enabled: false, firstDiscoveredAt: now, lastSeenAt: now, createdAt: now, updatedAt: now })
          .onConflictDoUpdate({ target: providers.id, set: { lastSeenAt: now, updatedAt: now } });
      }
      const previous = existingById.get(row.id);
      const metadataChanged = previous?.catalogHash !== row.catalogHash;
      if (metadataChanged) changed += 1;
      // `gatewayModelId` stays NOT NULL UNIQUE, so a brand-new OpenRouter model needs a value for it.
      // The canonical ID is used, which keeps one identity per model and leaves the historical
      // column meaningful for rows that predate this migration.
      const values = {
        id: row.id,
        providerId: row.author,
        gatewayModelId: row.id,
        providerModelId: row.providerModelId,
        author: row.author,
        provider: "openrouter" as const,
        endpointStatus: "unknown" as const,
        name: row.name,
        kind: row.kind,
        catalogType: row.catalogType,
        modalities: row.modalities,
        capabilities: row.capabilities,
        gatewayMetadata: row.metadata,
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
        // `enabled` is deliberately absent from both branches: a sync must never enable a model,
        // and must never disable one an administrator turned on.
        set: discoveryOnly ? {
          discoveryStatus: "present",
          lastSeenAt: now,
          catalogSyncedAt: now,
          updatedAt: now,
        } : {
          providerId: row.author,
          providerModelId: row.providerModelId,
          author: row.author,
          provider: "openrouter",
          name: row.name,
          kind: row.kind,
          catalogType: row.catalogType,
          modalities: row.modalities,
          capabilities: row.capabilities,
          gatewayMetadata: row.metadata,
          discoveryStatus: "present",
          catalogHash: row.catalogHash,
          lastSeenAt: now,
          catalogSyncedAt: now,
          updatedAt: now,
        },
      });
      await closeAndInsertPrice(tx, row, runId, now);

      // Endpoint state drives whether the model is priceable at all, so it is updated in the same
      // transaction as the model row. A failed discovery keeps the previous endpoints untouched:
      // revoking approval because a network call failed would silently stop a working product.
      const listings = endpointDiscovery.byModel.get(row.id);
      if (listings) {
        const written = await recordEndpoints(tx, row.id, listings, now);
        await tx.update(models).set({
          endpointStatus: written > 0 ? "discovered" : "empty",
          endpointSyncedAt: now,
          updatedAt: now,
        }).where(eq(models.id, row.id));
      } else if (endpointDiscovery.failed.has(row.id)) {
        await tx.update(models).set({ endpointStatus: "failed", updatedAt: now }).where(eq(models.id, row.id));
      }
    }
    const acceptedIds = normalized.rows.map((row) => row.id);
    const missing = await tx.update(models).set({ discoveryStatus: "missing", updatedAt: now })
      .where(and(eq(models.discoveryStatus, "present"), eq(models.provider, "openrouter"), notInArray(models.id, acceptedIds))).returning({ id: models.id });
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
        reason: "Manual OpenRouter catalogue synchronization.",
        requestId,
        before: null,
        after: { status, accepted: normalized.rows.length, invalid: normalized.invalid, changed, missing: missing.length, mode, responseHash },
      });
    }
    return { runId, status, models: normalized.rows.length, invalid: normalized.invalid, changed, missing: missing.length, responseHash };
  });
}

export async function syncOpenRouterCatalog(options: {
  trigger?: CatalogSyncTrigger;
  mode?: CatalogSyncMode;
  actorId?: string;
  requestId?: string;
  correlationId?: string;
  fetchImpl?: typeof fetch;
  modalities?: string[];
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
    const discovered = await fetchOpenRouterCatalog({ fetchImpl: options.fetchImpl, modalities: options.modalities });
    const normalized = normalizeOpenRouterCatalog(discovered.entries);
    // Entries rejected at the wire-schema boundary never reach the normaliser, so their count must be
    // carried forward. Reporting only one of the two would understate a partial sync in the audit log.
    normalized.invalid += discovered.invalid;
    const endpointDiscovery = await discoverEndpoints(normalized.rows, options);
    return await applyCatalogTransaction(run.id, options.actorId, options.correlationId ?? requestId, normalized, discovered.responseHash, mode, new Date(), endpointDiscovery);
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
  const summary = await syncOpenRouterCatalog({
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
