CREATE TABLE IF NOT EXISTS "catalog_price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"pricing_hash" text NOT NULL,
	"pricing_data" jsonb NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_price_observations_hash_format" CHECK ("catalog_price_observations"."pricing_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "catalog_price_observations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" text NOT NULL,
	"trigger" text NOT NULL,
	"mode" text DEFAULT 'full' NOT NULL,
	"actor_id" uuid,
	"status" text DEFAULT 'running' NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"invalid_count" integer DEFAULT 0 NOT NULL,
	"changed_count" integer DEFAULT 0 NOT NULL,
	"missing_count" integer DEFAULT 0 NOT NULL,
	"response_hash" text,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_expires_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "catalog_sync_runs_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "catalog_sync_runs_status_valid" CHECK ("catalog_sync_runs"."status" in ('running', 'succeeded', 'partial', 'failed')),
	CONSTRAINT "catalog_sync_runs_counts_nonnegative" CHECK ("catalog_sync_runs"."accepted_count" >= 0 AND "catalog_sync_runs"."invalid_count" >= 0 AND "catalog_sync_runs"."changed_count" >= 0 AND "catalog_sync_runs"."missing_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "catalog_sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "model_prices" DROP CONSTRAINT IF EXISTS "model_prices_model_id_models_id_fk";
--> statement-breakpoint
ALTER TABLE "models" ALTER COLUMN "kind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "model_prices" ADD COLUMN IF NOT EXISTS "pricing_data" jsonb;--> statement-breakpoint
ALTER TABLE "model_prices" ADD COLUMN IF NOT EXISTS "quote_rule" jsonb;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "catalog_type" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "gateway_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "product_compatibility" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "compatibility_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "discovery_status" text DEFAULT 'present' NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "catalog_hash" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "first_discovered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "first_discovered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "catalog_price_observations" ADD CONSTRAINT "catalog_price_observations_run_id_catalog_sync_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."catalog_sync_runs"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "catalog_price_observations" ADD CONSTRAINT "catalog_price_observations_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "catalog_sync_runs" ADD CONSTRAINT "catalog_sync_runs_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "catalog_price_observations_model_observed_idx" ON "catalog_price_observations" USING btree ("model_id","observed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "catalog_sync_runs_started_idx" ON "catalog_sync_runs" USING btree ("started_at");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "model_prices" ADD CONSTRAINT "model_prices_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "models_discovery_status_idx" ON "models" USING btree ("discovery_status","last_seen_at");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "models" ADD CONSTRAINT "models_discovery_status_valid" CHECK ("models"."discovery_status" in ('present', 'missing', 'reference', 'invalid'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "models" ADD CONSTRAINT "models_enabled_has_product" CHECK ("models"."enabled" = false OR "models"."kind" IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "models" ADD CONSTRAINT "models_compatibility_version_nonnegative" CHECK ("models"."compatibility_version" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reviewed dynamic Gateway catalogue additions; additive and idempotent.
UPDATE "public"."models" SET
  "catalog_type" = CASE WHEN "kind" IN ('chat', 'website') THEN 'language' ELSE "kind"::text END,
  "gateway_metadata" = jsonb_build_object(
    'type', CASE WHEN "kind" IN ('chat', 'website') THEN 'language' ELSE "kind"::text END,
    'supported_specifications', CASE WHEN "capabilities" ? 'specificationVersion' THEN jsonb_build_array("capabilities"->>'specificationVersion') ELSE '[]'::jsonb END,
    'modalities', CASE WHEN "kind" IN ('chat', 'website') THEN '{"input":["text"],"output":["text"]}'::jsonb ELSE jsonb_build_object('input', jsonb_build_array('text'), 'output', jsonb_build_array("kind"::text)) END
  ),
  "last_seen_at" = "catalog_synced_at"
WHERE "catalog_type" = 'unknown';--> statement-breakpoint
UPDATE "public"."model_prices" SET "pricing_data" = jsonb_strip_nulls(jsonb_build_object(
  'input', CASE WHEN "input_nano_usd_per_token" IS NULL THEN NULL ELSE rtrim(rtrim(to_char("input_nano_usd_per_token" / 1000000000.0, 'FM0.999999999'), '0'), '.') END,
  'output', CASE WHEN "output_nano_usd_per_token" IS NULL THEN NULL ELSE rtrim(rtrim(to_char("output_nano_usd_per_token" / 1000000000.0, 'FM0.999999999'), '0'), '.') END,
  'image', CASE WHEN "operation_nano_usd" IS NULL THEN NULL ELSE rtrim(rtrim(to_char("operation_nano_usd" / 1000000000.0, 'FM0.999999999'), '0'), '.') END
)) WHERE "pricing_data" IS NULL AND ("input_nano_usd_per_token" IS NOT NULL OR "output_nano_usd_per_token" IS NOT NULL OR "operation_nano_usd" IS NOT NULL);--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."orindle_protect_price_version"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'model_prices is append-only'; END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id" OR NEW."model_id" IS DISTINCT FROM OLD."model_id"
    OR NEW."input_nano_usd_per_token" IS DISTINCT FROM OLD."input_nano_usd_per_token"
    OR NEW."output_nano_usd_per_token" IS DISTINCT FROM OLD."output_nano_usd_per_token"
    OR NEW."operation_nano_usd" IS DISTINCT FROM OLD."operation_nano_usd"
    OR NEW."pricing_data" IS DISTINCT FROM OLD."pricing_data" OR NEW."quote_rule" IS DISTINCT FROM OLD."quote_rule"
    OR NEW."source" IS DISTINCT FROM OLD."source" OR NEW."effective_from" IS DISTINCT FROM OLD."effective_from"
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at" OR OLD."effective_to" IS NOT NULL
    OR NEW."effective_to" IS NULL OR NEW."effective_to" <= OLD."effective_from" THEN
    RAISE EXCEPTION 'only the first valid effective_to closure is allowed on model_prices';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."orindle_prevent_catalog_delete"()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION '% rows are historical and cannot be deleted', TG_TABLE_NAME; END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION "public"."orindle_prevent_catalog_delete"() FROM PUBLIC;--> statement-breakpoint
DROP TRIGGER IF EXISTS "providers_prevent_delete" ON "public"."providers";
--> statement-breakpoint
CREATE TRIGGER "providers_prevent_delete" BEFORE DELETE ON "public"."providers" FOR EACH ROW EXECUTE FUNCTION "public"."orindle_prevent_catalog_delete"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "models_prevent_delete" ON "public"."models";
--> statement-breakpoint
CREATE TRIGGER "models_prevent_delete" BEFORE DELETE ON "public"."models" FOR EACH ROW EXECUTE FUNCTION "public"."orindle_prevent_catalog_delete"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "catalog_sync_runs_prevent_delete" ON "public"."catalog_sync_runs";
--> statement-breakpoint
CREATE TRIGGER "catalog_sync_runs_prevent_delete" BEFORE DELETE ON "public"."catalog_sync_runs" FOR EACH ROW EXECUTE FUNCTION "public"."orindle_prevent_catalog_delete"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "catalog_price_observations_append_only" ON "public"."catalog_price_observations";
--> statement-breakpoint
CREATE TRIGGER "catalog_price_observations_append_only" BEFORE UPDATE OR DELETE ON "public"."catalog_price_observations" FOR EACH ROW EXECUTE FUNCTION "public"."orindle_prevent_append_only_mutation"();--> statement-breakpoint
REVOKE ALL ON "public"."catalog_sync_runs", "public"."catalog_price_observations" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE SELECT ON "public"."models" FROM "anon", "authenticated";--> statement-breakpoint
INSERT INTO "public"."providers" ("id", "name", "enabled") VALUES
  ('alibaba', 'alibaba', false),
  ('anthropic', 'anthropic', false),
  ('bytedance', 'bytedance', false),
  ('callstack', 'callstack', false),
  ('deepseek', 'deepseek', false),
  ('google', 'google', false),
  ('inception', 'inception', false),
  ('inclusionai', 'inclusionai', false),
  ('inference-net', 'inference-net', false),
  ('liquid', 'liquid', false),
  ('meituan', 'meituan', false),
  ('meta', 'meta', false),
  ('minimax', 'minimax', false),
  ('mistral', 'mistral', false),
  ('moonshotai', 'moonshotai', false),
  ('morph', 'morph', false),
  ('nvidia', 'nvidia', false),
  ('openai', 'openai', false),
  ('perplexity', 'perplexity', false),
  ('poolside', 'poolside', false),
  ('quiverai', 'quiverai', false),
  ('sakana', 'sakana', false),
  ('spacexai', 'spacexai', false),
  ('stealth', 'stealth', false),
  ('stepfun', 'stepfun', false),
  ('tencent', 'tencent', false),
  ('xiaomi', 'xiaomi', false),
  ('zai', 'zai', false)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "public"."models" ("id", "provider_id", "gateway_model_id", "name", "kind", "catalog_type", "enabled", "discovery_status", "gateway_metadata") VALUES
  ('gateway:alibaba/qwen-3-14b', 'alibaba', 'alibaba/qwen-3-14b', 'alibaba/qwen-3-14b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen-3-235b', 'alibaba', 'alibaba/qwen-3-235b', 'alibaba/qwen-3-235b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen-3-30b', 'alibaba', 'alibaba/qwen-3-30b', 'alibaba/qwen-3-30b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen-3-32b', 'alibaba', 'alibaba/qwen-3-32b', 'alibaba/qwen-3-32b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-coder', 'alibaba', 'alibaba/qwen3-coder', 'alibaba/qwen3-coder', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-coder-30b-a3b', 'alibaba', 'alibaba/qwen3-coder-30b-a3b', 'alibaba/qwen3-coder-30b-a3b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-coder-next', 'alibaba', 'alibaba/qwen3-coder-next', 'alibaba/qwen3-coder-next', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-max-thinking', 'alibaba', 'alibaba/qwen3-max-thinking', 'alibaba/qwen3-max-thinking', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-next-80b-a3b-instruct', 'alibaba', 'alibaba/qwen3-next-80b-a3b-instruct', 'alibaba/qwen3-next-80b-a3b-instruct', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-next-80b-a3b-thinking', 'alibaba', 'alibaba/qwen3-next-80b-a3b-thinking', 'alibaba/qwen3-next-80b-a3b-thinking', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3-vl-instruct', 'alibaba', 'alibaba/qwen3-vl-instruct', 'alibaba/qwen3-vl-instruct', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.5-flash', 'alibaba', 'alibaba/qwen3.5-flash', 'alibaba/qwen3.5-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.5-plus', 'alibaba', 'alibaba/qwen3.5-plus', 'alibaba/qwen3.5-plus', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.6-27b', 'alibaba', 'alibaba/qwen3.6-27b', 'alibaba/qwen3.6-27b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.6-plus', 'alibaba', 'alibaba/qwen3.6-plus', 'alibaba/qwen3.6-plus', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.7-flash', 'alibaba', 'alibaba/qwen3.7-flash', 'alibaba/qwen3.7-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.7-max', 'alibaba', 'alibaba/qwen3.7-max', 'alibaba/qwen3.7-max', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.7-plus', 'alibaba', 'alibaba/qwen3.7-plus', 'alibaba/qwen3.7-plus', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-2.4t-a95b', 'alibaba', 'alibaba/qwen3.8-2.4t-a95b', 'alibaba/qwen3.8-2.4t-a95b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-27b', 'alibaba', 'alibaba/qwen3.8-27b', 'alibaba/qwen3.8-27b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-flash', 'alibaba', 'alibaba/qwen3.8-flash', 'alibaba/qwen3.8-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-max', 'alibaba', 'alibaba/qwen3.8-max', 'alibaba/qwen3.8-max', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-max-0902', 'alibaba', 'alibaba/qwen3.8-max-0902', 'alibaba/qwen3.8-max-0902', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-max-prime', 'alibaba', 'alibaba/qwen3.8-max-prime', 'alibaba/qwen3.8-max-prime', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:alibaba/qwen3.8-omni-flash', 'alibaba', 'alibaba/qwen3.8-omni-flash', 'alibaba/qwen3.8-omni-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-haiku-5.5', 'anthropic', 'anthropic/claude-haiku-5.5', 'anthropic/claude-haiku-5.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-haiku-5.5-batch', 'anthropic', 'anthropic/claude-haiku-5.5-batch', 'anthropic/claude-haiku-5.5-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.5', 'anthropic', 'anthropic/claude-opus-4.5', 'anthropic/claude-opus-4.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.5-batch', 'anthropic', 'anthropic/claude-opus-4.5-batch', 'anthropic/claude-opus-4.5-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.6', 'anthropic', 'anthropic/claude-opus-4.6', 'anthropic/claude-opus-4.6', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.6-batch', 'anthropic', 'anthropic/claude-opus-4.6-batch', 'anthropic/claude-opus-4.6-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.7', 'anthropic', 'anthropic/claude-opus-4.7', 'anthropic/claude-opus-4.7', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.7-batch', 'anthropic', 'anthropic/claude-opus-4.7-batch', 'anthropic/claude-opus-4.7-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.8', 'anthropic', 'anthropic/claude-opus-4.8', 'anthropic/claude-opus-4.8', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.8-fast', 'anthropic', 'anthropic/claude-opus-4.8-fast', 'anthropic/claude-opus-4.8-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-4.8-batch', 'anthropic', 'anthropic/claude-opus-4.8-batch', 'anthropic/claude-opus-4.8-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-5', 'anthropic', 'anthropic/claude-opus-5', 'anthropic/claude-opus-5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-5-fast', 'anthropic', 'anthropic/claude-opus-5-fast', 'anthropic/claude-opus-5-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-5-batch', 'anthropic', 'anthropic/claude-opus-5-batch', 'anthropic/claude-opus-5-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-5.5', 'anthropic', 'anthropic/claude-opus-5.5', 'anthropic/claude-opus-5.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-5.5-fast', 'anthropic', 'anthropic/claude-opus-5.5-fast', 'anthropic/claude-opus-5.5-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-opus-5.5-batch', 'anthropic', 'anthropic/claude-opus-5.5-batch', 'anthropic/claude-opus-5.5-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-sonnet-5', 'anthropic', 'anthropic/claude-sonnet-5', 'anthropic/claude-sonnet-5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-sonnet-5-batch', 'anthropic', 'anthropic/claude-sonnet-5-batch', 'anthropic/claude-sonnet-5-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:anthropic/claude-sonnet-5.5', 'anthropic', 'anthropic/claude-sonnet-5.5', 'anthropic/claude-sonnet-5.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:bytedance/seed-1.6', 'bytedance', 'bytedance/seed-1.6', 'bytedance/seed-1.6', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:bytedance/seed-1.8', 'bytedance', 'bytedance/seed-1.8', 'bytedance/seed-1.8', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:bytedance/seed-2.1-turbo', 'bytedance', 'bytedance/seed-2.1-turbo', 'bytedance/seed-2.1-turbo', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:callstack/apex', 'callstack', 'callstack/apex', 'callstack/apex', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-r1', 'deepseek', 'deepseek/deepseek-r1', 'deepseek/deepseek-r1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v3.1', 'deepseek', 'deepseek/deepseek-v3.1', 'deepseek/deepseek-v3.1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v3.2', 'deepseek', 'deepseek/deepseek-v3.2', 'deepseek/deepseek-v3.2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v3.2-thinking', 'deepseek', 'deepseek/deepseek-v3.2-thinking', 'deepseek/deepseek-v3.2-thinking', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v4-flash', 'deepseek', 'deepseek/deepseek-v4-flash', 'deepseek/deepseek-v4-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v4-flash-0731', 'deepseek', 'deepseek/deepseek-v4-flash-0731', 'deepseek/deepseek-v4-flash-0731', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v4-flash-vision-exp', 'deepseek', 'deepseek/deepseek-v4-flash-vision-exp', 'deepseek/deepseek-v4-flash-vision-exp', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v4.1-flash-1017', 'deepseek', 'deepseek/deepseek-v4.1-flash-1017', 'deepseek/deepseek-v4.1-flash-1017', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v4.1-flash-1017-fast', 'deepseek', 'deepseek/deepseek-v4.1-flash-1017-fast', 'deepseek/deepseek-v4.1-flash-1017-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:deepseek/deepseek-v4.1-flash-fast', 'deepseek', 'deepseek/deepseek-v4.1-flash-fast', 'deepseek/deepseek-v4.1-flash-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-2.5-flash', 'google', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-2.5-flash-batch', 'google', 'google/gemini-2.5-flash-batch', 'google/gemini-2.5-flash-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-2.5-pro', 'google', 'google/gemini-2.5-pro', 'google/gemini-2.5-pro', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-2.5-pro-batch', 'google', 'google/gemini-2.5-pro-batch', 'google/gemini-2.5-pro-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-3.7-flash', 'google', 'google/gemini-3.7-flash', 'google/gemini-3.7-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-3.8-flash', 'google', 'google/gemini-3.8-flash', 'google/gemini-3.8-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-nano-banana-2.1', 'google', 'google/gemini-nano-banana-2.1', 'google/gemini-nano-banana-2.1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:google/gemini-omni-1.2-flash', 'google', 'google/gemini-omni-1.2-flash', 'google/gemini-omni-1.2-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inception/mercury-coder-small', 'inception', 'inception/mercury-coder-small', 'inception/mercury-coder-small', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inclusionai/ling-3.0-flash', 'inclusionai', 'inclusionai/ling-3.0-flash', 'inclusionai/ling-3.0-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inclusionai/ling-3.0-flash-fin', 'inclusionai', 'inclusionai/ling-3.0-flash-fin', 'inclusionai/ling-3.0-flash-fin', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inclusionai/ling-3.0-flash-sante', 'inclusionai', 'inclusionai/ling-3.0-flash-sante', 'inclusionai/ling-3.0-flash-sante', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inclusionai/ling-3.1-flash', 'inclusionai', 'inclusionai/ling-3.1-flash', 'inclusionai/ling-3.1-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inclusionai/ling-3.1-flash-1019', 'inclusionai', 'inclusionai/ling-3.1-flash-1019', 'inclusionai/ling-3.1-flash-1019', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:inference-net/schematron-v2-small', 'inference-net', 'inference-net/schematron-v2-small', 'inference-net/schematron-v2-small', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:liquid/lfm2.5-24b-a2b', 'liquid', 'liquid/lfm2.5-24b-a2b', 'liquid/lfm2.5-24b-a2b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:meituan/longcat-2.5', 'meituan', 'meituan/longcat-2.5', 'meituan/longcat-2.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:meta/llama-3.1-70b', 'meta', 'meta/llama-3.1-70b', 'meta/llama-3.1-70b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:meta/llama-3.1-8b', 'meta', 'meta/llama-3.1-8b', 'meta/llama-3.1-8b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:meta/llama-3.3-70b', 'meta', 'meta/llama-3.3-70b', 'meta/llama-3.3-70b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:meta/muse-spark-1.3-contributor', 'meta', 'meta/muse-spark-1.3-contributor', 'meta/muse-spark-1.3-contributor', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m2', 'minimax', 'minimax/minimax-m2', 'minimax/minimax-m2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m2.5', 'minimax', 'minimax/minimax-m2.5', 'minimax/minimax-m2.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m2.5-highspeed', 'minimax', 'minimax/minimax-m2.5-highspeed', 'minimax/minimax-m2.5-highspeed', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m2.7', 'minimax', 'minimax/minimax-m2.7', 'minimax/minimax-m2.7', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m2.7-highspeed', 'minimax', 'minimax/minimax-m2.7-highspeed', 'minimax/minimax-m2.7-highspeed', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m3', 'minimax', 'minimax/minimax-m3', 'minimax/minimax-m3', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:minimax/minimax-m3.1-flash', 'minimax', 'minimax/minimax-m3.1-flash', 'minimax/minimax-m3.1-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:mistral/ministral-3b', 'mistral', 'mistral/ministral-3b', 'mistral/ministral-3b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:mistral/ministral-8b', 'mistral', 'mistral/ministral-8b', 'mistral/ministral-8b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:mistral/mistral-large-3', 'mistral', 'mistral/mistral-large-3', 'mistral/mistral-large-3', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:moonshotai/kimi-k2', 'moonshotai', 'moonshotai/kimi-k2', 'moonshotai/kimi-k2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:moonshotai/kimi-k2.5', 'moonshotai', 'moonshotai/kimi-k2.5', 'moonshotai/kimi-k2.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:moonshotai/kimi-k2.6', 'moonshotai', 'moonshotai/kimi-k2.6', 'moonshotai/kimi-k2.6', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:moonshotai/kimi-k2.7-code', 'moonshotai', 'moonshotai/kimi-k2.7-code', 'moonshotai/kimi-k2.7-code', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:morph/morph-v3-small', 'morph', 'morph/morph-v3-small', 'morph/morph-v3-small', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:morph/morph-v3-large', 'morph', 'morph/morph-v3-large', 'morph/morph-v3-large', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:nvidia/nemotron-3-nano-30b-a3b', 'nvidia', 'nvidia/nemotron-3-nano-30b-a3b', 'nvidia/nemotron-3-nano-30b-a3b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:nvidia/nemotron-3-super-120b-a12b', 'nvidia', 'nvidia/nemotron-3-super-120b-a12b', 'nvidia/nemotron-3-super-120b-a12b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:nvidia/nemotron-3-ultra-550b-a55b', 'nvidia', 'nvidia/nemotron-3-ultra-550b-a55b', 'nvidia/nemotron-3-ultra-550b-a55b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:nvidia/nemotron-3.5-lightning', 'nvidia', 'nvidia/nemotron-3.5-lightning', 'nvidia/nemotron-3.5-lightning', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:nvidia/nemotron-nano-12b-v2-vl', 'nvidia', 'nvidia/nemotron-nano-12b-v2-vl', 'nvidia/nemotron-nano-12b-v2-vl', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:nvidia/nemotron-nano-9b-v2', 'nvidia', 'nvidia/nemotron-nano-9b-v2', 'nvidia/nemotron-nano-9b-v2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4.1', 'openai', 'openai/gpt-4.1', 'openai/gpt-4.1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4.1-fast', 'openai', 'openai/gpt-4.1-fast', 'openai/gpt-4.1-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4.1-mini', 'openai', 'openai/gpt-4.1-mini', 'openai/gpt-4.1-mini', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4.1-mini-fast', 'openai', 'openai/gpt-4.1-mini-fast', 'openai/gpt-4.1-mini-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4.1-mini-batch', 'openai', 'openai/gpt-4.1-mini-batch', 'openai/gpt-4.1-mini-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4.1-nano', 'openai', 'openai/gpt-4.1-nano', 'openai/gpt-4.1-nano', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4o', 'openai', 'openai/gpt-4o', 'openai/gpt-4o', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4o-mini', 'openai', 'openai/gpt-4o-mini', 'openai/gpt-4o-mini', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4o-mini-fast', 'openai', 'openai/gpt-4o-mini-fast', 'openai/gpt-4o-mini-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-4o-mini-batch', 'openai', 'openai/gpt-4o-mini-batch', 'openai/gpt-4o-mini-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5', 'openai', 'openai/gpt-5', 'openai/gpt-5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5-fast', 'openai', 'openai/gpt-5-fast', 'openai/gpt-5-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5-batch', 'openai', 'openai/gpt-5-batch', 'openai/gpt-5-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5-codex', 'openai', 'openai/gpt-5-codex', 'openai/gpt-5-codex', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5-mini', 'openai', 'openai/gpt-5-mini', 'openai/gpt-5-mini', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5-pro', 'openai', 'openai/gpt-5-pro', 'openai/gpt-5-pro', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5-pro-batch', 'openai', 'openai/gpt-5-pro-batch', 'openai/gpt-5-pro-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.1-codex', 'openai', 'openai/gpt-5.1-codex', 'openai/gpt-5.1-codex', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.1-codex-max', 'openai', 'openai/gpt-5.1-codex-max', 'openai/gpt-5.1-codex-max', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.1-codex-mini', 'openai', 'openai/gpt-5.1-codex-mini', 'openai/gpt-5.1-codex-mini', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.1-thinking', 'openai', 'openai/gpt-5.1-thinking', 'openai/gpt-5.1-thinking', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.1-thinking-fast', 'openai', 'openai/gpt-5.1-thinking-fast', 'openai/gpt-5.1-thinking-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.2', 'openai', 'openai/gpt-5.2', 'openai/gpt-5.2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.5', 'openai', 'openai/gpt-5.5', 'openai/gpt-5.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-5.5-fast', 'openai', 'openai/gpt-5.5-fast', 'openai/gpt-5.5-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-6.1-sol', 'openai', 'openai/gpt-6.1-sol', 'openai/gpt-6.1-sol', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-6.1-sol-fast', 'openai', 'openai/gpt-6.1-sol-fast', 'openai/gpt-6.1-sol-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-6-luna-batch', 'openai', 'openai/gpt-6-luna-batch', 'openai/gpt-6-luna-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-oss-120b', 'openai', 'openai/gpt-oss-120b', 'openai/gpt-oss-120b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-oss-20b', 'openai', 'openai/gpt-oss-20b', 'openai/gpt-oss-20b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/gpt-oss-safeguard-120b', 'openai', 'openai/gpt-oss-safeguard-120b', 'openai/gpt-oss-safeguard-120b', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/o3', 'openai', 'openai/o3', 'openai/o3', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/o3-fast', 'openai', 'openai/o3-fast', 'openai/o3-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/o3-mini', 'openai', 'openai/o3-mini', 'openai/o3-mini', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:openai/o3-pro', 'openai', 'openai/o3-pro', 'openai/o3-pro', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:perplexity/sonar', 'perplexity', 'perplexity/sonar', 'perplexity/sonar', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:poolside/laguna-s-2.1', 'poolside', 'poolside/laguna-s-2.1', 'poolside/laguna-s-2.1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:quiverai/arrow-2', 'quiverai', 'quiverai/arrow-2', 'quiverai/arrow-2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:quiverai/arrow-2-telos', 'quiverai', 'quiverai/arrow-2-telos', 'quiverai/arrow-2-telos', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:sakana/namazu', 'sakana', 'sakana/namazu', 'sakana/namazu', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.20-reasoning', 'spacexai', 'spacexai/grok-4.20-reasoning', 'spacexai/grok-4.20-reasoning', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.20-reasoning-batch', 'spacexai', 'spacexai/grok-4.20-reasoning-batch', 'spacexai/grok-4.20-reasoning-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.20-reasoning-beta', 'spacexai', 'spacexai/grok-4.20-reasoning-beta', 'spacexai/grok-4.20-reasoning-beta', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.3', 'spacexai', 'spacexai/grok-4.3', 'spacexai/grok-4.3', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.3-batch', 'spacexai', 'spacexai/grok-4.3-batch', 'spacexai/grok-4.3-batch', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.5', 'spacexai', 'spacexai/grok-4.5', 'spacexai/grok-4.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.6', 'spacexai', 'spacexai/grok-4.6', 'spacexai/grok-4.6', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-4.7', 'spacexai', 'spacexai/grok-4.7', 'spacexai/grok-4.7', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:spacexai/grok-build-0.1', 'spacexai', 'spacexai/grok-build-0.1', 'spacexai/grok-build-0.1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:stealth/glyph-cluster', 'stealth', 'stealth/glyph-cluster', 'stealth/glyph-cluster', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:stepfun/step-3.7-flash', 'stepfun', 'stepfun/step-3.7-flash', 'stepfun/step-3.7-flash', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:stepfun/step-5-preview', 'stepfun', 'stepfun/step-5-preview', 'stepfun/step-5-preview', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:tencent/hy-mt2-lite', 'tencent', 'tencent/hy-mt2-lite', 'tencent/hy-mt2-lite', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:tencent/hy-mt2-plus', 'tencent', 'tencent/hy-mt2-plus', 'tencent/hy-mt2-plus', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:tencent/hy-mt2-pro', 'tencent', 'tencent/hy-mt2-pro', 'tencent/hy-mt2-pro', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:tencent/hy3', 'tencent', 'tencent/hy3', 'tencent/hy3', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:tencent/hy4', 'tencent', 'tencent/hy4', 'tencent/hy4', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:xiaomi/mimo-v2.6-pro', 'xiaomi', 'xiaomi/mimo-v2.6-pro', 'xiaomi/mimo-v2.6-pro', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:xiaomi/mimo-v2.6-pro-ultraspeed', 'xiaomi', 'xiaomi/mimo-v2.6-pro-ultraspeed', 'xiaomi/mimo-v2.6-pro-ultraspeed', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:zai/glm-4.5', 'zai', 'zai/glm-4.5', 'zai/glm-4.5', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:zai/glm-4.5-air', 'zai', 'zai/glm-4.5-air', 'zai/glm-4.5-air', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:zai/glm-5.1', 'zai', 'zai/glm-5.1', 'zai/glm-5.1', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:zai/glm-5.2', 'zai', 'zai/glm-5.2', 'zai/glm-5.2', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb),
  ('gateway:zai/glm-5.2-fast', 'zai', 'zai/glm-5.2-fast', 'zai/glm-5.2-fast', NULL, 'language', false, 'reference', '{"source":"supplied_partial_reference","reference":"docs/vercel_ai_gateway_llm_model_ids-1.txt"}'::jsonb)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
