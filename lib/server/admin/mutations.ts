import { createHash } from "node:crypto";
import { and, eq, isNull, lte } from "drizzle-orm";
import { z } from "zod";
import type { AdminPermission } from "@/lib/contracts/admin";
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
  z.object({ action: z.literal("set_pack_enabled"), packId: z.enum(["creator", "pro", "studio"]), enabled: z.boolean(), expectedEnabled: z.boolean(), ...base }).strict(),
  z.object({ action: z.literal("create_price_version"), modelId: z.string().min(1).max(320), expectedCurrentPriceId: z.uuid().nullable(), inputNanoUsdPerToken: nano.nullable(), outputNanoUsdPerToken: nano.nullable(), operationNanoUsd: nano.nullable(), ...base }).strict(),
]);
export type AdminMutation = z.infer<typeof adminMutationSchema>;

export function adminMutationPermission(action: AdminMutation["action"]): AdminPermission {
  if (action === "set_user_status") return "users:manage";
  if (action === "set_provider_enabled" || action === "set_model_enabled") return "catalog:manage";
  return "pricing:manage";
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
      if (input.enabled && !current.providerEnabled) throw new AppError("conflict", 409, "Enable the provider before enabling this model.");
      const [price] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, current.model.id), isNull(modelPrices.effectiveTo), lte(modelPrices.effectiveFrom, new Date()))).limit(1);
      const validPrice = current.model.kind === "image" || current.model.kind === "video" ? price?.operationNanoUsd !== null && price !== undefined : price?.inputNanoUsdPerToken !== null && price?.outputNanoUsdPerToken !== null && price !== undefined;
      if (input.enabled && !validPrice) throw new AppError("conflict", 409, "A current exact model price is required before enablement.");
      const changed = current.model.enabled !== input.enabled;
      if (changed) await tx.update(models).set({ enabled: input.enabled, updatedAt: new Date() }).where(eq(models.id, current.model.id));
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "model", targetId: current.model.id, reason: input.reason, requestId, before: { enabled: current.model.enabled }, after: { enabled: input.enabled, changed } });
      result = { targetId: current.model.id, changed };
    } else {
      const [model] = await tx.select().from(models).where(eq(models.id, input.modelId)).for("update").limit(1);
      if (!model) throw new AppError("not_found", 404, "The model was not found.");
      const textModel = model.kind === "chat" || model.kind === "website";
      const validShape = textModel
        ? input.inputNanoUsdPerToken !== null && input.outputNanoUsdPerToken !== null && input.operationNanoUsd === null
        : input.operationNanoUsd !== null && input.inputNanoUsdPerToken === null && input.outputNanoUsdPerToken === null;
      if (!validShape) throw new AppError("bad_request", 422, "Price fields do not match the model operation type.");
      const [current] = await tx.select().from(modelPrices).where(and(eq(modelPrices.modelId, model.id), isNull(modelPrices.effectiveTo), lte(modelPrices.effectiveFrom, new Date()))).limit(1);
      if ((current?.id ?? null) !== input.expectedCurrentPriceId) throw new AppError("conflict", 409, "The current price changed. Refresh before creating a version.");
      const effectiveAt = new Date();
      if (current) await tx.update(modelPrices).set({ effectiveTo: effectiveAt }).where(eq(modelPrices.id, current.id));
      const [created] = await tx.insert(modelPrices).values({ modelId: model.id, inputNanoUsdPerToken: input.inputNanoUsdPerToken, outputNanoUsdPerToken: input.outputNanoUsdPerToken, operationNanoUsd: input.operationNanoUsd, source: "admin_manual", effectiveFrom: effectiveAt }).returning();
      if (!created) throw new Error("Price version insert returned no row.");
      await tx.insert(auditEvents).values({ actorId: admin.userId, action: input.action, targetType: "model_price", targetId: created.id, reason: input.reason, requestId, before: current ? { id: current.id, inputNanoUsdPerToken: current.inputNanoUsdPerToken, outputNanoUsdPerToken: current.outputNanoUsdPerToken, operationNanoUsd: current.operationNanoUsd, effectiveTo: current.effectiveTo?.toISOString() ?? null } : null, after: { id: created.id, modelId: model.id, inputNanoUsdPerToken: created.inputNanoUsdPerToken, outputNanoUsdPerToken: created.outputNanoUsdPerToken, operationNanoUsd: created.operationNanoUsd, effectiveFrom: effectiveAt.toISOString() } });
      result = { targetId: created.id, changed: true };
    }

    await tx.update(idempotencyRecords).set({ responseStatus: 200, responseBody: result, lockedUntil: null, updatedAt: new Date() }).where(eq(idempotencyRecords.id, newRecord.id));
    return { action: input.action, ...result, duplicate: false };
  });
}
