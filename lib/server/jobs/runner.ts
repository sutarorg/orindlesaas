import { markExpiredSyncRuns, syncGatewayCatalog } from "@/lib/server/ai/catalog-sync";
import { pollVideoGeneration, runGenerationJob, validateWebsiteBuild } from "@/lib/server/generations/runners";
import { deliverEmail } from "@/lib/server/email/service";
import { pollDeployment, submitDeployment } from "@/lib/server/websites/deployments";

/**
 * In-process job execution, replacing the hosted Inngest queue.
 *
 * Each outbox row already records exactly what work it represents, so the runner reads the payload
 * and does the work directly. Every handler below is re-runnable: `runGenerationJob` claims the job
 * through `markSubmissionAttempt` before touching a provider, `deliverEmail` and the deployment
 * helpers are keyed on their own row state, and `settleGeneration` is idempotent. That is what makes
 * a drained outbox safe — an event can be retried without submitting a second paid generation.
 */

export const OUTBOX_EVENTS = [
  "orindle/generation.requested",
  "orindle/website.validation.requested",
  "orindle/email.delivery.requested",
  "orindle/deployment.requested",
] as const;

export type OutboxEventName = (typeof OUTBOX_EVENTS)[number];

/** How long a single event may occupy the inline path before it is left to the recovery drain. */
const INLINE_BUDGET_MS = 25_000;
/** Video and deployment polling is long-running; inline requests kick them off, recovery finishes. */
const MAX_POLL_ATTEMPTS = 40;

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function pollVideoToCompletion(jobId: string, userId: string) {
  let latest = await pollVideoGeneration(jobId, userId);
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS && latest.status === "awaiting_provider"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    latest = await pollVideoGeneration(jobId, userId);
  }
  return latest;
}

async function pollDeploymentToCompletion(deploymentId: string) {
  let latest = await submitDeployment(deploymentId);
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS && ["queued", "building"].includes(latest.status); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 15_000));
    latest = await pollDeployment(deploymentId);
  }
  return latest;
}

/**
 * Executes one outbox event. `inline` is set when the caller is a user-facing request: long-running
 * provider polling is then left to the recovery drain so the request returns within its budget.
 */
export async function runOutboxEvent(
  eventName: string,
  payload: Record<string, unknown>,
  options: { inline?: boolean } = {},
) {
  const { inline = false } = options;

  switch (eventName) {
    case "orindle/generation.requested": {
      const jobId = payloadString(payload, "jobId");
      const userId = payloadString(payload, "userId");
      if (!jobId || !userId) throw new Error("generation.requested payload is missing jobId or userId");
      const initial = await runGenerationJob(jobId, userId);
      if (initial.status === "awaiting_provider") {
        return inline ? initial : pollVideoToCompletion(jobId, userId);
      }
      if ("buildId" in initial && typeof initial.buildId === "string" && initial.status === "succeeded") {
        return validateWebsiteBuild(initial.buildId);
      }
      return initial;
    }
    case "orindle/website.validation.requested": {
      const buildId = payloadString(payload, "buildId");
      if (!buildId) throw new Error("website.validation.requested payload is missing buildId");
      return validateWebsiteBuild(buildId);
    }
    case "orindle/email.delivery.requested": {
      const emailId = payloadString(payload, "emailId");
      if (!emailId) throw new Error("email.delivery.requested payload is missing emailId");
      return deliverEmail(emailId);
    }
    case "orindle/deployment.requested": {
      const deploymentId = payloadString(payload, "deploymentId");
      if (!deploymentId) throw new Error("deployment.requested payload is missing deploymentId");
      return inline ? submitDeployment(deploymentId) : pollDeploymentToCompletion(deploymentId);
    }
    default:
      throw new Error(`Unknown outbox event: ${eventName}`);
  }
}

/**
 * Scheduled ticks previously provided by Inngest cron. Exposed as one authenticated endpoint so the
 * work still happens on a schedule without a hosted scheduler.
 */
export type CronTask = "outbox" | "metering" | "catalog";

export async function runCronTask(task: CronTask) {
  const { dispatchPendingOutbox } = await import("@/lib/server/jobs/outbox");
  switch (task) {
    case "outbox": {
      const { reclaimStaleOutboxEvents } = await import("@/lib/server/jobs/outbox");
      await reclaimStaleOutboxEvents();
      return dispatchPendingOutbox(20);
    }
    case "metering": {
      const { reconcileStuckGenerations } = await import("@/lib/server/jobs/recovery");
      return reconcileStuckGenerations();
    }
    case "catalog": {
      await markExpiredSyncRuns();
      const day = new Date().toISOString().slice(0, 10);
      return syncGatewayCatalog({ trigger: "scheduled", mode: "incremental", requestId: `catalog-sync:scheduled:${day}` });
    }
  }
}

export { INLINE_BUDGET_MS };
