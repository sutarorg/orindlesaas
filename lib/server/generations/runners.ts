import { experimental_getVideoStatus, experimental_startVideo, generateImage, generateText, type JSONValue } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { generationJobs, models, websiteBuilds, websiteProjects } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { extractGatewayGenerationId, getGateway } from "@/lib/server/ai/gateway";
import { markSubmissionAttempt, markSubmissionUncertain, recordProviderReference, settleGeneration } from "@/lib/server/generations/service";
import { storeGeneratedAsset } from "@/lib/server/storage/r2";
import { downloadProviderFile } from "@/lib/server/storage/provider-download";
import { parseGeneratedWebsite, validateWebsiteSource } from "@/lib/server/websites/source";

const imageOptions = z.object({
  prompt: z.string().min(1),
  size: z.string().optional(),
  aspectRatio: z.string().optional(),
  seed: z.number().int().optional(),
});
const videoOptions = z.object({
  prompt: z.string().min(1),
  duration: z.number().int().optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  generateAudio: z.boolean().optional(),
});
const websiteOptions = z.object({ prompt: z.string().min(1), name: z.string().min(2).max(80) });

async function getJob(jobId: string, userId: string) {
  const [row] = await getDb().select().from(generationJobs).innerJoin(models, eq(generationJobs.modelId, models.id)).where(
    and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId)),
  ).limit(1);
  if (!row?.generation_jobs.modelId) throw new AppError("not_found", 404, "The generation was not found.");
  return { ...row.generation_jobs, gatewayModelId: row.models.gatewayModelId };
}

export async function runGenerationJob(jobId: string, userId: string) {
  const existing = await getJob(jobId, userId);
  if (["succeeded", "failed", "cancelled", "reconciliation_required"].includes(existing.status)) return { status: existing.status };
  if (existing.status === "awaiting_provider" && existing.kind === "video") return pollVideoGeneration(jobId, userId);
  if (existing.submissionState !== "not_submitted") {
    await markSubmissionUncertain(jobId, userId);
    return { status: "reconciliation_required" };
  }
  const attempted = await markSubmissionAttempt(jobId, userId);
  if (!attempted) return { status: "reconciliation_required" };
  const job = { ...attempted, gatewayModelId: existing.gatewayModelId };

  try {
    if (job.kind === "image") {
      const options = imageOptions.parse(job.request);
      const result = await generateImage({
        model: getGateway().imageModel(job.gatewayModelId),
        prompt: options.prompt,
        size: options.size as `${number}x${number}` | undefined,
        aspectRatio: options.aspectRatio as `${number}:${number}` | undefined,
        seed: options.seed,
        maxRetries: 0,
        providerOptions: { gateway: { user: userId, tags: [`generation:${jobId}`] } },
      });
      const generationId = result.calls.map((call) => extractGatewayGenerationId(call.providerMetadata)).find(Boolean) ?? null;
      await recordProviderReference({ jobId, userId, generationId });
      if (!generationId) {
        await markSubmissionUncertain(jobId, userId, "missing_generation_id");
        return { status: "reconciliation_required" };
      }
      if (result.images.length === 0) return settleGeneration({ jobId, userId, status: "failed", result: { providerFailure: true, reason: "no_image_output" } });
      const assetIds: string[] = [];
      for (const image of result.images) {
        const extension = image.mediaType === "image/jpeg" ? "jpg" : image.mediaType === "image/webp" ? "webp" : "png";
        const asset = await storeGeneratedAsset({ userId, jobId, kind: "image", bytes: image.uint8Array, mimeType: image.mediaType, extension });
        assetIds.push(asset.id);
      }
      const settlement = await settleGeneration({ jobId, userId, result: { assetIds } });
      return settlement;
    }

    if (job.kind === "video") {
      const options = videoOptions.parse(job.request);
      const started = await experimental_startVideo({
        model: getGateway().videoModel(job.gatewayModelId),
        prompt: options.prompt,
        duration: options.duration,
        aspectRatio: options.aspectRatio as `${number}:${number}` | undefined,
        resolution: options.resolution as `${number}x${number}` | undefined,
        generateAudio: options.generateAudio,
        maxRetries: 0,
        providerOptions: { gateway: { user: userId, tags: [`generation:${jobId}`] } },
      });
      await recordProviderReference({
        jobId,
        userId,
        generationId: extractGatewayGenerationId(started.providerMetadata),
        providerOperation: { reference: started.operation },
        awaitingProvider: true,
      });
      return { status: "awaiting_provider" as const };
    }

    if (job.kind === "website") {
      const options = websiteOptions.parse(job.request);
      const result = await generateText({
        model: getGateway().languageModel(job.gatewayModelId),
        system: "Return only JSON matching {\"files\":[{\"path\":\"index.html|styles.css|script.js\",\"content\":\"...\"}]}. Create an accessible, responsive static website from the request. Use only local CSS/JS, no dependencies, external scripts, iframes, inline event handlers, network calls, secrets, or claims of real backend behavior.",
        prompt: options.prompt,
        maxOutputTokens: 5000,
        maxRetries: 0,
        providerOptions: { gateway: { user: userId, tags: [`generation:${jobId}`] } },
      });
      const generationId = extractGatewayGenerationId(result.finalStep.providerMetadata);
      await recordProviderReference({ jobId, userId, generationId });
      if (!generationId) {
        await markSubmissionUncertain(jobId, userId, "missing_generation_id");
        return { status: "reconciliation_required" };
      }
      const source = parseGeneratedWebsite(result.text);
      const sourceAsset = await storeGeneratedAsset({
        userId,
        jobId,
        kind: "website_source",
        bytes: new TextEncoder().encode(JSON.stringify({ files: source.files })),
        mimeType: "application/json",
        extension: "json",
      });
      const projectId = crypto.randomUUID();
      const slugBase = options.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "site";
      const [project] = await getDb().insert(websiteProjects).values({
        id: projectId,
        userId,
        generationJobId: jobId,
        name: options.name,
        slug: `${slugBase}-${jobId.slice(0, 8)}`,
        status: "validating",
        sourceAssetId: sourceAsset.id,
      }).returning();
      if (!project) throw new Error("Website project insert returned no row.");
      const [build] = await getDb().insert(websiteBuilds).values({
        projectId,
        status: "queued",
        sourceSha256: source.sourceSha256,
      }).returning();
      if (!build) throw new Error("Website build insert returned no row.");
      const settlement = await settleGeneration({ jobId, userId, result: { projectId, sourceAssetId: sourceAsset.id, buildId: build.id } });
      return { ...settlement, buildId: build.id, projectId };
    }

    await markSubmissionUncertain(jobId, userId, "unsupported_worker_kind");
    return { status: "reconciliation_required" };
  } catch (error) {
    await markSubmissionUncertain(jobId, userId, "provider_or_postprocessing_uncertain");
    return { status: "reconciliation_required", error: error instanceof Error ? error.name : "UnknownError" };
  }
}

export async function pollVideoGeneration(jobId: string, userId: string) {
  const job = await getJob(jobId, userId);
  if (job.kind !== "video" || job.status !== "awaiting_provider" || !job.providerOperation?.reference) {
    return { status: job.status };
  }
  try {
    const status = await experimental_getVideoStatus(getGateway().videoModel(job.gatewayModelId), {
      operation: job.providerOperation.reference as JSONValue,
      maxRetries: 0,
    });
    if (status.status === "pending") return { status: "awaiting_provider" as const };
    const generationId = extractGatewayGenerationId(status.providerMetadata) ?? job.gatewayGenerationId;
    await getDb().update(generationJobs).set({ gatewayGenerationId: generationId, updatedAt: new Date() }).where(eq(generationJobs.id, jobId));
    if (!generationId) {
      await markSubmissionUncertain(jobId, userId, "missing_generation_id");
      return { status: "reconciliation_required" };
    }
    if (status.status === "error") {
      return settleGeneration({ jobId, userId, status: "failed", result: { providerFailure: true } });
    }
    if (status.videos.length === 0) return settleGeneration({ jobId, userId, status: "failed", result: { providerFailure: true, reason: "no_video_output" } });
    const assetIds: string[] = [];
    for (const video of status.videos) {
      let bytes: Uint8Array;
      let mimeType = video.mediaType;
      if (video.type === "url") {
        const downloaded = await downloadProviderFile(video.url);
        bytes = downloaded.bytes;
        mimeType = downloaded.mimeType;
      } else if (video.type === "base64") {
        bytes = Buffer.from(video.data, "base64");
      } else if (video.type === "binary") {
        bytes = video.data;
      } else {
        throw new Error("Unexpected caller-managed video upload result.");
      }
      const asset = await storeGeneratedAsset({ userId, jobId, kind: "video", bytes, mimeType, extension: mimeType.includes("webm") ? "webm" : "mp4" });
      assetIds.push(asset.id);
    }
    return settleGeneration({ jobId, userId, result: { assetIds } });
  } catch (error) {
    return { status: "awaiting_provider" as const, error: error instanceof Error ? error.name : "PollError" };
  }
}

export async function validateWebsiteBuild(buildId: string) {
  const [build] = await getDb().select().from(websiteBuilds).where(eq(websiteBuilds.id, buildId)).limit(1);
  if (!build) throw new AppError("not_found", 404, "The website build was not found.");
  if (build.status === "passed") return { status: "passed" as const };
  const [project] = await getDb().select().from(websiteProjects).where(eq(websiteProjects.id, build.projectId)).limit(1);
  if (!project?.sourceAssetId || !project.generationJobId) throw new Error("Website source is missing.");
  const [generation] = await getDb().select({ status: generationJobs.status }).from(generationJobs).where(eq(generationJobs.id, project.generationJobId)).limit(1);
  if (generation?.status !== "succeeded") return { status: "blocked" as const };
  const { readOwnedAssetBytes } = await import("@/lib/server/storage/r2");
  const { bytes } = await readOwnedAssetBytes(project.userId, project.sourceAssetId);
  const source = validateWebsiteSource(JSON.parse(new TextDecoder().decode(bytes)));
  if (source.sourceSha256 !== build.sourceSha256) throw new AppError("conflict", 409, "The website source hash changed.");
  await getDb().update(websiteBuilds).set({ status: "building", updatedAt: new Date() }).where(eq(websiteBuilds.id, buildId));
  const { validateWebsiteInSandbox } = await import("@/lib/server/websites/sandbox");
  const validation = await validateWebsiteInSandbox(source.files);
  await getDb().transaction(async (tx) => {
    await tx.update(websiteBuilds).set({ status: validation.passed ? "passed" : "failed", diagnostics: validation.diagnostics, updatedAt: new Date() }).where(eq(websiteBuilds.id, buildId));
    await tx.update(websiteProjects).set({ status: validation.passed ? "validated" : "failed", updatedAt: new Date() }).where(eq(websiteProjects.id, project.id));
  });
  return { status: validation.passed ? "passed" as const : "failed" as const };
}
