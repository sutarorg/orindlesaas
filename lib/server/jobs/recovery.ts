import { and, eq, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { generationJobs } from "@/lib/server/db/schema";
import { settleGeneration } from "@/lib/server/generations/service";

/**
 * Metering recovery, previously an Inngest cron function.
 *
 * Generations that were charged for a submission but whose outcome is unknown are settled from the
 * provider's recorded result. `settleGeneration` is idempotent, so a job picked up twice is safe.
 */
export async function reconcileStuckGenerations(limit = 10) {
  const jobs = await getDb()
    .select({ id: generationJobs.id, userId: generationJobs.userId })
    .from(generationJobs)
    .where(
      and(
        eq(generationJobs.status, "reconciliation_required"),
        isNotNull(generationJobs.gatewayGenerationId),
        isNotNull(generationJobs.result),
        lte(generationJobs.updatedAt, new Date(Date.now() - 60_000)),
      ),
    )
    .limit(limit);

  const results = [];
  for (const job of jobs) {
    results.push(await settleGeneration({ jobId: job.id, userId: job.userId }));
  }
  return results;
}
