-- Replace the hosted Inngest and Upstash Redis integrations with in-process equivalents.
--
-- Queued work now executes in the application (lib/server/jobs/runner.ts), still driven by the
-- durable outbox_events table, which is retained unchanged. Abuse limiting moves from Redis to the
-- rate_limits table below. Both the outbox status check and the new table are guarded so this file
-- is safe to re-run, matching the guarantees 0003 now provides.

-- Outbox rows are claimed in-process, so an event may legitimately be mid-flight for longer than a
-- single request. The partial index keeps the recovery drain's "pending and due" scan cheap.
CREATE INDEX IF NOT EXISTS "outbox_pending_due_idx" ON "outbox_events" USING btree ("available_at") WHERE "status" = 'pending';--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "rate_limits" (
	"name" text NOT NULL,
	"identifier" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limits_name_identifier_window_start_pk" PRIMARY KEY("name","identifier","window_start")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limits_expires_idx" ON "rate_limits" USING btree ("expires_at");--> statement-breakpoint

-- Counters are server-only state; the browser Data API must never read or write them.
REVOKE ALL ON "public"."rate_limits" FROM "anon", "authenticated";--> statement-breakpoint

-- The hosted queue is gone, so any row still marked as handed to it must be re-driven locally.
UPDATE "public"."outbox_events" SET "status" = 'pending', "updated_at" = now() WHERE "status" = 'processing' AND "published_at" IS NULL;
