import { createHash } from "node:crypto";
import { and, eq, isNull, lte } from "drizzle-orm";
import { z } from "zod";
import type { AdminPermission } from "@/lib/contracts/admin";
import { assessProductCompatibility, productPolicySchema } from "@/lib/server/ai/compatibility";
import { assertModelCanBeEnabled, validateModelPrice, validateModelQuote } from "@/lib/server/ai/models";
import { modelEndpoints } from "@/lib/server/db/schema";
import { exactDecimalToNano, nanoToDecimal } from "@/lib/server/ai/pricing";
import type { VerifiedIdentity } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { auditEvents, creditPacks, idempotencyRecords, modelPrices, models, profiles, providers } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";

const key = z.string().min(12).max(128).regex(/^[A-Za-z0-9:_-]+$/);
const reason = z.string().trim().min(10).max(500);
const nano = z.number().int().min(0).max(1_000_000_000_000_000).refine(Number.isSafeInteger);
const base = { reason, idempotencyKey: key };
export const adminMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_user_status"), userId: z.uuid(), status: z.enum(["active", "suspended"]), expectedStatus: z.enum(["active", "suspended"]), ...base }).strict(),
  z.object({ action: z.literal("set_provider_enabled"), providerId: z.string().min(1).max(100), enabled: z.boolean(), expectedEnabled: z.boolean(), ...base }).strict(),
  z.object({ action: z.literal("set_model_enabled"), modelId: z.string().min(1).max(320), enabled: z.boolean(), expectedEnabled: z.boolean(), ...base }).strict(),
  z.object({ action: z.literal("set_model_compatibility"), modelId: z.string().min(1).max(320), product: z.enum(["chat", "image", "video", "website"]), expectedCompatibilityVersion: z.number().int().min(0), policy: productPolicySchema, ...base }).strict(),
  z.object({ action: z.literal("run_catalog_sync"), mode: z.enum(["full", "incremental"]).default("full"), ...base }).strict(),
  z.object({ action: z.literal("set_pack_enabled"), packId: z.enum(["creator", "pro", "studio"]), enabled: z.boolean(), expectedEnabled: z.boolean(), ...base }).strict(),
  z.object({ action: z.literal("create_price_version"), modelId: z.string().min(1).max(320), expectedCurrentPriceId: z.uuid().nullable(), inputNanoUsdPerToken: nano.nullable(), outputNanoUsdPerToken: nano.nullable(), operationNanoUsd: nano.nullable(), pricingData: z.record(z.string(), z.unknown()).nullable().optional(), ...base }).strict(),
]);
export type AdminMutation = z.infer<typeof adminMutationSchema>;

export function adminMutationPermission(action: AdminMutation["action"]): AdminPermission {
  if (action === "set_user_status") return "users:manage";
  if (["set_provider_enabled", "set_model_enabled", "set_model_compatibility", "run_catalog_sync"].includes(action)) return "catalog:manage";
  return "pricing:manage";
}

function projectedNano(value: unknown): number | null {
  if (typeof value !== "string") return null;
  try {
    const projected = exactDecimalToNano(value);
    return projected != null && projected <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(projected) : null;
  } catch {
    return null;
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => `${JSON.stringify(name)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

const storedResultSchema = z.object({ targetId: z.string(), changed: z.boolean() });
type MutationResult = { action: AdminMutation["action"]; targetId: string; changed: boolean; duplicate: boolean };

export async function applyAdminMutation(admin: VerifiedIdentity, rawInput: unknown, requestId: string): Promise<MutationResult> {
  const input = adminMutationSchema.parse(rawInput);
  if (input.action === "run_catalog_sync") throw new AppError("bad_request", 400, "Catalogue sync is executed by the admin action route outside the mutation transaction.");
  const { idempotencyKey, ...operationInput } = input;
  const requestSha256 = createHash("sha256").update(stableJson(operationInput)).digest("hex");
  return getDb().transaction(async (tx) => {
    const [newRecord] = await tx.insert(idempotencyRecords).values({ actorId: admin.userId, operation: input.action, key: idempotencyKey, requestSha256 }).onConflictDoNothing().returning({ id: idempotencyRecords.id });
    if (!newRecord) {
      const [existing] = await tx.select().from(idempotencyRecords).where(and(eq(idempotencyRecords.actorId, admin.userId), eq(idempotencyRecords.operation, input.action), eq(idempotencyRecords.key, idempotencyKey))).for("update").limit(1);
      if (!existing || existing.requestSha256 !== requestSha256) throw new AppError("conflict", 409, "This request key was already used for a different admin operation.");
      const previous = storedResultSchema.parse(existing.responseBody);
      return { action: input.action, ...previous, duplicate: true };
    }

    let result: { targetId: string; changed: boolean };
    if (input.action === "set_user_status") {
      if (input.userId === admin.userId) throw new AppError("conflict", 409, "Own-account suspension requires a separate break-glass procedure.");
      const [current] = await tx.select().from(profiles).where(eq(profiles.id, input.userId)).for("update").limit(1);
      if (!current) throw new AppError("not_found", 404, "The user was not found.");
      if (current.status !== input.expectedStatus) throw new AppError("conflict", 409, "The user status changed. Refresh before retrying.");
      const changed = current.status !== input.status;
      if (changed) await tx.update(profiles).set({ status: input.status, updatedAt: new Date() }).where(eq(profiles.id, current.id));
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "profile", targetId: current.id, reason: input.reason, requestId, before: { status: current.status }, after: { status: input.status, changed } });
      result = { targetId: current.id, changed };
    } else if (input.action === "set_provider_enabled") {
      const [current] = await tx.select().from(providers).where(eq(providers.id, input.providerId)).for("update").limit(1);
      if (!current) throw new AppError("not_found", 404, "The provider was not found.");
      if (current.enabled !== input.expectedEnabled) throw new AppError("conflict", 409, "The provider state changed. Refresh before retrying.");
      const changed = current.enabled !== input.enabled;
      if (changed) await tx.update(providers).set({ enabled: input.enabled, updatedAt: new Date() }).where(eq(providers.id, current.id));
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "provider", targetId: current.id, reason: input.reason, requestId, before: { enabled: current.enabled }, after: { enabled: input.enabled, changed } });
      result = { targetId: current.id, changed };
    } else if (input.action === "set_pack_enabled") {
      const [current] = await tx.select().from(creditPacks).where(eq(creditPacks.id, input.packId)).for("update").limit(1);
      if (!current) throw new AppError("not_found", 404, "The credit pack was not found.");
      if (current.enabled !== input.expectedEnabled) throw new AppError("conflict", 409, "The pack state changed. Refresh before retrying.");
      const changed = current.enabled !== input.enabled;
      if (changed) await tx.update(creditPacks).set({ enabled: input.enabled, updatedAt: new Date() }).where(eq(creditPacks.id, current.id));
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "credit_pack", targetId: current.id, reason: input.reason, requestId, before: { enabled: current.enabled }, after: { enabled: input.enabled, changed } });
      result = { targetId: current.id, changed };
    } else if (input.action === "set_model_enabled") {
      const [current] = await tx.select({ model: models, providerEnabled: providers.enabled }).from(models).innerJoin(providers, eq(models.providerId, providers.id)).where(eq(models.id, input.modelId)).for("update").limit(1);
      if (!current) throw new AppError("not_found", 404, "The model was not found.");
      if (current.model.enabled !== input.expectedEnabled) throw new AppError("conflict", 409, "The model state changed. Refresh before retrying.");
      const [price] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, current.model.id), isNull(modelPrices.effectiveTo), lte(modelPrices.effectiveFrom, new Date()))).limit(1);
      if (input.enabled) {
        const approvedEndpoints = await tx.select({ id: modelEndpoints.id }).from(modelEndpoints).where(and(
          eq(modelEndpoints.modelId, current.model.id),
          eq(modelEndpoints.approved, true),
          eq(modelEndpoints.enabled, true),
        ));
        const eligibility = await assertModelCanBeEnabled(current.model, current.providerEnabled, price, approvedEndpoints.length);
        if (!eligibility.ok) throw new AppError("conflict", 409, eligibility.reason ?? "The model is not eligible for customer routing.");
      }
      const changed = current.model.enabled !== input.enabled;
      if (changed) await tx.update(models).set({ enabled: input.enabled, updatedAt: new Date() }).where(eq(models.id, current.model.id));
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "model", targetId: current.model.id, reason: input.reason, requestId, before: { enabled: current.model.enabled }, after: { enabled: input.enabled, changed } });
      result = { targetId: current.model.id, changed };
    } else if (input.action === "set_model_compatibility") {
      const [current] = await tx.select().from(models).where(eq(models.id, input.modelId)).for("update").limit(1);
      if (!current) throw new AppError("not_found", 404, "The model was not found.");
      if (current.compatibilityVersion !== input.expectedCompatibilityVersion) throw new AppError("conflict", 409, "The compatibility policy changed. Refresh before retrying.");
      const allowedParameters = input.product === "chat" || input.product === "website"
        ? ["maxOutputTokens"]
        : input.product === "image" ? ["sizes", "aspectRatios", "seed"] : ["durations", "aspectRatios", "resolutions", "resolutionPricing", "generateAudio"];
      const unexpected = Object.keys(input.policy.parameters).filter((name) => !allowedParameters.includes(name));
      if (unexpected.length) throw new AppError("bad_request", 422, `Policy fields do not apply to ${input.product}: ${unexpected.join(", ")}.`);
      const nextCompatibility = { ...current.productCompatibility, [input.product]: input.policy };
      const candidate = { ...current, productCompatibility: nextCompatibility };
      if (!input.policy.disabled) {
        const assessment = assessProductCompatibility({ kind: candidate.kind, catalogType: candidate.catalogType, gatewayMetadata: candidate.gatewayMetadata, productCompatibility: candidate.productCompatibility }, input.product);
        if (!assessment.supported) throw new AppError("conflict", 409, assessment.reason ?? "The model cannot support this product route.");
      } else if (current.enabled && current.kind === input.product) {
        throw new AppError("conflict", 409, "Disable the model before disabling its primary product route.");
      }
      if (current.enabled && !input.policy.disabled) {
        const [price] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, current.id), isNull(modelPrices.effectiveTo), lte(modelPrices.effectiveFrom, new Date()))).limit(1);
        const validation = await validateModelQuote(candidate, input.product, price);
        if (!validation.ok) throw new AppError("conflict", 409, validation.reason ?? "The enabled model would no longer have an exact quote.");
      }
      const changed = stableJson(current.productCompatibility[input.product] ?? null) !== stableJson(input.policy);
      if (changed) await tx.update(models).set({ productCompatibility: nextCompatibility, compatibilityVersion: current.compatibilityVersion + 1, updatedAt: new Date() }).where(eq(models.id, current.id));
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "model", targetId: current.id, reason: input.reason, requestId, before: { product: input.product, policy: current.productCompatibility[input.product] ?? null, version: current.compatibilityVersion }, after: { product: input.product, policy: input.policy, version: current.compatibilityVersion + (changed ? 1 : 0), changed } });
      result = { targetId: current.id, changed };
    } else {
      const [model] = await tx.select().from(models).where(eq(models.id, input.modelId)).for("update").limit(1);
      if (!model) throw new AppError("not_found", 404, "The model was not found.");
      if (!model.kind) throw new AppError("bad_request", 422, "An unknown or reference-only model cannot receive a customer quote.");
      let pricingData = input.pricingData ?? null;
      let inputNano = input.inputNanoUsdPerToken;
      let outputNano = input.outputNanoUsdPerToken;
      let operationNano = input.operationNanoUsd;
      if (pricingData) {
        if (inputNano !== null || outputNano !== null || operationNano !== null) throw new AppError("bad_request", 422, "Raw pricing and legacy nano-USD projections cannot be supplied independently.");
        inputNano = projectedNano(pricingData.input);
        outputNano = projectedNano(pricingData.output);
        operationNano = projectedNano(pricingData.image);
      } else {
        pricingData = Object.fromEntries(Object.entries({ input: nanoToDecimal(inputNano), output: nanoToDecimal(outputNano), image: nanoToDecimal(operationNano) }).filter((entry): entry is [string, string] => entry[1] !== null));
      }
      const textModel = model.kind === "chat" || model.kind === "website";
      const validShape = textModel
        ? inputNano !== null && outputNano !== null && operationNano === null
        : model.kind === "image" ? operationNano !== null && inputNano === null && outputNano === null : input.pricingData != null;
      if (!validShape) throw new AppError("bad_request", 422, "Price fields do not match the model operation type; video requires raw duration pricing.");
      const validation = validateModelPrice(model, { inputNanoUsdPerToken: inputNano, outputNanoUsdPerToken: outputNano, operationNanoUsd: operationNano, pricingData }, model.kind);
      if (!validation.ok) throw new AppError("bad_request", 422, validation.reason ?? "The price cannot quote this model exactly.");
      const [current] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, model.id), isNull(modelPrices.effectiveTo), lte(modelPrices.effectiveFrom, new Date()))).limit(1);
      if ((current?.id ?? null) !== input.expectedCurrentPriceId) throw new AppError("conflict", 409, "The current price changed. Refresh before creating a version.");
      const effectiveAt = new Date();
      if (current) await tx.update(modelPrices).set({ effectiveTo: effectiveAt }).where(eq(modelPrices.id, current.id));
      const [created] = await tx.insert(modelPrices).values({ modelId: model.id, inputNanoUsdPerToken: inputNano, outputNanoUsdPerToken: outputNano, operationNanoUsd: operationNano, pricingData, source: "admin_manual", effectiveFrom: effectiveAt }).returning();
      if (!created) throw new Error("Price version insert returned no row.");
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "model_price", targetId: created.id, reason: input.reason, requestId, before: current ? { id: current.id, inputNanoUsdPerToken: current.inputNanoUsdPerToken, outputNanoUsdPerToken: current.outputNanoUsdPerToken, operationNanoUsd: current.operationNanoUsd, pricingData: current.pricingData, effectiveTo: current.effectiveTo?.toISOString() ?? null } : null, after: { id: created.id, modelId: model.id, inputNanoUsdPerToken: created.inputNanoUsdPerToken, outputNanoUsdPerToken: created.outputNanoUsdPerToken, operationNanoUsd: created.operationNanoUsd, pricingData: created.pricingData, effectiveFrom: effectiveAt.toISOString() } });
      result = { targetId: created.id, changed: true };
    }

    await tx.update(idempotencyRecords).set({ responseStatus: 200, responseBody: result, lockedUntil: null, updatedAt: new Date() }).where(eq(idempotencyRecords.id, newRecord.id));
    return { action: input.action, ...result, duplicate: false };
  });
}
