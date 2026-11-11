-- Move Orindle's AI infrastructure from Vercel AI Gateway to OpenRouter.
--
-- Everything here is additive. No column is dropped, renamed or reinterpreted, because the existing
-- Gateway model IDs, generation IDs and price history are referenced by customer history and must
-- stay auditable. New provider-neutral columns sit alongside the historical ones: a value in
-- `provider_generation_id` is always an OpenRouter ID (`gen-`), while `gateway_generation_id` keeps
-- holding the old `gen_` references. Merging the two would make a settlement lookup ambiguous.
--
-- Every statement is guarded so the file can be re-run safely, matching the guarantee 0003/0004 now
-- provide: repeated application is a no-op rather than an error.

CREATE TABLE IF NOT EXISTS "model_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"provider_slug" text,
	"pricing_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"context_length" integer,
	"max_completion_tokens" integer,
	"approved" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"approved_pricing_hash" text,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_endpoints_provider_name_length" CHECK (length("model_endpoints"."provider_name") BETWEEN 1 AND 240)
);
--> statement-breakpoint
ALTER TABLE "model_endpoints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "provider_generation_id" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "provider_job_id" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "provider" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "provider_endpoint" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "cost_source" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "provider_model_id" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "author" text;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "provider" text DEFAULT 'vercel_ai_gateway' NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "endpoint_status" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "endpoint_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN IF NOT EXISTS "routing_plan" jsonb;--> statement-breakpoint
ALTER TABLE "usage_events" ADD COLUMN IF NOT EXISTS "provider_generation_id" text;--> statement-breakpoint
ALTER TABLE "usage_events" ADD COLUMN IF NOT EXISTS "provider" text;--> statement-breakpoint
ALTER TABLE "usage_events" ADD COLUMN IF NOT EXISTS "provider_endpoint" text;--> statement-breakpoint
ALTER TABLE "usage_events" ADD COLUMN IF NOT EXISTS "cost_source" text;--> statement-breakpoint
ALTER TABLE "usage_events" ADD COLUMN IF NOT EXISTS "usage_evidence" jsonb;--> statement-breakpoint

-- Foreign keys and unique constraints have no IF NOT EXISTS form, so each is added only when absent.
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'model_endpoints_model_id_models_id_fk') THEN
		ALTER TABLE "model_endpoints" ADD CONSTRAINT "model_endpoints_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "model_endpoints_model_provider_unique" ON "model_endpoints" USING btree ("model_id","provider_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_endpoints_model_approved_idx" ON "model_endpoints" USING btree ("model_id","approved","enabled");--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'models_provider_model_id_unique') THEN
		ALTER TABLE "models" ADD CONSTRAINT "models_provider_model_id_unique" UNIQUE("provider_model_id");
	END IF;
END $$;--> statement-breakpoint

-- Historical rows keep working exactly as before: they remain labelled with the provider that
-- actually served them, and are never silently claimed as OpenRouter usage.
UPDATE "usage_events" SET "provider" = 'vercel_ai_gateway' WHERE "provider" IS NULL AND "gateway_generation_id" IS NOT NULL;--> statement-breakpoint
UPDATE "generation_jobs" SET "provider" = 'vercel_ai_gateway' WHERE "provider" IS NULL AND "gateway_generation_id" IS NOT NULL;--> statement-breakpoint

-- OpenRouter model IDs are the canonical `author/slug` form. Historical Gateway IDs had the same
-- shape, but they are NOT assumed to be valid OpenRouter IDs: the value is copied into the new
-- column only as a *candidate*, and the catalogue sync verifies it against the live catalogue. A
-- model that does not match stays on `vercel_ai_gateway` and is unavailable for new generations,
-- rather than being pointed at an ID that may 404 mid-generation.
UPDATE "models"
SET "provider_model_id" = "gateway_model_id",
    "author" = split_part("gateway_model_id", '/', 1)
WHERE "provider_model_id" IS NULL
  AND "gateway_model_id" ~ '^[^/[:space:]]+/[^/[:space:]]+$'
  AND NOT EXISTS (
    SELECT 1 FROM "models" AS other
    WHERE other."provider_model_id" = "models"."gateway_model_id"
      AND other."id" <> "models"."id"
  );
