import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import { count, sum } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { auditEvents, catalogSyncRuns, creditPacks, creditReservations, generationJobs, modelPrices, models, payments, profiles, providers, usageEvents, walletLedger, wallets, websiteProjects } from "@/lib/server/db/schema";
import { requireAdmin } from "@/lib/server/auth/guards";
import type { AdminPermission } from "@/lib/contracts/admin";
import { readServerEnvironment } from "@/lib/server/env";

export type AdminSection = "overview" | "users" | "models" | "providers" | "pricing" | "usage" | "jobs" | "websites" | "packs" | "payments" | "transactions" | "adjustments" | "settings";
export type AdminTable = { columns: string[]; rows: { id: string; cells: (string | number | null)[] }[] };
export type AdminToggleControl = { action: "set_provider_enabled" | "set_model_enabled" | "set_pack_enabled"; targetId: string; label: string; enabled: boolean };
export type AdminUserControl = { userId: string; label: string; status: "active" | "suspended" | "deleted" };
export type AdminPriceModel = { modelId: string; label: string; kind: "chat" | "image" | "video" | "website" | null; currentPriceId: string | null; input: number | null; output: number | null; operation: number | null; pricingData: Record<string, unknown> | null };
export type AdminCompatibilityModel = { modelId: string; label: string; kind: "chat" | "image" | "video" | "website" | null; catalogType: string; discoveryStatus: string; compatibilityVersion: number; productCompatibility: Record<string, unknown> };
export type AdminSyncRun = { id: string; status: string; trigger: string; mode: string; accepted: number; invalid: number; changed: number; missing: number; startedAt: string | null; finishedAt: string | null; error: string | null };
export type AdminPageData = {
  title: string;
  description: string;
  metrics: { label: string; value: string; detail?: string }[];
  table: AdminTable;
  tableTitle: string;
  notice?: string;
  adjustmentUsers?: { id: string; email: string; balance: number }[];
  canAdjust?: boolean;
  toggleControls?: AdminToggleControl[];
  userControls?: AdminUserControl[];
  priceModels?: AdminPriceModel[];
  compatibilityModels?: AdminCompatibilityModel[];
  syncRuns?: AdminSyncRun[];
  canSync?: boolean;
};
const permissions: Record<AdminSection, AdminPermission> = { overview: "admin:read", users: "users:read", models: "catalog:read", providers: "catalog:read", pricing: "pricing:read", usage: "usage:read", jobs: "jobs:read", websites: "websites:read", packs: "pricing:read", payments: "payments:read", transactions: "credits:read", adjustments: "credits:read", settings: "settings:read" };
const iso = (value: Date | null) => value?.toISOString() ?? null;
const money = (cents: number | null) => cents === null ? "—" : `$${(cents / 100).toFixed(2)}`;

async function scalar(query: Promise<{ value: number | string | null }[]>) {
  const rows = await query;
  return Number(rows[0]?.value ?? 0);
}

export async function getAdminSection(section: AdminSection): Promise<AdminPageData> {
  const identity = await requireAdmin(permissions[section]);
  const db = getDb();
  if (section === "overview") {
    const can = (permission: AdminPermission) => identity.permissions.has(permission);
    const [users, activeJobs, reconciliations, revenue, used, audits] = await Promise.all([
      can("users:read") ? scalar(db.select({ value: count() }).from(profiles)) : Promise.resolve(null),
      can("jobs:read") ? scalar(db.select({ value: count() }).from(generationJobs).where(inArray(generationJobs.status, ["queued", "running", "awaiting_provider"]))) : Promise.resolve(null),
      can("jobs:read") ? scalar(db.select({ value: count() }).from(generationJobs).where(eq(generationJobs.status, "reconciliation_required"))) : Promise.resolve(null),
      can("payments:read") ? scalar(db.select({ value: sum(payments.totalUsdCents) }).from(payments).where(eq(payments.status, "succeeded"))) : Promise.resolve(null),
      can("credits:read") ? scalar(db.select({ value: sum(wallets.lifetimeUsedCredits) }).from(wallets)) : Promise.resolve(null),
      can("audit:read") ? db.select({ id: auditEvents.id, action: auditEvents.action, targetType: auditEvents.targetType, targetId: auditEvents.targetId, reason: auditEvents.reason, createdAt: auditEvents.createdAt }).from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(20) : Promise.resolve(null),
    ]);
    const metrics: AdminPageData["metrics"] = [];
    if (users !== null) metrics.push({ label: "Registered users", value: users.toLocaleString() });
    if (activeJobs !== null) metrics.push({ label: "Active generation jobs", value: activeJobs.toLocaleString() });
    if (reconciliations !== null) metrics.push({ label: "Generation reconciliations", value: reconciliations.toLocaleString() });
    if (revenue !== null) metrics.push({ label: "Successful payment total", value: money(revenue), detail: "Tax-inclusive captured totals marked succeeded" });
    if (used !== null) metrics.push({ label: "Lifetime credits used", value: used.toLocaleString() });
    return { title: "Platform overview", description: "Permission-filtered live aggregates. Financial figures are database aggregates, not accounting-recognized revenue; unauthorized datasets are omitted.", metrics, tableTitle: audits === null ? "Operational scope" : "Recent audit events", table: audits === null ? { columns: ["Scope"], rows: [{ id: "limited", cells: ["Only aggregates covered by your active permissions are shown. Audit records require audit:read."] }] } : { columns: ["Action", "Target", "Reason", "Recorded"], rows: audits.map((row) => ({ id: row.id, cells: [row.action, `${row.targetType}:${row.targetId}`, row.reason, iso(row.createdAt)] })) } };
  }
  if (section === "users") {
    const rows = await db.select({ id: profiles.id, email: profiles.email, name: profiles.displayName, status: profiles.status, createdAt: profiles.createdAt, available: wallets.availableCredits, reserved: wallets.reservedCredits }).from(profiles).leftJoin(wallets, eq(profiles.id, wallets.userId)).orderBy(desc(profiles.createdAt)).limit(100);
    return { title: "Users", description: "Permission-checked customer profiles and wallet balances. No prompts, generated source or auth secrets are exposed.", metrics: [{ label: "Profiles shown", value: rows.length.toLocaleString() }], tableTitle: "Customer accounts", table: { columns: ["User", "Email", "Status", "Available", "Reserved", "Created"], rows: rows.map((row) => ({ id: row.id, cells: [row.name || row.id, row.email, row.status, row.available ?? 0, row.reserved ?? 0, iso(row.createdAt)] })) }, adjustmentUsers: rows.map((row) => ({ id: row.id, email: row.email, balance: row.available ?? 0 })), canAdjust: identity.permissions.has("credits:adjust"), userControls: identity.permissions.has("users:manage") ? rows.filter((row) => row.status !== "deleted").map((row) => ({ userId: row.id, label: row.email, status: row.status })) : [] };
  }
  if (section === "models" || section === "providers") {
    if (section === "providers") {
      const rows = await db.select().from(providers).orderBy(providers.id);
      return { title: "AI providers", description: "Catalog enablement only. No credentials or live health claim is inferred from these records.", metrics: [{ label: "Enabled providers", value: rows.filter((row) => row.enabled).length.toLocaleString() }], tableTitle: "Provider catalog", table: { columns: ["ID", "Name", "Enabled", "Updated"], rows: rows.map((row) => ({ id: row.id, cells: [row.id, row.name, row.enabled ? "yes" : "no", iso(row.updatedAt)] })) }, toggleControls: identity.permissions.has("catalog:manage") ? rows.map((row) => ({ action: "set_provider_enabled" as const, targetId: row.id, label: row.name, enabled: row.enabled })) : [] };
    }
    const canManage = identity.permissions.has("catalog:manage");
    const [rows, runs] = await Promise.all([
      db.select({ id: models.id, gatewayId: models.gatewayModelId, name: models.name, kind: models.kind, catalogType: models.catalogType, discoveryStatus: models.discoveryStatus, compatibilityVersion: models.compatibilityVersion, productCompatibility: models.productCompatibility, provider: providers.name, enabled: models.enabled, updatedAt: models.updatedAt }).from(models).innerJoin(providers, eq(models.providerId, providers.id)).orderBy(models.id).limit(100),
      canManage ? db.select().from(catalogSyncRuns).orderBy(desc(catalogSyncRuns.startedAt)).limit(10) : Promise.resolve([]),
    ]);
    return {
      title: "AI models",
      description: "Live Gateway discovery, disabled-by-default mappings, reviewed product compatibility, and synchronized price history. Reference/missing records remain historical.",
      metrics: [{ label: "Enabled models shown", value: rows.filter((row) => row.enabled).length.toLocaleString() }, { label: "Reference/missing shown", value: rows.filter((row) => row.discoveryStatus !== "present").length.toLocaleString() }],
      tableTitle: "Model catalog",
      table: { columns: ["Model", "Catalog type", "Product", "Provider", "Gateway ID", "Discovery", "Enabled", "Updated"], rows: rows.map((row) => ({ id: row.id, cells: [row.name, row.catalogType, row.kind, row.provider, row.gatewayId, row.discoveryStatus, row.enabled ? "yes" : "no", iso(row.updatedAt)] })) },
      toggleControls: canManage ? rows.map((row) => ({ action: "set_model_enabled" as const, targetId: row.id, label: row.name, enabled: row.enabled })) : [],
      compatibilityModels: canManage ? rows.map((row) => ({ modelId: row.id, label: row.name, kind: row.kind, catalogType: row.catalogType, discoveryStatus: row.discoveryStatus, compatibilityVersion: row.compatibilityVersion, productCompatibility: row.productCompatibility })) : [],
      canSync: canManage,
      syncRuns: runs.map((run) => ({ id: run.id, status: run.status, trigger: run.trigger, mode: run.mode, accepted: run.acceptedCount, invalid: run.invalidCount, changed: run.changedCount, missing: run.missingCount, startedAt: iso(run.startedAt), finishedAt: iso(run.finishedAt), error: run.error })),
    };
  }
  if (section === "pricing") {
    const now = new Date();
    const [rows, priceModels] = await Promise.all([
      db.select({ id: modelPrices.id, modelId: modelPrices.modelId, input: modelPrices.inputNanoUsdPerToken, output: modelPrices.outputNanoUsdPerToken, operation: modelPrices.operationNanoUsd, pricingData: modelPrices.pricingData, source: modelPrices.source, from: modelPrices.effectiveFrom, to: modelPrices.effectiveTo }).from(modelPrices).orderBy(desc(modelPrices.effectiveFrom)).limit(100),
      identity.permissions.has("pricing:manage") ? db.select({ modelId: models.id, name: models.name, kind: models.kind, currentPriceId: modelPrices.id, input: modelPrices.inputNanoUsdPerToken, output: modelPrices.outputNanoUsdPerToken, operation: modelPrices.operationNanoUsd, pricingData: modelPrices.pricingData }).from(models).leftJoin(modelPrices, and(eq(modelPrices.modelId, models.id), isNull(modelPrices.effectiveTo), lte(modelPrices.effectiveFrom, now))).orderBy(models.id).limit(100) : Promise.resolve([]),
    ]);
    return { title: "Model pricing", description: "Restricted estimate-pricing inputs in nanodollars. Actual billing always uses verified Gateway generation cost.", metrics: [{ label: "Current prices", value: rows.filter((row) => !row.to).length.toLocaleString() }], tableTitle: "Price versions", table: { columns: ["Model", "Input/token", "Output/token", "Operation", "Source", "Effective from", "Effective to"], rows: rows.map((row) => ({ id: row.id, cells: [row.modelId, row.input, row.output, row.operation, row.source, iso(row.from), iso(row.to)] })) }, priceModels: priceModels.map((row) => ({ modelId: row.modelId, label: row.name, kind: row.kind, currentPriceId: row.currentPriceId, input: row.input, output: row.output, operation: row.operation, pricingData: row.pricingData })) };
  }
  if (section === "usage") {
    const rows = await db.select({ id: usageEvents.id, userId: usageEvents.userId, jobId: usageEvents.generationJobId, gatewayGenerationId: usageEvents.gatewayGenerationId, product: generationJobs.kind, modelId: generationJobs.modelId, source: usageEvents.source, actualCost: usageEvents.actualCostUsd, charged: usageEvents.chargedCredits, reconciliation: usageEvents.reconciliationStatus, createdAt: usageEvents.createdAt }).from(usageEvents).innerJoin(generationJobs, eq(usageEvents.generationJobId, generationJobs.id)).orderBy(desc(usageEvents.createdAt)).limit(100);
    const actualTotal = rows.reduce((total, row) => total + (row.actualCost ? Number(row.actualCost) : 0), 0);
    return { title: "AI usage & costs", description: "Restricted actual metering records joined to safe job model/product metadata. Estimates are not treated as actuals; totals cover only the bounded rows shown.", metrics: [{ label: "Reconciliation required", value: rows.filter((row) => row.reconciliation === "required").length.toLocaleString() }, { label: "Actual USD shown", value: actualTotal.toFixed(8) }], tableTitle: "Usage events", table: { columns: ["Job", "Gateway generation", "User", "Product", "Model", "Source", "Actual USD", "Charged credits", "Reconciliation", "Created"], rows: rows.map((row) => ({ id: row.id, cells: [row.jobId, row.gatewayGenerationId, row.userId, row.product, row.modelId, row.source, row.actualCost, row.charged, row.reconciliation, iso(row.createdAt)] })) } };
  }
  if (section === "jobs") {
    const rows = await db.select({ id: generationJobs.id, userId: generationJobs.userId, kind: generationJobs.kind, modelId: generationJobs.modelId, status: generationJobs.status, error: generationJobs.errorCode, estimate: creditReservations.estimatedCredits, actual: creditReservations.actualCredits, createdAt: generationJobs.createdAt }).from(generationJobs).leftJoin(creditReservations, eq(generationJobs.reservationId, creditReservations.id)).orderBy(desc(generationJobs.createdAt)).limit(100);
    return { title: "Generation jobs", description: "Safe job metadata only. Raw prompts, provider operations and generated source are excluded. No blind charged retry is offered.", metrics: [{ label: "Reconciliation required", value: rows.filter((row) => row.status === "reconciliation_required").length.toLocaleString() }], tableTitle: "Recent jobs", table: { columns: ["Job", "User", "Kind", "Model", "Status", "Error", "Estimate", "Actual", "Created"], rows: rows.map((row) => ({ id: row.id, cells: [row.id, row.userId, row.kind, row.modelId, row.status, row.error, row.estimate, row.actual, iso(row.createdAt)] })) } };
  }
  if (section === "websites") {
    const rows = await db.select({ id: websiteProjects.id, userId: websiteProjects.userId, name: websiteProjects.name, slug: websiteProjects.slug, status: websiteProjects.status, updatedAt: websiteProjects.updatedAt }).from(websiteProjects).orderBy(desc(websiteProjects.updatedAt)).limit(100);
    return { title: "Website projects", description: "Project status without customer source code, sandbox diagnostics or signed asset URLs.", metrics: [{ label: "Failed projects", value: rows.filter((row) => row.status === "failed").length.toLocaleString() }], tableTitle: "Projects", table: { columns: ["Project", "User", "Slug", "Status", "Updated"], rows: rows.map((row) => ({ id: row.id, cells: [row.name, row.userId, row.slug, row.status, iso(row.updatedAt)] })) } };
  }
  if (section === "packs") {
    const rows = await db.select().from(creditPacks).orderBy(creditPacks.subtotalUsdCents);
    return { title: "Credit packages", description: "Fixed one-time pack values. Credits represent usage value, not received revenue.", metrics: [{ label: "Enabled packs", value: rows.filter((row) => row.enabled).length.toLocaleString() }], tableTitle: "Pack catalog", table: { columns: ["Pack", "Name", "Credits", "Pre-tax USD", "Enabled"], rows: rows.map((row) => ({ id: row.id, cells: [row.id, row.name, row.credits, money(row.subtotalUsdCents), row.enabled ? "yes" : "no"] })) }, toggleControls: identity.permissions.has("pricing:manage") ? rows.map((row) => ({ action: "set_pack_enabled" as const, targetId: row.id, label: row.name, enabled: row.enabled })) : [] };
  }
  if (section === "payments") {
    const rows = await db.select({ id: payments.id, purchaseId: payments.purchaseId, userId: payments.userId, status: payments.status, subtotal: payments.subtotalUsdCents, tax: payments.taxUsdCents, total: payments.totalUsdCents, reason: payments.reconciliationReason, fulfilledAt: payments.fulfilledAt, createdAt: payments.createdAt }).from(payments).orderBy(desc(payments.createdAt)).limit(100);
    return { title: "Payments", description: "Payment state and fulfillment metadata. Manual fulfillment is intentionally unavailable; signed webhook evidence is required.", metrics: [{ label: "Reconciliation required", value: rows.filter((row) => row.status === "reconciliation_required").length.toLocaleString() }], tableTitle: "Payment records", table: { columns: ["Payment", "Purchase", "User", "Status", "Subtotal", "Tax", "Total", "Reason", "Fulfilled", "Created"], rows: rows.map((row) => ({ id: row.id, cells: [row.id, row.purchaseId, row.userId, row.status, money(row.subtotal), money(row.tax), money(row.total), row.reason, iso(row.fulfilledAt), iso(row.createdAt)] })) } };
  }
  if (section === "transactions" || section === "adjustments") {
    const conditions = section === "adjustments" ? inArray(walletLedger.kind, ["admin_adjustment", "refund_reversal", "chargeback_reversal", "compensation"]) : undefined;
    const rows = await db.select({ id: walletLedger.id, userId: walletLedger.userId, kind: walletLedger.kind, available: walletLedger.availableDeltaCredits, reserved: walletLedger.reservedDeltaCredits, after: walletLedger.availableAfterCredits, description: walletLedger.description, createdAt: walletLedger.createdAt }).from(walletLedger).where(conditions).orderBy(desc(walletLedger.createdAt)).limit(100);
    return { title: section === "adjustments" ? "Adjustments & disputes" : "Transactions", description: section === "adjustments" ? "Append-only administrative and reversal movements. New adjustments require AAL2, a substantive reason and audit persistence." : "Restricted append-only wallet movements across customer accounts.", metrics: [{ label: "Movements shown", value: rows.length.toLocaleString() }], tableTitle: section === "adjustments" ? "Adjustment and reversal ledger" : "Wallet ledger", table: { columns: ["Entry", "User", "Kind", "Available delta", "Reserved delta", "Available after", "Description", "Created"], rows: rows.map((row) => ({ id: row.id, cells: [row.id, row.userId, row.kind, row.available, row.reserved, row.after, row.description, iso(row.createdAt)] })) } };
  }
  const env = readServerEnvironment();
  const integrations: [string, boolean][] = [["Supabase", Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && env.DATABASE_URL)], ["Dodo test/live configuration", Boolean(env.DODO_PAYMENTS_API_KEY && env.DODO_PAYMENTS_WEBHOOK_KEY)], ["AI Gateway", Boolean(env.AI_GATEWAY_API_KEY)], ["Cloudflare R2", Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET)], ["Inngest", Boolean(env.INNGEST_EVENT_KEY && env.INNGEST_SIGNING_KEY)], ["E2B", Boolean(env.E2B_API_KEY)], ["Vercel", Boolean(env.VERCEL_API_TOKEN)], ["Resend", Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)]];
  return { title: "Admin settings", description: "Non-secret integration readiness. Presence of environment values does not prove a successful live connection.", metrics: [], tableTitle: "Integration configuration presence", table: { columns: ["Integration", "Required values present"], rows: integrations.map(([name, ready]) => ({ id: String(name), cells: [name, ready ? "yes" : "no"] })) }, notice: `Dodo mode: ${env.DODO_PAYMENTS_ENVIRONMENT}. Vercel target: ${env.VERCEL_DEPLOY_TARGET}. No secret values are returned.` };
}
