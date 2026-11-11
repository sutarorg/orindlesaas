import { generateText } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { generationJobs, models, websiteBuilds, websiteProjects } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { openRouterLanguageModel } from "@/lib/server/ai/openrouter";
import { providerRoutingBody } from "@/lib/server/ai/routing";
import { isOpenRouterGenerationId } from "@/lib/server/ai/usage";
import {
  createOpenRouterVideoJob,
  downloadOpenRouterVideoContent,
  generateOpenRouterImage,
  getOpenRouterVideoJob,
} from "@/lib/server/ai/openrouter-api";
import { isVideoTerminal } from "@/lib/server/ai/contracts";
import { revalidateGenerationModel, type GenerationKind } from "@/lib/server/ai/models";
import { markSubmissionAttempt, markSubmissionUncertain, recordProviderReference, settleGeneration } from "@/lib/server/generations/service";
import { storeGeneratedAsset } from "@/lib/server/storage/r2";
import { parseGeneratedWebsite, validateWebsiteSource } from "@/lib/server/websites/source";

const imageOptions = z.object({
  prompt: z.string().min(1),
  size: z.string().optional(),
  aspectRatio: z.string().optional(),
  seed: z.number().int().optional(),
});
const videoOptions = z.object({
  prompt: z.string().min(1),
  duration: z.number().int().positive(),
  aspectRatio: z.string().optional(),
  resolution: z.string().min(1),
  generateAudio: z.boolean().optional(),
});
const websiteOptions = z.object({ prompt: z.string().min(1), name: z.string().min(2).max(80) });

/** Largest image Orindle will store from a provider, after base64 decoding. */
const MAX_IMAGE_BYTES = 40 * 1024 * 1024;
/** Media types Orindle accepts; anything else is rejected rather than stored blind. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

/**
 * Re-run central resolution at submission time so a disabled model, stale discovery,
 * withdrawn compatibility or an unapproved endpoint cannot reach the provider on a queued job.
 */
async function approvedOptions(kind: "image" | "video" | "website", modelId: string | null, prompt: string, request: Record<string, unknown>) {
  if (!modelId) throw new AppError("not_found", 404, "The generation has no model mapping.");
  return revalidateGenerationModel({ modelId, kind, prompt, options: request });
}

async function getJob(jobId: string, userId: string) {
  const [row] = await getDb().select().from(generationJobs).innerJoin(models, eq(generationJobs.modelId, models.id)).where(
    and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId)),
  ).limit(1);
  if (!row?.generation_jobs.modelId) throw new AppError("not_found", 404, "The generation was not found.");
  return {
    ...row.generation_jobs,
    providerModelId: row.models.providerModelId ?? row.models.gatewayModelId,
    routingPlan: row.models.routingPlan,
    modelProvider: row.models.provider,
  };
}

/**
 * Decodes and validates a base64 image from the OpenRouter image API.
 *
 * The native API returns bytes rather than a URL, so three things must be checked before the value
 * is trusted: the base64 itself must be valid, the declared media type must be one Orindle stores,
 * and the decoded size must be within bounds. A malformed payload is rejected here — never written
 * to R2 and never settled as a successful generation.
 */
export function decodeProviderImage(input: { b64: string; mediaType?: string | null }) {
  const declared = (input.mediaType ?? "image/png").toLowerCase();
  const extension = ALLOWED_IMAGE_TYPES[declared];
  if (!extension) throw new AppError("conflict", 409, "The provider returned an unsupported image format.");
  const normalized = input.b64.replace(/\s/g, "");
  if (normalized.length === 0 || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new AppError("conflict", 409, "The provider returned a malformed image payload.");
  }
  const bytes = Buffer.from(normalized, "base64");
  // Buffer.from is lenient about trailing garbage, so re-encoding is the reliable round-trip check.
  if (bytes.length === 0 || bytes.toString("base64").replace(/=+$/, "") !== normalized.replace(/=+$/, "")) {
    throw new AppError("conflict", 409, "The provider returned a malformed image payload.");
  }
  if (bytes.length > MAX_IMAGE_BYTES) throw new AppError("payload_too_large", 413, "The generated image is too large.");
  // The declared media type is the provider's claim; the magic bytes are the evidence. Validating
  // base64 alone would happily store an HTML document that a browser later renders as an image URL,
  // which is a stored-content risk, so a mismatch is rejected rather than relabelled.
  if (!matchesImageSignature(bytes, declared)) {
    throw new AppError("conflict", 409, "The provider returned image data that does not match its declared format.");
  }
  return { bytes, mimeType: declared, extension };
}

/** Signature check per accepted format. SVG is text, so it is matched by its opening markup. */
function matchesImageSignature(bytes: Buffer, mediaType: string): boolean {
  const starts = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  switch (mediaType) {
    case "image/png":
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return starts([0xff, 0xd8, 0xff]);
    case "image/gif":
      return starts([0x47, 0x49, 0x46, 0x38]);
    case "image/webp":
      return starts([0x52, 0x49, 0x46, 0x46]) && bytes.subarray(8, 12).toString("latin1") === "WEBP";
    case "image/svg+xml": {
      const head = bytes.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
      return head.startsWith("<svg") || head.startsWith("<?xml");
    }
    default:
      return false;
  }
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
  const job = { ...attempted, providerModelId: existing.providerModelId, routingPlan: existing.routingPlan, modelProvider: existing.modelProvider };

  try {
    if (job.kind === "image") {
      const options = imageOptions.parse(job.request);
      const resolved = await approvedOptions(job.kind, job.modelId, options.prompt, options);
      const approved = resolved.submissionOptions;
      const response = await generateOpenRouterImage({
        model: resolved.providerModelId,
        prompt: options.prompt,
        n: 1,
        size: approved.size as string | undefined,
        aspectRatio: approved.aspectRatio as string | undefined,
        seed: approved.seed as number | undefined,
        provider: resolved.routing ? providerRoutingBody(resolved.routing) as unknown as Record<string, unknown> : undefined,
      });
      // The image API has no per-generation cost endpoint of its own, so the response cost is the
      // only evidence. It is recorded as unverified and the settlement path still prefers a lookup.
      const assetIds: string[] = [];
      for (const image of response.data) {
        const decoded = decodeProviderImage({ b64: image.b64_json, mediaType: image.media_type });
        const asset = await storeGeneratedAsset({
          userId,
          jobId,
          kind: "image",
          bytes: decoded.bytes,
          mimeType: decoded.mimeType,
          extension: decoded.extension,
        });
        assetIds.push(asset.id);
      }
      if (assetIds.length === 0) {
        await markSubmissionUncertain(jobId, userId, "no_image_output");
        return { status: "reconciliation_required" };
      }
      await recordProviderReference({ jobId, userId, generationId: null });
      return settleGeneration({
        jobId,
        userId,
        result: { assetIds, providerCostUsd: response.usage?.cost ?? null },
      });
    }

    if (job.kind === "video") {
      const options = videoOptions.parse(job.request);
      const resolved = await approvedOptions(job.kind, job.modelId, options.prompt, options);
      const approved = resolved.submissionOptions;
      const accepted = await createOpenRouterVideoJob({
        model: resolved.providerModelId,
        prompt: options.prompt,
        duration: approved.duration as number,
        resolution: approved.resolution as string,
        aspectRatio: approved.aspectRatio as string | undefined,
        generateAudio: approved.generateAudio as boolean,
        provider: resolved.routing ? providerRoutingBody(resolved.routing) as unknown as Record<string, unknown> : undefined,
      });
      // The job ID is persisted immediately: it is the only durable handle on a render that may
      // take minutes, and losing it would mean resubmitting a paid job to recover.
      await recordProviderReference({
        jobId,
        userId,
        generationId: accepted.generation_id ?? null,
        providerJobId: accepted.id,
        providerOperation: { reference: accepted.id, pollingUrl: accepted.polling_url ?? null, status: accepted.status },
        awaitingProvider: true,
      });
      return { status: "awaiting_provider" as const };
    }

    if (job.kind === "website") {
      const options = websiteOptions.parse(job.request);
      const resolved = await approvedOptions(job.kind, job.modelId, options.prompt, options);
      const approved = resolved.submissionOptions;
      const routing = resolved.routing ? providerRoutingBody(resolved.routing) : undefined;
      const result = await generateText({
        model: openRouterLanguageModel(resolved.providerModelId, routing ? { provider: routing } : undefined),
        system: `Return only JSON matching {"files":[{"path":"index.html|styles.css|script.js","content":"..."}]}. Create an accessible, responsive static website from the request. Use only local CSS/JS, no dependencies, external scripts, iframes, inline event handlers, network calls, secrets, or claims of real backend behavior.`,
        prompt: options.prompt,
        maxOutputTokens: approved.maxOutputTokens as number,
        maxRetries: 0,
      });
      const generationId = isOpenRouterGenerationId(result.response?.id ?? "") ? result.response!.id : null;
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

/**
 * Polls one asynchronous OpenRouter video job.
 *
 * This never submits: it only reads the job it was given. A failed poll returns the job to
 * `awaiting_provider` so the next tick retries the *read*, which is safe, rather than the *write*,
 * which would create a second billable render for one customer click.
 */
export async function pollVideoGeneration(jobId: string, userId: string) {
  const job = await getJob(jobId, userId);
  if (job.kind !== "video" || !job.providerJobId) return { status: job.status };
  if (job.status !== "awaiting_provider") return { status: job.status };
  try {
    const status = await getOpenRouterVideoJob(job.providerJobId);
    if (!isVideoTerminal(status.status)) {
      await getDb().update(generationJobs)
        .set({ providerOperation: { reference: job.providerJobId, status: status.status }, updatedAt: new Date() })
        .where(eq(generationJobs.id, jobId));
      return { status: "awaiting_provider" as const, providerStatus: status.status };
    }
    if (status.status !== "completed") {
      // A terminal non-success state is a definite provider outcome: the customer is not charged.
      return settleGeneration({
        jobId,
        userId,
        status: "failed",
        result: { providerFailure: true, providerStatus: status.status, reason: typeof status.error === "string" ? status.error.slice(0, 200) : null },
      });
    }
    const generationId = status.generation_id && isOpenRouterGenerationId(status.generation_id) ? status.generation_id : job.providerGenerationId;
    await recordProviderReference({ jobId, userId, generationId, providerJobId: job.providerJobId, awaitingProvider: true });
    const downloaded = await downloadOpenRouterVideoContent(job.providerJobId);
    const asset = await storeGeneratedAsset({
      userId,
      jobId,
      kind: "video",
      bytes: downloaded.bytes,
      mimeType: downloaded.mimeType,
      extension: downloaded.mimeType.includes("webm") ? "webm" : "mp4",
    });
    return settleGeneration({ jobId, userId, result: { assetIds: [asset.id], providerCostUsd: status.usage?.cost ?? null } });
  } catch (error) {
    // Deliberately still `awaiting_provider`, not a failure: a poll error says nothing about the
    // render, and the next tick will read again. Only a terminal provider state ends the job.
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

export type { GenerationKind };
