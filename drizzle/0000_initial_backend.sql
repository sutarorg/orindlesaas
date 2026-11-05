CREATE TYPE "public"."generation_kind" AS ENUM('chat', 'image', 'video', 'website');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'awaiting_provider', 'succeeded', 'failed', 'cancelled', 'reconciliation_required');--> statement-breakpoint
CREATE TYPE "public"."ledger_kind" AS ENUM('purchase', 'reservation_hold', 'reservation_release', 'usage_settlement', 'admin_adjustment', 'refund_reversal', 'chargeback_reversal', 'compensation');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'disputed', 'reconciliation_required');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('held', 'settled', 'released', 'reconciliation_required');--> statement-breakpoint
CREATE TABLE "account_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permission_version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "admin_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"kind" text NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "assets_size_nonnegative" CHECK ("assets"."size_bytes" >= 0),
	CONSTRAINT "assets_sha256_format" CHECK ("assets"."sha256" IS NULL OR "assets"."sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text,
	"request_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"topic" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_request_sha256_unique" UNIQUE("request_sha256"),
	CONSTRAINT "contact_messages_sha256_format" CHECK ("contact_messages"."request_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"model_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"credits" bigint NOT NULL,
	"subtotal_usd_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_packs_currency_usd" CHECK ("credit_packs"."currency" = 'USD'),
	CONSTRAINT "credit_packs_exact_values" CHECK (("credit_packs"."id" = 'creator' AND "credit_packs"."credits" = 1900 AND "credit_packs"."subtotal_usd_cents" = 1900) OR ("credit_packs"."id" = 'pro' AND "credit_packs"."credits" = 4900 AND "credit_packs"."subtotal_usd_cents" = 4900) OR ("credit_packs"."id" = 'studio' AND "credit_packs"."credits" = 9900 AND "credit_packs"."subtotal_usd_cents" = 9900))
);
--> statement-breakpoint
ALTER TABLE "credit_packs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"estimated_cost_usd" numeric(24, 8) NOT NULL,
	"estimated_credits" bigint NOT NULL,
	"actual_cost_usd" numeric(24, 8),
	"actual_credits" bigint,
	"status" "reservation_status" DEFAULT 'held' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone,
	CONSTRAINT "credit_reservations_job_id_unique" UNIQUE("job_id"),
	CONSTRAINT "credit_reservations_estimated_cost_nonnegative" CHECK ("credit_reservations"."estimated_cost_usd" >= 0),
	CONSTRAINT "credit_reservations_estimated_credits_nonnegative" CHECK ("credit_reservations"."estimated_credits" >= 0),
	CONSTRAINT "credit_reservations_actual_cost_nonnegative" CHECK ("credit_reservations"."actual_cost_usd" IS NULL OR "credit_reservations"."actual_cost_usd" >= 0),
	CONSTRAINT "credit_reservations_actual_credits_nonnegative" CHECK ("credit_reservations"."actual_credits" IS NULL OR "credit_reservations"."actual_credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "credit_reservations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"provider_deployment_id" text,
	"provider_project_id" text NOT NULL,
	"target" text DEFAULT 'preview' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"url" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deployments_provider_deployment_id_unique" UNIQUE("provider_deployment_id")
);
--> statement-breakpoint
ALTER TABLE "deployments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template" text NOT NULL,
	"recipient" text NOT NULL,
	"payload" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_outbox_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "email_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "generation_kind" NOT NULL,
	"model_id" text,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"request" jsonb NOT NULL,
	"result" jsonb,
	"provider_operation" jsonb,
	"gateway_generation_id" text,
	"reservation_id" uuid,
	"idempotency_key" text NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_message" text,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "generation_jobs_attempt_nonnegative" CHECK ("generation_jobs"."attempt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "generation_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"key" text NOT NULL,
	"request_sha256" text NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_sha256_format" CHECK ("idempotency_records"."request_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "idempotency_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"generation_job_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "model_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"input_nano_usd_per_token" bigint,
	"output_nano_usd_per_token" bigint,
	"operation_nano_usd" bigint,
	"source" text NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_prices_nonnegative" CHECK (("model_prices"."input_nano_usd_per_token" IS NULL OR "model_prices"."input_nano_usd_per_token" >= 0) AND ("model_prices"."output_nano_usd_per_token" IS NULL OR "model_prices"."output_nano_usd_per_token" >= 0) AND ("model_prices"."operation_nano_usd" IS NULL OR "model_prices"."operation_nano_usd" >= 0)),
	CONSTRAINT "model_prices_effective_range" CHECK ("model_prices"."effective_to" IS NULL OR "model_prices"."effective_to" > "model_prices"."effective_from")
);
--> statement-breakpoint
ALTER TABLE "model_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"gateway_model_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "generation_kind" NOT NULL,
	"modalities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"catalog_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_gateway_model_id_unique" UNIQUE("gateway_model_id")
);
--> statement-breakpoint
ALTER TABLE "models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"event_name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_event_key_unique" UNIQUE("event_key"),
	CONSTRAINT "outbox_attempts_nonnegative" CHECK ("outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_payment_id" text,
	"provider_checkout_session_id" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"subtotal_usd_cents" integer NOT NULL,
	"tax_usd_cents" integer,
	"total_usd_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"raw_event_type" text,
	"reconciliation_reason" text,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_purchase_id_unique" UNIQUE("purchase_id"),
	CONSTRAINT "payments_provider_payment_id_unique" UNIQUE("provider_payment_id"),
	CONSTRAINT "payments_provider_checkout_session_id_unique" UNIQUE("provider_checkout_session_id"),
	CONSTRAINT "payments_currency_format" CHECK ("payments"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "payments_amounts_nonnegative" CHECK ("payments"."subtotal_usd_cents" >= 0 AND ("payments"."tax_usd_cents" IS NULL OR "payments"."tax_usd_cents" >= 0) AND ("payments"."total_usd_cents" IS NULL OR "payments"."total_usd_cents" >= 0))
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_nonempty" CHECK (length("profiles"."email") > 3)
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "providers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pack_id" text NOT NULL,
	"credits" bigint NOT NULL,
	"subtotal_usd_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"provider_product_id" text NOT NULL,
	"checkout_session_id" text,
	"checkout_url" text,
	"reconciliation_reason" text,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_checkout_session_id_unique" UNIQUE("checkout_session_id"),
	CONSTRAINT "purchases_currency_usd" CHECK ("purchases"."currency" = 'USD'),
	CONSTRAINT "purchases_credits_positive" CHECK ("purchases"."credits" > 0),
	CONSTRAINT "purchases_subtotal_positive" CHECK ("purchases"."subtotal_usd_cents" > 0),
	CONSTRAINT "purchases_exact_pack" CHECK (("purchases"."pack_id" = 'creator' AND "purchases"."credits" = 1900 AND "purchases"."subtotal_usd_cents" = 1900) OR ("purchases"."pack_id" = 'pro' AND "purchases"."credits" = 4900 AND "purchases"."subtotal_usd_cents" = 4900) OR ("purchases"."pack_id" = 'studio' AND "purchases"."credits" = 9900 AND "purchases"."subtotal_usd_cents" = 9900))
);
--> statement-breakpoint
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_job_id" uuid NOT NULL,
	"gateway_generation_id" text,
	"usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text NOT NULL,
	"actual_cost_usd" numeric(24, 8),
	"charged_credits" bigint,
	"reconciliation_status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_events_generation_job_id_unique" UNIQUE("generation_job_id"),
	CONSTRAINT "usage_events_actual_cost_nonnegative" CHECK ("usage_events"."actual_cost_usd" IS NULL OR "usage_events"."actual_cost_usd" >= 0),
	CONSTRAINT "usage_events_charged_credits_nonnegative" CHECK ("usage_events"."charged_credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "usage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wallet_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "ledger_kind" NOT NULL,
	"available_delta_credits" bigint NOT NULL,
	"reserved_delta_credits" bigint NOT NULL,
	"available_after_credits" bigint NOT NULL,
	"reserved_after_credits" bigint NOT NULL,
	"actor_id" uuid,
	"reference_type" text NOT NULL,
	"reference_id" text NOT NULL,
	"correlation_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_ledger_delta_nonzero" CHECK ("wallet_ledger"."available_delta_credits" <> 0 OR "wallet_ledger"."reserved_delta_credits" <> 0),
	CONSTRAINT "wallet_ledger_available_after_nonnegative" CHECK ("wallet_ledger"."available_after_credits" >= 0),
	CONSTRAINT "wallet_ledger_reserved_after_nonnegative" CHECK ("wallet_ledger"."reserved_after_credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "wallet_ledger" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wallets" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"available_credits" bigint DEFAULT 0 NOT NULL,
	"reserved_credits" bigint DEFAULT 0 NOT NULL,
	"lifetime_purchased_credits" bigint DEFAULT 0 NOT NULL,
	"lifetime_used_credits" bigint DEFAULT 0 NOT NULL,
	"version" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_available_nonnegative" CHECK ("wallets"."available_credits" >= 0),
	CONSTRAINT "wallets_reserved_nonnegative" CHECK ("wallets"."reserved_credits" >= 0),
	CONSTRAINT "wallets_purchased_nonnegative" CHECK ("wallets"."lifetime_purchased_credits" >= 0),
	CONSTRAINT "wallets_used_nonnegative" CHECK ("wallets"."lifetime_used_credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload_sha256" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processing_error" text,
	CONSTRAINT "webhook_events_sha256_format" CHECK ("webhook_events"."payload_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "website_builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"sandbox_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"source_sha256" text NOT NULL,
	"output_asset_id" uuid,
	"diagnostics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "website_builds_sha256_format" CHECK ("website_builds"."source_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "website_builds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "website_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"generation_job_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"source_asset_id" uuid,
	"vercel_project_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "website_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account_deletion_requests" ADD CONSTRAINT "account_deletion_requests_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_roles" ADD CONSTRAINT "admin_roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_job_id_generation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_website_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."website_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_build_id_website_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."website_builds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_reservation_id_credit_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."credit_reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_prices" ADD CONSTRAINT "model_prices_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_builds" ADD CONSTRAINT "website_builds_project_id_website_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."website_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_builds" ADD CONSTRAINT "website_builds_output_asset_id_assets_id_fk" FOREIGN KEY ("output_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_projects" ADD CONSTRAINT "website_projects_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_projects" ADD CONSTRAINT "website_projects_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_projects" ADD CONSTRAINT "website_projects_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_deletion_user_created_idx" ON "account_deletion_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "assets_user_created_idx" ON "assets" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_target_created_idx" ON "audit_events" USING btree ("target_type","target_id","created_at");--> statement-breakpoint
CREATE INDEX "conversations_user_updated_idx" ON "conversations" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_reservations_user_key_unique" ON "credit_reservations" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "credit_reservations_status_idx" ON "credit_reservations" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "deployments_project_key_unique" ON "deployments" USING btree ("project_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "deployments_project_created_idx" ON "deployments" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "email_outbox_status_created_idx" ON "email_outbox" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "generation_jobs_user_key_unique" ON "generation_jobs" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "generation_jobs_user_created_idx" ON "generation_jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "generation_jobs_status_updated_idx" ON "generation_jobs" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_actor_operation_key_unique" ON "idempotency_records" USING btree ("actor_id","operation","key");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "model_prices_model_effective_idx" ON "model_prices" USING btree ("model_id","effective_from");--> statement-breakpoint
CREATE INDEX "models_kind_enabled_idx" ON "models" USING btree ("kind","enabled");--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox_events" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "payments_user_created_idx" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_unique" ON "profiles" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_user_key_unique" ON "purchases" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "purchases_user_created_idx" ON "purchases" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_user_created_idx" ON "usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_ledger_idempotency_unique" ON "wallet_ledger" USING btree ("user_id","kind","idempotency_key");--> statement-breakpoint
CREATE INDEX "wallet_ledger_user_created_idx" ON "wallet_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_ledger_reference_idx" ON "wallet_ledger" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_unique" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "website_builds_project_created_idx" ON "website_builds" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "website_projects_user_slug_unique" ON "website_projects" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "website_projects_user_updated_idx" ON "website_projects" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE POLICY "admin_roles_read_own" ON "admin_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "admin_roles"."user_id");--> statement-breakpoint
CREATE POLICY "assets_read_own" ON "assets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "assets"."user_id");--> statement-breakpoint
CREATE POLICY "conversations_read_own" ON "conversations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "conversations"."user_id");--> statement-breakpoint
CREATE POLICY "credit_packs_read_catalog" ON "credit_packs" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("credit_packs"."enabled" = true);--> statement-breakpoint
CREATE POLICY "credit_reservations_read_own" ON "credit_reservations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "credit_reservations"."user_id");--> statement-breakpoint
CREATE POLICY "deployments_read_own" ON "deployments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (SELECT 1 FROM "website_projects" WHERE "website_projects"."id" = "deployments"."project_id" AND "website_projects"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "generation_jobs_read_own" ON "generation_jobs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "generation_jobs"."user_id");--> statement-breakpoint
CREATE POLICY "messages_read_own" ON "messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (SELECT 1 FROM "conversations" WHERE "conversations"."id" = "messages"."conversation_id" AND "conversations"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "models_read_catalog" ON "models" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("models"."enabled" = true);--> statement-breakpoint
CREATE POLICY "payments_read_own" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "payments"."user_id");--> statement-breakpoint
CREATE POLICY "profiles_read_own" ON "profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "profiles"."id");--> statement-breakpoint
CREATE POLICY "providers_read_catalog" ON "providers" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "purchases_read_own" ON "purchases" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "purchases"."user_id");--> statement-breakpoint
CREATE POLICY "usage_events_read_own" ON "usage_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "usage_events"."user_id");--> statement-breakpoint
CREATE POLICY "wallet_ledger_read_own" ON "wallet_ledger" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "wallet_ledger"."user_id");--> statement-breakpoint
CREATE POLICY "wallets_read_own" ON "wallets" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "wallets"."user_id");--> statement-breakpoint
CREATE POLICY "website_builds_read_own" ON "website_builds" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (SELECT 1 FROM "website_projects" WHERE "website_projects"."id" = "website_builds"."project_id" AND "website_projects"."user_id" = auth.uid()));--> statement-breakpoint
CREATE POLICY "website_projects_read_own" ON "website_projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "website_projects"."user_id");