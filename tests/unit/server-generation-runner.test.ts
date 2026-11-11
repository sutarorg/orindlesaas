import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  generateOpenRouterImage: vi.fn(),
  createOpenRouterVideoJob: vi.fn(),
  getOpenRouterVideoJob: vi.fn(),
  downloadOpenRouterVideoContent: vi.fn(),
  generateText: vi.fn(),
  languageModel: vi.fn(),
  markSubmissionAttempt: vi.fn(),
  markSubmissionUncertain: vi.fn(),
  recordProviderReference: vi.fn(),
  settleGeneration: vi.fn(),
  storeGeneratedAsset: vi.fn(),
  revalidateGenerationModel: vi.fn(),
}));

vi.mock("ai", () => ({ generateText: mocks.generateText }));
vi.mock("@/lib/server/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/server/ai/openrouter", () => ({ openRouterLanguageModel: mocks.languageModel }));
vi.mock("@/lib/server/ai/openrouter-api", () => ({
  generateOpenRouterImage: mocks.generateOpenRouterImage,
  createOpenRouterVideoJob: mocks.createOpenRouterVideoJob,
  getOpenRouterVideoJob: mocks.getOpenRouterVideoJob,
  downloadOpenRouterVideoContent: mocks.downloadOpenRouterVideoContent,
}));
vi.mock("@/lib/server/generations/service", () => ({
  markSubmissionAttempt: mocks.markSubmissionAttempt,
  markSubmissionUncertain: mocks.markSubmissionUncertain,
  recordProviderReference: mocks.recordProviderReference,
  settleGeneration: mocks.settleGeneration,
}));
vi.mock("@/lib/server/storage/r2", () => ({ storeGeneratedAsset: mocks.storeGeneratedAsset }));
vi.mock("@/lib/server/ai/models", () => ({ revalidateGenerationModel: mocks.revalidateGenerationModel }));

import { decodeProviderImage, runGenerationJob, pollVideoGeneration } from "@/lib/server/generations/runners";

const jobId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";
/** A minimal but genuine PNG signature, so the format check passes for the right reason. */
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const PNG_BASE64 = PNG_BYTES.toString("base64");

const baseJob = {
  id: jobId,
  userId,
  kind: "image",
  modelId: "vendor/image-model",
  status: "queued",
  submissionState: "not_submitted",
  request: { prompt: "A quiet abstract landscape", size: "1024x1024" },
  providerOperation: null,
  providerGenerationId: null,
  gatewayGenerationId: null,
  providerJobId: null,
};

/** Arranges the single joined read `getJob` performs. */
function arrangeJob(job: Record<string, unknown>) {
  const limit = vi.fn().mockResolvedValue([{
    generation_jobs: job,
    models: { providerModelId: "vendor/image-model", gatewayModelId: "vendor/image-model", routingPlan: null, provider: "openrouter" },
  }]);
  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  mocks.getDb.mockReturnValue({ select: vi.fn().mockReturnValue({ from }), update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.markSubmissionUncertain.mockResolvedValue(undefined);
  mocks.recordProviderReference.mockResolvedValue({});
  mocks.storeGeneratedAsset.mockResolvedValue({ id: "asset-1" });
  mocks.settleGeneration.mockResolvedValue({ status: "succeeded", actualCredits: 2 });
  mocks.revalidateGenerationModel.mockResolvedValue({
    submissionOptions: { size: "1024x1024" },
    providerModelId: "vendor/image-model",
    routing: null,
  });
});

describe("image generation through the native OpenRouter API", () => {
  it("decodes base64 output, stores it with the provider's media type, and settles", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...baseJob, status: "running", submissionState: "attempted" });
    mocks.generateOpenRouterImage.mockResolvedValue({
      created: 1,
      data: [{ b64_json: PNG_BASE64, media_type: "image/png" }],
      usage: { cost: 0.04, completion_tokens: 4175, total_tokens: 4175 },
    });

    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "succeeded", actualCredits: 2 });
    expect(mocks.generateOpenRouterImage).toHaveBeenCalledWith(expect.objectContaining({
      model: "vendor/image-model",
      prompt: "A quiet abstract landscape",
      size: "1024x1024",
    }));
    // Media type comes from the response, not a hardcoded guess: an SVG must not be stored as PNG.
    expect(mocks.storeGeneratedAsset).toHaveBeenCalledWith(expect.objectContaining({ mimeType: "image/png", extension: "png" }));
    expect(mocks.settleGeneration).toHaveBeenCalledWith({
      jobId,
      userId,
      result: { assetIds: ["asset-1"], providerCostUsd: 0.04 },
    });
  });

  it("rejects a non-base64 payload instead of storing it as an image", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...baseJob, status: "running", submissionState: "attempted" });
    mocks.generateOpenRouterImage.mockResolvedValue({
      created: 1,
      data: [{ b64_json: "https://example.com/not-an-image.png", media_type: "image/png" }],
      usage: null,
    });

    const result = await runGenerationJob(jobId, userId);
    expect(result).toMatchObject({ status: "reconciliation_required" });
    // A URL-shaped payload is the classic misreading of this API; nothing may be stored from it.
    expect(mocks.storeGeneratedAsset).not.toHaveBeenCalled();
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });

  it("rejects an unsupported media type", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...baseJob, status: "running", submissionState: "attempted" });
    mocks.generateOpenRouterImage.mockResolvedValue({
      created: 1,
      data: [{ b64_json: PNG_BASE64, media_type: "application/zip" }],
      usage: null,
    });
    await expect(runGenerationJob(jobId, userId)).resolves.toMatchObject({ status: "reconciliation_required" });
    expect(mocks.storeGeneratedAsset).not.toHaveBeenCalled();
  });

  it("never resubmits an attempted chargeable operation after a worker retry", async () => {
    arrangeJob({ ...baseJob, status: "running", submissionState: "attempted" });
    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "reconciliation_required" });
    expect(mocks.generateOpenRouterImage).not.toHaveBeenCalled();
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });

  it("does not call the provider when the atomic submission claim is lost", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue(null);
    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "reconciliation_required" });
    expect(mocks.generateOpenRouterImage).not.toHaveBeenCalled();
  });

  it("blocks the provider call when submission-time revalidation fails", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...baseJob, status: "running", submissionState: "attempted" });
    mocks.revalidateGenerationModel.mockRejectedValue(new Error("no approved endpoint"));
    await expect(runGenerationJob(jobId, userId)).resolves.toMatchObject({ status: "reconciliation_required" });
    expect(mocks.generateOpenRouterImage).not.toHaveBeenCalled();
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });
});

describe("image payload validation", () => {
  it("accepts valid base64 and reports the true byte length", () => {
    const decoded = decodeProviderImage({ b64: PNG_BASE64, mediaType: "image/png" });
    expect(decoded.bytes.length).toBe(PNG_BYTES.length);
    expect(decoded.extension).toBe("png");
  });

  it("rejects payloads that are not valid base64 at all", () => {
    expect(() => decodeProviderImage({ b64: "!!!!", mediaType: "image/png" })).toThrow();
    expect(() => decodeProviderImage({ b64: "", mediaType: "image/png" })).toThrow();
  });

  it("rejects bytes that do not match the declared image format", () => {
    // Base64 validity is not image validity: an HTML document declaring image/png would otherwise be
    // stored and later served to a browser under an image content type.
    const html = Buffer.from("<!doctype html><script>alert(1)</script>").toString("base64");
    expect(() => decodeProviderImage({ b64: html, mediaType: "image/png" })).toThrow(/declared format/);
    // A real PNG relabelled as JPEG must not slip through either.
    expect(() => decodeProviderImage({ b64: PNG_BASE64, mediaType: "image/jpeg" })).toThrow(/declared format/);
  });

  it("maps each accepted media type to its own extension", () => {
    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>").toString("base64");
    expect(decodeProviderImage({ b64: svg, mediaType: "image/svg+xml" }).extension).toBe("svg");
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP"), Buffer.from([1])]).toString("base64");
    expect(decodeProviderImage({ b64: webp, mediaType: "image/webp" }).extension).toBe("webp");
    expect(decodeProviderImage({ b64: PNG_BASE64, mediaType: null }).extension).toBe("png");
  });
});

describe("video lifecycle", () => {
  const videoJob = {
    ...baseJob,
    kind: "video",
    request: { prompt: "Waves", duration: 5, resolution: "720p" },
  };

  it("persists the job ID at acceptance and returns without blocking", async () => {
    arrangeJob(videoJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...videoJob, status: "running", submissionState: "attempted" });
    mocks.revalidateGenerationModel.mockResolvedValue({
      submissionOptions: { duration: 5, resolution: "720p", generateAudio: false },
      providerModelId: "vendor/video-model",
      routing: null,
    });
    mocks.createOpenRouterVideoJob.mockResolvedValue({
      id: "job_abc123",
      polling_url: "https://openrouter.ai/api/v1/videos/job_abc123",
      status: "pending",
    });

    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "awaiting_provider" });
    // The job ID is the only durable handle on a render; it must be stored immediately.
    expect(mocks.recordProviderReference).toHaveBeenCalledWith(expect.objectContaining({
      providerJobId: "job_abc123",
      awaitingProvider: true,
    }));
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });

  it("does not settle while the provider still reports in-flight", async () => {
    arrangeJob({ ...videoJob, status: "awaiting_provider", submissionState: "completed", providerJobId: "job_abc123" });
    mocks.getOpenRouterVideoJob.mockResolvedValue({ id: "job_abc123", status: "in_progress" });

    await expect(pollVideoGeneration(jobId, userId)).resolves.toMatchObject({ status: "awaiting_provider" });
    expect(mocks.createOpenRouterVideoJob).not.toHaveBeenCalled();
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });

  it("settles a completed render and stores the downloaded bytes", async () => {
    arrangeJob({ ...videoJob, status: "awaiting_provider", submissionState: "completed", providerJobId: "job_abc123" });
    mocks.getOpenRouterVideoJob.mockResolvedValue({
      id: "job_abc123",
      status: "completed",
      generation_id: "gen-abc123XYZ",
      unsigned_urls: ["https://provider.example/tmp.mp4"],
      usage: { cost: 0.5 },
    });
    mocks.downloadOpenRouterVideoContent.mockResolvedValue({ bytes: new Uint8Array([1, 2, 3]), mimeType: "video/mp4" });

    await pollVideoGeneration(jobId, userId);
    expect(mocks.downloadOpenRouterVideoContent).toHaveBeenCalledWith("job_abc123");
    expect(mocks.storeGeneratedAsset).toHaveBeenCalledWith(expect.objectContaining({ kind: "video", mimeType: "video/mp4", extension: "mp4" }));
    expect(mocks.settleGeneration).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ assetIds: ["asset-1"] }) }));
  });

  it("treats a terminal failure as a definite outcome and does not charge", async () => {
    arrangeJob({ ...videoJob, status: "awaiting_provider", submissionState: "completed", providerJobId: "job_abc123" });
    mocks.getOpenRouterVideoJob.mockResolvedValue({ id: "job_abc123", status: "failed", error: "provider exploded" });

    await pollVideoGeneration(jobId, userId);
    expect(mocks.settleGeneration).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
    expect(mocks.downloadOpenRouterVideoContent).not.toHaveBeenCalled();
  });

  it("returns to awaiting_provider on a poll error instead of failing the render", async () => {
    arrangeJob({ ...videoJob, status: "awaiting_provider", submissionState: "completed", providerJobId: "job_abc123" });
    mocks.getOpenRouterVideoJob.mockRejectedValue(new Error("network"));

    await expect(pollVideoGeneration(jobId, userId)).resolves.toMatchObject({ status: "awaiting_provider" });
    // A failed read must never submit a second render for the same customer click.
    expect(mocks.createOpenRouterVideoJob).not.toHaveBeenCalled();
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });

  it("does not resubmit when a job has no provider job reference", async () => {
    arrangeJob({ ...videoJob, status: "awaiting_provider", submissionState: "completed", providerJobId: null });
    await expect(pollVideoGeneration(jobId, userId)).resolves.toMatchObject({ status: "awaiting_provider" });
    expect(mocks.createOpenRouterVideoJob).not.toHaveBeenCalled();
  });
});
