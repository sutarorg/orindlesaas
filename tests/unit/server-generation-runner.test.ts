import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  generateImage: vi.fn(),
  generateText: vi.fn(),
  startVideo: vi.fn(),
  getVideoStatus: vi.fn(),
  imageModel: vi.fn(),
  languageModel: vi.fn(),
  videoModel: vi.fn(),
  markSubmissionAttempt: vi.fn(),
  markSubmissionUncertain: vi.fn(),
  recordProviderReference: vi.fn(),
  settleGeneration: vi.fn(),
  storeGeneratedAsset: vi.fn(),
}));

vi.mock("ai", () => ({
  generateImage: mocks.generateImage,
  generateText: mocks.generateText,
  experimental_startVideo: mocks.startVideo,
  experimental_getVideoStatus: mocks.getVideoStatus,
}));
vi.mock("@/lib/server/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/server/ai/gateway", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/server/ai/gateway")>(),
  getGateway: () => ({ imageModel: mocks.imageModel, languageModel: mocks.languageModel, videoModel: mocks.videoModel }),
}));
vi.mock("@/lib/server/generations/service", () => ({
  markSubmissionAttempt: mocks.markSubmissionAttempt,
  markSubmissionUncertain: mocks.markSubmissionUncertain,
  recordProviderReference: mocks.recordProviderReference,
  settleGeneration: mocks.settleGeneration,
}));
vi.mock("@/lib/server/storage/r2", () => ({ storeGeneratedAsset: mocks.storeGeneratedAsset }));
vi.mock("@/lib/server/storage/provider-download", () => ({ downloadProviderFile: vi.fn() }));

import { runGenerationJob } from "@/lib/server/generations/runners";

const jobId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";
const baseJob = {
  id: jobId,
  userId,
  kind: "image",
  modelId: "image-internal",
  status: "queued",
  submissionState: "not_submitted",
  request: { prompt: "A quiet abstract landscape", size: "1024x1024" },
  providerOperation: null,
  gatewayGenerationId: null,
};

function arrangeJob(job: Record<string, unknown>) {
  const limit = vi.fn().mockResolvedValue([{ generation_jobs: job, models: { gatewayModelId: "provider/image-model" } }]);
  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  mocks.getDb.mockReturnValue({ select: vi.fn().mockReturnValue({ from }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.imageModel.mockReturnValue({ provider: "fake-image-model" });
  mocks.markSubmissionUncertain.mockResolvedValue(undefined);
  mocks.recordProviderReference.mockResolvedValue({});
  mocks.storeGeneratedAsset.mockResolvedValue({ id: "asset-1" });
  mocks.settleGeneration.mockResolvedValue({ status: "succeeded", actualCredits: 2 });
});

describe("generation runner with an injected provider fake", () => {
  it("uses the joined Gateway model, records provider evidence and settles stored output", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...baseJob, status: "running", submissionState: "attempted" });
    mocks.generateImage.mockResolvedValue({
      calls: [{ providerMetadata: { gateway: { generationId: "gen_fake_success" } } }],
      images: [{ mediaType: "image/png", uint8Array: new Uint8Array([1, 2, 3]) }],
    });

    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "succeeded", actualCredits: 2 });
    expect(mocks.generateImage).toHaveBeenCalledTimes(1);
    expect(mocks.generateImage.mock.calls[0]![0]).toMatchObject({ model: { provider: "fake-image-model" }, maxRetries: 0 });
    expect(mocks.recordProviderReference).toHaveBeenCalledWith({ jobId, userId, generationId: "gen_fake_success" });
    expect(mocks.settleGeneration).toHaveBeenCalledWith({ jobId, userId, result: { assetIds: ["asset-1"] } });
  });

  it("never resubmits an attempted chargeable operation after a worker retry", async () => {
    arrangeJob({ ...baseJob, status: "running", submissionState: "attempted" });
    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "reconciliation_required" });
    expect(mocks.markSubmissionUncertain).toHaveBeenCalledWith(jobId, userId);
    expect(mocks.generateImage).not.toHaveBeenCalled();
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });

  it("does not call the provider when the atomic submission claim is lost", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue(null);
    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "reconciliation_required" });
    expect(mocks.generateImage).not.toHaveBeenCalled();
  });

  it("blocks settlement when the provider omits metering correlation", async () => {
    arrangeJob(baseJob);
    mocks.markSubmissionAttempt.mockResolvedValue({ ...baseJob, status: "running", submissionState: "attempted" });
    mocks.generateImage.mockResolvedValue({ calls: [{ providerMetadata: {} }], images: [] });
    await expect(runGenerationJob(jobId, userId)).resolves.toEqual({ status: "reconciliation_required" });
    expect(mocks.markSubmissionUncertain).toHaveBeenCalledWith(jobId, userId, "missing_generation_id");
    expect(mocks.settleGeneration).not.toHaveBeenCalled();
  });
});
