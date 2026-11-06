import { and, eq, isNotNull, lte } from "drizzle-orm";
import { inngest, dispatchPendingOutbox } from "@/lib/server/jobs/outbox";
import { runGenerationJob, pollVideoGeneration, validateWebsiteBuild } from "@/lib/server/generations/runners";
import { settleGeneration } from "@/lib/server/generations/service";
import { getDb } from "@/lib/server/db/client";
import { generationJobs } from "@/lib/server/db/schema";
import { deliverEmail } from "@/lib/server/email/service";
import { pollDeployment, submitDeployment } from "@/lib/server/websites/deployments";
import { markExpiredSyncRuns, syncGatewayCatalog } from "@/lib/server/ai/catalog-sync";

export const generationRequested = inngest.createFunction(
  {
    id: "generation-requested",
    retries: 2,
    concurrency: [{ limit: 3, scope: "account", key: "event.data.userId" }],
    triggers: { event: "orindle/generation.requested" },
  },
  async ({ event, step }) => {
    const { jobId, userId } = event.data as { jobId: string; userId: string };
    const initial = await step.run("submit-or-resume-generation", () => runGenerationJob(jobId, userId));
    if (initial.status === "awaiting_provider") {
      let latest: { status: string } = initial;
      for (let attempt = 0; attempt < 40 && latest.status === "awaiting_provider"; attempt += 1) {
        await step.sleep(`video-poll-wait-${attempt}`, "30s");
        latest = await step.run(`video-poll-${attempt}`, () => pollVideoGeneration(jobId, userId));
      }
      if (latest.status === "awaiting_provider") {
        const { markSubmissionUncertain } = await import("@/lib/server/generations/service");
        await step.run("video-poll-timeout", () => markSubmissionUncertain(jobId, userId, "provider_poll_timeout"));
        return { status: "reconciliation_required" };
      }
      return latest;
    }
    if ("buildId" in initial && typeof initial.buildId === "string" && initial.status === "succeeded") {
      return step.run("validate-static-website", () => validateWebsiteBuild(initial.buildId as string));
    }
    return initial;
  },
);

export const outboxRecovery = inngest.createFunction(
  { id: "outbox-recovery", retries: 2, triggers: { cron: "* * * * *" } },
  async ({ step }) => step.run("dispatch-pending-outbox", () => dispatchPendingOutbox(20)),
);

export const meteringRecovery = inngest.createFunction(
  { id: "metering-recovery", retries: 1, triggers: { cron: "*/5 * * * *" } },
  async ({ step }) => {
    const jobs = await step.run("find-reconcilable-generations", () => getDb().select({ id: generationJobs.id, userId: generationJobs.userId }).from(generationJobs).where(
      and(
        eq(generationJobs.status, "reconciliation_required"),
        isNotNull(generationJobs.gatewayGenerationId),
        isNotNull(generationJobs.result),
        lte(generationJobs.updatedAt, new Date(Date.now() - 60_000)),
      ),
    ).limit(10));
    const results = [];
    for (const job of jobs) {
      results.push(await step.run(`reconcile-${job.id}`, () => settleGeneration({ jobId: job.id, userId: job.userId })));
    }
    return results;
  },
);

export const websiteValidationRequested = inngest.createFunction(
  { id: "website-validation-requested", retries: 2, triggers: { event: "orindle/website.validation.requested" } },
  async ({ event, step }) => {
    const { buildId } = event.data as { buildId: string };
    return step.run("validate-static-website", () => validateWebsiteBuild(buildId));
  },
);

export const emailDeliveryRequested = inngest.createFunction(
  { id: "email-delivery-requested", retries: 2, triggers: { event: "orindle/email.delivery.requested" } },
  async ({ event, step }) => {
    const { emailId } = event.data as { emailId: string };
    return step.run("deliver-email", () => deliverEmail(emailId));
  },
);

export const deploymentRequested = inngest.createFunction(
  { id: "deployment-requested", retries: 2, triggers: { event: "orindle/deployment.requested" } },
  async ({ event, step }) => {
    const { deploymentId } = event.data as { deploymentId: string };
    let latest = await step.run("submit-preview-deployment", () => submitDeployment(deploymentId));
    for (let attempt = 0; attempt < 40 && ["queued", "building"].includes(latest.status); attempt += 1) {
      await step.sleep(`deployment-poll-wait-${attempt}`, "15s");
      latest = await step.run(`deployment-poll-${attempt}`, () => pollDeployment(deploymentId));
    }
    return latest;
  },
);

export const catalogSyncScheduled = inngest.createFunction(
  { id: "catalog-sync-scheduled", retries: 0, triggers: { cron: "17 3 * * *" } },
  async ({ step }) => {
    await step.run("expire-stale-catalog-sync-leases", () => markExpiredSyncRuns());
    const day = new Date().toISOString().slice(0, 10);
    return step.run("sync-gateway-catalog", () => syncGatewayCatalog({ trigger: "scheduled", mode: "incremental", requestId: `catalog-sync:scheduled:${day}` }));
  },
);

export const jobFunctions = [generationRequested, websiteValidationRequested, emailDeliveryRequested, deploymentRequested, outboxRecovery, meteringRecovery, catalogSyncScheduled];
