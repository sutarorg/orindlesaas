import { timingSafeEqual } from "node:crypto";
import { apiHandler, json } from "@/lib/server/http";
import { AppError, integrationUnavailable } from "@/lib/server/errors";
import { readServerEnvironment } from "@/lib/server/env";
import { runCronTask, type CronTask } from "@/lib/server/jobs/runner";

export const runtime = "nodejs";
/** The outbox drain and catalog sync can exceed the default budget. */
export const maxDuration = 300;

const TASKS = new Set<CronTask>(["outbox", "metering", "catalog"]);

function authorized(request: Request) {
  const env = readServerEnvironment();
  const expected = env.JOBS_TICK_SECRET;
  if (!expected) throw integrationUnavailable("Scheduled job execution");
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // Length must match before a constant-time compare, otherwise timingSafeEqual throws.
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Scheduled entry point replacing Inngest cron triggers. Any external scheduler (Vercel Cron, a
 * platform cron, or a simple curl) can call this; the secret keeps it closed by default.
 *
 * GET /api/v1/jobs/tick?task=outbox|metering|catalog
 */
export const GET = apiHandler(async (request) => {
  if (!authorized(request)) throw new AppError("forbidden", 403, "This endpoint requires the job scheduler secret.");
  const task = new URL(request.url).searchParams.get("task") ?? "outbox";
  if (!TASKS.has(task as CronTask)) throw new AppError("bad_request", 400, "Unknown task. Use outbox, metering or catalog.");
  const result = await runCronTask(task as CronTask);
  return json({ task, result });
});
