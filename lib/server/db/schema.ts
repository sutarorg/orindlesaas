import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgPolicy,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const authUsers = pgSchema("auth").table("users", { id: uuid("id").primaryKey() });
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
const safeCredits = (name: string) => bigint(name, { mode: "number" }).notNull();
const metadata = () => jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull();

export const generationKind = pgEnum("generation_kind", ["chat", "image", "video", "website"]);
export const jobStatus = pgEnum("job_status", [
  "queued",
  "running",
  "awaiting_provider",
  "succeeded",
  "failed",
  "cancelled",
  "reconciliation_required",
]);
export const reservationStatus = pgEnum("reservation_status", ["held", "settled", "released", "reconciliation_required"]);
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
  "disputed",
  "reconciliation_required",
]);
export const ledgerKind = pgEnum("ledger_kind", [
  "purchase",
  "reservation_hold",
  "reservation_release",
  "usage_settlement",
  "admin_adjustment",
  "refund_reversal",
  "chargeback_reversal",
  "compensation",
]);
export const outboxStatus = pgEnum("outbox_status", ["pending", "processing", "published", "failed"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull().default(""),
    avatarUrl: text("avatar_url"),
    status: text("status", { enum: ["active", "suspended", "deleted"] }).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("profiles_email_unique").on(sql`lower(${table.email})`),
    check("profiles_email_nonempty", sql`length(${table.email}) > 3`),
    pgPolicy("profiles_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.id}` }),
  ],
).enableRLS();

export const adminRoles = pgTable(
  "admin_roles",
  {
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["support", "finance", "operations", "admin"] }).notNull(),
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    permissionVersion: integer("permission_version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.role] }),
    pgPolicy("admin_roles_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const wallets = pgTable(
  "wallets",
  {
    userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "restrict" }),
    availableCredits: safeCredits("available_credits").default(0),
    reservedCredits: safeCredits("reserved_credits").default(0),
    lifetimePurchasedCredits: safeCredits("lifetime_purchased_credits").default(0),
    lifetimeUsedCredits: safeCredits("lifetime_used_credits").default(0),
    version: bigint("version", { mode: "number" }).notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check("wallets_available_nonnegative", sql`${table.availableCredits} >= 0`),
    check("wallets_reserved_nonnegative", sql`${table.reservedCredits} >= 0`),
    check("wallets_purchased_nonnegative", sql`${table.lifetimePurchasedCredits} >= 0`),
    check("wallets_used_nonnegative", sql`${table.lifetimeUsedCredits} >= 0`),
    pgPolicy("wallets_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    kind: ledgerKind("kind").notNull(),
    availableDeltaCredits: bigint("available_delta_credits", { mode: "number" }).notNull(),
    reservedDeltaCredits: bigint("reserved_delta_credits", { mode: "number" }).notNull(),
    availableAfterCredits: safeCredits("available_after_credits"),
    reservedAfterCredits: safeCredits("reserved_after_credits"),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    referenceType: text("reference_type").notNull(),
    referenceId: text("reference_id").notNull(),
    correlationId: text("correlation_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    description: text("description").notNull(),
    metadata: metadata(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("wallet_ledger_idempotency_unique").on(table.userId, table.kind, table.idempotencyKey),
    index("wallet_ledger_user_created_idx").on(table.userId, table.createdAt),
    index("wallet_ledger_reference_idx").on(table.referenceType, table.referenceId),
    check("wallet_ledger_delta_nonzero", sql`${table.availableDeltaCredits} <> 0 OR ${table.reservedDeltaCredits} <> 0`),
    check("wallet_ledger_available_after_nonnegative", sql`${table.availableAfterCredits} >= 0`),
    check("wallet_ledger_reserved_after_nonnegative", sql`${table.reservedAfterCredits} >= 0`),
    pgPolicy("wallet_ledger_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const creditReservations = pgTable(
  "credit_reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").unique(),
    estimatedCostUsd: numeric("estimated_cost_usd", { precision: 24, scale: 8 }).notNull(),
    estimatedCredits: safeCredits("estimated_credits"),
    actualCostUsd: numeric("actual_cost_usd", { precision: 24, scale: 8 }),
    actualCredits: bigint("actual_credits", { mode: "number" }),
    status: reservationStatus("status").notNull().default("held"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("credit_reservations_user_key_unique").on(table.userId, table.idempotencyKey),
    index("credit_reservations_status_idx").on(table.status, table.createdAt),
    check("credit_reservations_estimated_cost_nonnegative", sql`${table.estimatedCostUsd} >= 0`),
    check("credit_reservations_estimated_credits_nonnegative", sql`${table.estimatedCredits} >= 0`),
    check("credit_reservations_actual_cost_nonnegative", sql`${table.actualCostUsd} IS NULL OR ${table.actualCostUsd} >= 0`),
    check("credit_reservations_actual_credits_nonnegative", sql`${table.actualCredits} IS NULL OR ${table.actualCredits} >= 0`),
    pgPolicy("credit_reservations_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const creditPacks = pgTable(
  "credit_packs",
  {
    id: text("id", { enum: ["creator", "pro", "studio"] }).primaryKey(),
    name: text("name").notNull(),
    credits: safeCredits("credits"),
    subtotalUsdCents: integer("subtotal_usd_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check("credit_packs_currency_usd", sql`${table.currency} = 'USD'`),
    check(
      "credit_packs_exact_values",
      sql`(${table.id} = 'creator' AND ${table.credits} = 1900 AND ${table.subtotalUsdCents} = 1900) OR (${table.id} = 'pro' AND ${table.credits} = 4900 AND ${table.subtotalUsdCents} = 4900) OR (${table.id} = 'studio' AND ${table.credits} = 9900 AND ${table.subtotalUsdCents} = 9900)`,
    ),
    pgPolicy("credit_packs_read_catalog", { for: "select", to: ["anon", "authenticated"], using: sql`${table.enabled} = true` }),
  ],
).enableRLS();

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    packId: text("pack_id", { enum: ["creator", "pro", "studio"] }).notNull(),
    credits: safeCredits("credits"),
    subtotalUsdCents: integer("subtotal_usd_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    providerProductId: text("provider_product_id").notNull(),
    checkoutSessionId: text("checkout_session_id").unique(),
    checkoutUrl: text("checkout_url"),
    reconciliationReason: text("reconciliation_reason"),
    status: paymentStatus("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("purchases_user_key_unique").on(table.userId, table.idempotencyKey),
    index("purchases_user_created_idx").on(table.userId, table.createdAt),
    check("purchases_currency_usd", sql`${table.currency} = 'USD'`),
    check("purchases_credits_positive", sql`${table.credits} > 0`),
    check("purchases_subtotal_positive", sql`${table.subtotalUsdCents} > 0`),
    check(
      "purchases_exact_pack",
      sql`(${table.packId} = 'creator' AND ${table.credits} = 1900 AND ${table.subtotalUsdCents} = 1900) OR (${table.packId} = 'pro' AND ${table.credits} = 4900 AND ${table.subtotalUsdCents} = 4900) OR (${table.packId} = 'studio' AND ${table.credits} = 9900 AND ${table.subtotalUsdCents} = 9900)`,
    ),
    pgPolicy("purchases_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purchaseId: uuid("purchase_id").notNull().unique().references(() => purchases.id, { onDelete: "restrict" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    providerPaymentId: text("provider_payment_id").unique(),
    providerCheckoutSessionId: text("provider_checkout_session_id").unique(),
    status: paymentStatus("status").notNull().default("pending"),
    subtotalUsdCents: integer("subtotal_usd_cents").notNull(),
    taxUsdCents: integer("tax_usd_cents"),
    totalUsdCents: integer("total_usd_cents"),
    currency: text("currency").notNull().default("USD"),
    rawEventType: text("raw_event_type"),
    reconciliationReason: text("reconciliation_reason"),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("payments_user_created_idx").on(table.userId, table.createdAt),
    index("payments_status_idx").on(table.status, table.updatedAt),
    check("payments_currency_format", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("payments_amounts_nonnegative", sql`${table.subtotalUsdCents} >= 0 AND (${table.taxUsdCents} IS NULL OR ${table.taxUsdCents} >= 0) AND (${table.totalUsdCents} IS NULL OR ${table.totalUsdCents} >= 0)`),
    pgPolicy("payments_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payloadSha256: text("payload_sha256").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),
  },
  (table) => [
    uniqueIndex("webhook_events_provider_event_unique").on(table.provider, table.eventId),
    check("webhook_events_sha256_format", sql`${table.payloadSha256} ~ '^[0-9a-f]{64}$'`),
  ],
).enableRLS();

export const idempotencyRecords = pgTable(
  "idempotency_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    operation: text("operation").notNull(),
    key: text("key").notNull(),
    requestSha256: text("request_sha256").notNull(),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body").$type<unknown>(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("idempotency_actor_operation_key_unique").on(table.actorId, table.operation, table.key),
    check("idempotency_sha256_format", sql`${table.requestSha256} ~ '^[0-9a-f]{64}$'`),
  ],
).enableRLS();

export const providers = pgTable(
  "providers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    firstDiscoveredAt: timestamp("first_discovered_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  () => [pgPolicy("providers_read_catalog", { for: "select", to: ["anon", "authenticated"], using: sql`true` })],
).enableRLS();

export const models = pgTable(
  "models",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id").notNull().references(() => providers.id, { onDelete: "restrict" }),
    gatewayModelId: text("gateway_model_id").notNull().unique(),
    name: text("name").notNull(),
    kind: generationKind("kind"),
    catalogType: text("catalog_type").notNull().default("unknown"),
    modalities: jsonb("modalities").$type<string[]>().notNull().default([]),
    capabilities: jsonb("capabilities").$type<Record<string, unknown>>().notNull().default({}),
    gatewayMetadata: jsonb("gateway_metadata").$type<Record<string, unknown>>().notNull().default({}),
    productCompatibility: jsonb("product_compatibility").$type<Record<string, unknown>>().notNull().default({}),
    compatibilityVersion: integer("compatibility_version").notNull().default(0),
    discoveryStatus: text("discovery_status", { enum: ["present", "missing", "reference", "invalid"] }).notNull().default("present"),
    catalogHash: text("catalog_hash"),
    firstDiscoveredAt: timestamp("first_discovered_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    enabled: boolean("enabled").notNull().default(false),
    catalogSyncedAt: timestamp("catalog_synced_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("models_kind_enabled_idx").on(table.kind, table.enabled),
    index("models_discovery_status_idx").on(table.discoveryStatus, table.lastSeenAt),
    check("models_discovery_status_valid", sql`${table.discoveryStatus} in ('present', 'missing', 'reference', 'invalid')`),
    check("models_enabled_has_product", sql`${table.enabled} = false OR ${table.kind} IS NOT NULL`),
    check("models_compatibility_version_nonnegative", sql`${table.compatibilityVersion} >= 0`),
    pgPolicy("models_read_catalog", { for: "select", to: ["anon", "authenticated"], using: sql`${table.enabled} = true` }),
  ],
).enableRLS();

export const modelPrices = pgTable(
  "model_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: text("model_id").notNull().references(() => models.id, { onDelete: "restrict" }),
    inputNanoUsdPerToken: bigint("input_nano_usd_per_token", { mode: "number" }),
    outputNanoUsdPerToken: bigint("output_nano_usd_per_token", { mode: "number" }),
    operationNanoUsd: bigint("operation_nano_usd", { mode: "number" }),
    pricingData: jsonb("pricing_data").$type<Record<string, unknown> | null>(),
    quoteRule: jsonb("quote_rule").$type<Record<string, unknown> | null>(),
    source: text("source").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    index("model_prices_model_effective_idx").on(table.modelId, table.effectiveFrom),
    check("model_prices_nonnegative", sql`(${table.inputNanoUsdPerToken} IS NULL OR ${table.inputNanoUsdPerToken} >= 0) AND (${table.outputNanoUsdPerToken} IS NULL OR ${table.outputNanoUsdPerToken} >= 0) AND (${table.operationNanoUsd} IS NULL OR ${table.operationNanoUsd} >= 0)`),
    check("model_prices_effective_range", sql`${table.effectiveTo} IS NULL OR ${table.effectiveTo} > ${table.effectiveFrom}`),
  ],
).enableRLS();

export const catalogSyncRuns = pgTable(
  "catalog_sync_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: text("request_id").notNull().unique(),
    trigger: text("trigger", { enum: ["manual", "scheduled", "recovery"] }).notNull(),
    mode: text("mode", { enum: ["full", "incremental"] }).notNull().default("full"),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["running", "succeeded", "partial", "failed"] }).notNull().default("running"),
    acceptedCount: integer("accepted_count").notNull().default(0),
    invalidCount: integer("invalid_count").notNull().default(0),
    changedCount: integer("changed_count").notNull().default(0),
    missingCount: integer("missing_count").notNull().default(0),
    responseHash: text("response_hash"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("catalog_sync_runs_started_idx").on(table.startedAt),
    check("catalog_sync_runs_status_valid", sql`${table.status} in ('running', 'succeeded', 'partial', 'failed')`),
    check("catalog_sync_runs_counts_nonnegative", sql`${table.acceptedCount} >= 0 AND ${table.invalidCount} >= 0 AND ${table.changedCount} >= 0 AND ${table.missingCount} >= 0`),
  ],
).enableRLS();

export const catalogPriceObservations = pgTable(
  "catalog_price_observations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => catalogSyncRuns.id, { onDelete: "restrict" }),
    modelId: text("model_id").notNull().references(() => models.id, { onDelete: "restrict" }),
    pricingHash: text("pricing_hash").notNull(),
    pricingData: jsonb("pricing_data").$type<Record<string, unknown>>().notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("catalog_price_observations_model_observed_idx").on(table.modelId, table.observedAt),
    check("catalog_price_observations_hash_format", sql`${table.pricingHash} ~ '^[0-9a-f]{64}$'`),
  ],
).enableRLS();

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    kind: generationKind("kind").notNull(),
    modelId: text("model_id").references(() => models.id, { onDelete: "restrict" }),
    status: jobStatus("status").notNull().default("queued"),
    request: jsonb("request").$type<Record<string, unknown>>().notNull(),
    requestSha256: text("request_sha256").notNull(),
    submissionState: text("submission_state", { enum: ["not_submitted", "attempted", "completed", "uncertain"] }).notNull().default("not_submitted"),
    result: jsonb("result").$type<Record<string, unknown>>(),
    providerOperation: jsonb("provider_operation").$type<Record<string, unknown>>(),
    gatewayGenerationId: text("gateway_generation_id"),
    reservationId: uuid("reservation_id").references(() => creditReservations.id, { onDelete: "restrict" }),
    idempotencyKey: text("idempotency_key").notNull(),
    attempt: integer("attempt").notNull().default(0),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("generation_jobs_user_key_unique").on(table.userId, table.idempotencyKey),
    index("generation_jobs_user_created_idx").on(table.userId, table.createdAt),
    index("generation_jobs_status_updated_idx").on(table.status, table.updatedAt),
    check("generation_jobs_attempt_nonnegative", sql`${table.attempt} >= 0`),
    check("generation_jobs_request_sha256_format", sql`${table.requestSha256} ~ '^[0-9a-f]{64}$'`),
    pgPolicy("generation_jobs_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    generationJobId: uuid("generation_job_id").notNull().unique().references(() => generationJobs.id, { onDelete: "restrict" }),
    gatewayGenerationId: text("gateway_generation_id"),
    usage: jsonb("usage").$type<Record<string, number>>().notNull().default({}),
    source: text("source", { enum: ["estimate", "gateway_actual", "reconciled_actual"] }).notNull(),
    actualCostUsd: numeric("actual_cost_usd", { precision: 24, scale: 8 }),
    chargedCredits: bigint("charged_credits", { mode: "number" }),
    reconciliationStatus: text("reconciliation_status", { enum: ["estimated", "pending", "settled", "required"] }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("usage_events_user_created_idx").on(table.userId, table.createdAt),
    check("usage_events_actual_cost_nonnegative", sql`${table.actualCostUsd} IS NULL OR ${table.actualCostUsd} >= 0`),
    check("usage_events_charged_credits_nonnegative", sql`${table.chargedCredits} >= 0`),
    pgPolicy("usage_events_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    modelId: text("model_id").references(() => models.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("conversations_user_updated_idx").on(table.userId, table.updatedAt),
    pgPolicy("conversations_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["system", "user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    generationJobId: uuid("generation_job_id").references(() => generationJobs.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (table) => [
    index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
    pgPolicy("messages_read_own", {
      for: "select",
      to: "authenticated",
      using: sql`EXISTS (SELECT 1 FROM ${conversations} WHERE ${conversations.id} = ${table.conversationId} AND ${conversations.userId} = auth.uid())`,
    }),
  ],
).enableRLS();

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => generationJobs.id, { onDelete: "set null" }),
    kind: text("kind", { enum: ["upload", "image", "video", "website_source", "website_build"] }).notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull().unique(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: text("sha256"),
    status: text("status", { enum: ["pending", "ready", "failed", "deleted"] }).notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("assets_user_created_idx").on(table.userId, table.createdAt),
    check("assets_size_nonnegative", sql`${table.sizeBytes} >= 0`),
    check("assets_sha256_format", sql`${table.sha256} IS NULL OR ${table.sha256} ~ '^[0-9a-f]{64}$'`),
    pgPolicy("assets_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const websiteProjects = pgTable(
  "website_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    generationJobId: uuid("generation_job_id").references(() => generationJobs.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status", { enum: ["draft", "validating", "validated", "deploying", "published", "failed"] }).notNull().default("draft"),
    sourceAssetId: uuid("source_asset_id").references(() => assets.id, { onDelete: "set null" }),
    vercelProjectId: text("vercel_project_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("website_projects_user_slug_unique").on(table.userId, table.slug),
    index("website_projects_user_updated_idx").on(table.userId, table.updatedAt),
    pgPolicy("website_projects_read_own", { for: "select", to: "authenticated", using: sql`auth.uid() = ${table.userId}` }),
  ],
).enableRLS();

export const websiteBuilds = pgTable(
  "website_builds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => websiteProjects.id, { onDelete: "cascade" }),
    sandboxId: text("sandbox_id"),
    status: text("status", { enum: ["queued", "building", "passed", "failed"] }).notNull().default("queued"),
    sourceSha256: text("source_sha256").notNull(),
    outputAssetId: uuid("output_asset_id").references(() => assets.id, { onDelete: "set null" }),
    diagnostics: jsonb("diagnostics").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("website_builds_project_created_idx").on(table.projectId, table.createdAt),
    check("website_builds_sha256_format", sql`${table.sourceSha256} ~ '^[0-9a-f]{64}$'`),
    pgPolicy("website_builds_read_own", {
      for: "select",
      to: "authenticated",
      using: sql`EXISTS (SELECT 1 FROM ${websiteProjects} WHERE ${websiteProjects.id} = ${table.projectId} AND ${websiteProjects.userId} = auth.uid())`,
    }),
  ],
).enableRLS();

export const deployments = pgTable(
  "deployments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => websiteProjects.id, { onDelete: "cascade" }),
    buildId: uuid("build_id").notNull().references(() => websiteBuilds.id, { onDelete: "restrict" }),
    providerDeploymentId: text("provider_deployment_id").unique(),
    providerProjectId: text("provider_project_id").notNull(),
    target: text("target", { enum: ["preview", "production"] }).notNull().default("preview"),
    status: text("status", { enum: ["queued", "building", "ready", "error", "cancelled"] }).notNull().default("queued"),
    url: text("url"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("deployments_project_key_unique").on(table.projectId, table.idempotencyKey),
    index("deployments_project_created_idx").on(table.projectId, table.createdAt),
    pgPolicy("deployments_read_own", {
      for: "select",
      to: "authenticated",
      using: sql`EXISTS (SELECT 1 FROM ${websiteProjects} WHERE ${websiteProjects.id} = ${table.projectId} AND ${websiteProjects.userId} = auth.uid())`,
    }),
  ],
).enableRLS();

export const accountDeletionRequests = pgTable(
  "account_deletion_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["requested", "review", "completed", "cancelled"] }).notNull().default("requested"),
    reason: text("reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("account_deletion_user_created_idx").on(table.userId, table.createdAt)],
).enableRLS();

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    topic: text("topic").notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
    requestSha256: text("request_sha256").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [check("contact_messages_sha256_format", sql`${table.requestSha256} ~ '^[0-9a-f]{64}$'`)],
).enableRLS();

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    template: text("template").notNull(),
    recipient: text("recipient").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("email_outbox_status_created_idx").on(table.status, table.createdAt)],
).enableRLS();

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventKey: text("event_key").notNull().unique(),
    eventName: text("event_name").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: outboxStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("outbox_pending_idx").on(table.status, table.availableAt),
    check("outbox_attempts_nonnegative", sql`${table.attempts} >= 0`),
  ],
).enableRLS();

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    requestId: text("request_id").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    metadata: metadata(),
    createdAt: createdAt(),
  },
  (table) => [index("audit_events_target_created_idx").on(table.targetType, table.targetId, table.createdAt)],
).enableRLS();

/**
 * Fixed-window counters for abuse limiting. Replaces the Upstash Redis integration: the unique key
 * makes increments atomic, so two concurrent requests cannot both pass the same limit.
 */
export const rateLimits = pgTable(
  "rate_limits",
  {
    name: text("name").notNull(),
    identifier: text("identifier").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.name, table.identifier, table.windowStart] }),
    index("rate_limits_expires_idx").on(table.expiresAt),
  ],
).enableRLS();

export const schema = {
  profiles,
  adminRoles,
  wallets,
  walletLedger,
  creditReservations,
  creditPacks,
  purchases,
  payments,
  webhookEvents,
  idempotencyRecords,
  providers,
  models,
  modelPrices,
  generationJobs,
  usageEvents,
  conversations,
  messages,
  assets,
  websiteProjects,
  websiteBuilds,
  deployments,
  accountDeletionRequests,
  contactMessages,
  emailOutbox,
  outboxEvents,
  auditEvents,
  rateLimits,
};

export type DatabaseSchema = typeof schema;
