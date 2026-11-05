-- Reviewed Prompt 5 integrity/bootstrap migration. Requires Supabase auth.users.
ALTER TABLE "public"."credit_reservations"
  ADD CONSTRAINT "credit_reservations_job_id_generation_jobs_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE restrict;--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public"."orindle_prevent_append_only_mutation"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION "public"."orindle_prevent_append_only_mutation"() FROM PUBLIC;--> statement-breakpoint

CREATE TRIGGER "wallet_ledger_append_only"
BEFORE UPDATE OR DELETE ON "public"."wallet_ledger"
FOR EACH ROW EXECUTE FUNCTION "public"."orindle_prevent_append_only_mutation"();--> statement-breakpoint
CREATE TRIGGER "audit_events_append_only"
BEFORE UPDATE OR DELETE ON "public"."audit_events"
FOR EACH ROW EXECUTE FUNCTION "public"."orindle_prevent_append_only_mutation"();--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."orindle_protect_price_version"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'model_prices is append-only';
  END IF;
  -- Rates, source, identity and effective start are immutable. Only close an open interval once.
  IF NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."model_id" IS DISTINCT FROM OLD."model_id"
    OR NEW."input_nano_usd_per_token" IS DISTINCT FROM OLD."input_nano_usd_per_token"
    OR NEW."output_nano_usd_per_token" IS DISTINCT FROM OLD."output_nano_usd_per_token"
    OR NEW."operation_nano_usd" IS DISTINCT FROM OLD."operation_nano_usd"
    OR NEW."source" IS DISTINCT FROM OLD."source"
    OR NEW."effective_from" IS DISTINCT FROM OLD."effective_from"
    OR NEW."created_at" IS DISTINCT FROM OLD."created_at"
    OR OLD."effective_to" IS NOT NULL
    OR NEW."effective_to" IS NULL
    OR NEW."effective_to" <= OLD."effective_from" THEN
    RAISE EXCEPTION 'only the first valid effective_to closure is allowed on model_prices';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION "public"."orindle_protect_price_version"() FROM PUBLIC;--> statement-breakpoint

CREATE TRIGGER "model_prices_protect_version"
BEFORE UPDATE OR DELETE ON "public"."model_prices"
FOR EACH ROW EXECUTE FUNCTION "public"."orindle_protect_price_version"();--> statement-breakpoint
CREATE UNIQUE INDEX "model_prices_one_open_per_model"
ON "public"."model_prices" ("model_id") WHERE "effective_to" IS NULL;--> statement-breakpoint

CREATE OR REPLACE FUNCTION "public"."orindle_handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO "public"."profiles" ("id", "email", "display_name")
  VALUES (NEW."id", NEW."email", left(coalesce(NEW."raw_user_meta_data" ->> 'name', ''), 80))
  ON CONFLICT ("id") DO UPDATE SET "email" = EXCLUDED."email";
  INSERT INTO "public"."wallets" ("user_id") VALUES (NEW."id") ON CONFLICT ("user_id") DO NOTHING;
  RETURN NEW;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION "public"."orindle_handle_new_user"() FROM PUBLIC;--> statement-breakpoint

INSERT INTO "public"."profiles" ("id", "email", "display_name")
SELECT "id", "email", left(coalesce("raw_user_meta_data" ->> 'name', ''), 80) FROM "auth"."users"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "public"."wallets" ("user_id") SELECT "id" FROM "public"."profiles" ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint

DROP TRIGGER IF EXISTS "on_orindle_auth_user_created" ON "auth"."users";--> statement-breakpoint
CREATE TRIGGER "on_orindle_auth_user_created"
AFTER INSERT ON "auth"."users"
FOR EACH ROW EXECUTE FUNCTION "public"."orindle_handle_new_user"();--> statement-breakpoint

INSERT INTO "public"."credit_packs" ("id", "name", "credits", "subtotal_usd_cents", "currency", "enabled") VALUES
  ('creator', 'Creator', 1900, 1900, 'USD', true),
  ('pro', 'Pro', 4900, 4900, 'USD', true),
  ('studio', 'Studio', 9900, 9900, 'USD', true)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint

-- Never grant browser Data API writes to financial, authz, evidence or job tables.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON
  "public"."profiles", "public"."admin_roles", "public"."wallets", "public"."wallet_ledger",
  "public"."credit_reservations", "public"."credit_packs", "public"."purchases", "public"."payments",
  "public"."webhook_events", "public"."idempotency_records", "public"."providers", "public"."models",
  "public"."model_prices", "public"."generation_jobs", "public"."usage_events", "public"."conversations",
  "public"."messages", "public"."assets", "public"."website_projects", "public"."website_builds",
  "public"."deployments", "public"."account_deletion_requests", "public"."contact_messages",
  "public"."email_outbox", "public"."outbox_events", "public"."audit_events"
FROM "anon", "authenticated";--> statement-breakpoint

REVOKE ALL ON
  "public"."webhook_events", "public"."idempotency_records", "public"."model_prices",
  "public"."account_deletion_requests", "public"."contact_messages", "public"."email_outbox",
  "public"."outbox_events", "public"."audit_events"
FROM "anon", "authenticated";--> statement-breakpoint

GRANT SELECT ON
  "public"."profiles", "public"."admin_roles", "public"."wallets", "public"."wallet_ledger",
  "public"."purchases", "public"."payments", "public"."providers", "public"."models",
  "public"."conversations", "public"."messages"
TO "authenticated";--> statement-breakpoint
GRANT SELECT ON "public"."providers", "public"."models", "public"."credit_packs" TO "anon", "authenticated";--> statement-breakpoint

-- Prevent direct Data API bypass of display-safe DTOs for internal costs, provider operations,
-- storage keys, sandbox diagnostics and deployment identifiers. Server queries remain owner-scoped.
REVOKE SELECT ON
  "public"."credit_reservations", "public"."generation_jobs", "public"."usage_events",
  "public"."assets", "public"."website_projects", "public"."website_builds", "public"."deployments"
FROM "anon", "authenticated";--> statement-breakpoint
