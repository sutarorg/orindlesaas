-- Reviewed: safe for populated generation_jobs as well as fresh installations.
ALTER TABLE "generation_jobs" ADD COLUMN "request_sha256" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "submission_state" text DEFAULT 'not_submitted' NOT NULL;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
-- A legacy hash is only an idempotency safeguard. Existing jobs are never resubmitted merely to improve it.
UPDATE "generation_jobs"
SET "request_sha256" = encode(digest(coalesce("request"::text, '{}'), 'sha256'), 'hex')
WHERE "request_sha256" IS NULL;--> statement-breakpoint
UPDATE "generation_jobs"
SET "submission_state" = CASE
  WHEN "status" = 'queued' THEN 'not_submitted'
  WHEN "gateway_generation_id" IS NOT NULL THEN 'completed'
  WHEN "status" IN ('running', 'awaiting_provider') THEN 'uncertain'
  ELSE 'completed'
END;--> statement-breakpoint
ALTER TABLE "generation_jobs" ALTER COLUMN "request_sha256" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_request_sha256_format" CHECK ("generation_jobs"."request_sha256" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_submission_state_valid" CHECK ("submission_state" IN ('not_submitted', 'attempted', 'completed', 'uncertain'));
