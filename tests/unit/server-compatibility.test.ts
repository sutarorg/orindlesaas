import { describe, expect, it } from "vitest";
import { assessProductCompatibility, publicProductOptions, validateProductOptions, type CompatibilityModel } from "@/lib/server/ai/compatibility";

function model(partial: Partial<CompatibilityModel> = {}): CompatibilityModel {
  return {
    kind: "chat",
    catalogType: "language",
    gatewayMetadata: {
      supported_specifications: ["v4"],
      modalities: { input: ["text"], output: ["text"] },
      max_tokens: 8_192,
    },
    productCompatibility: {},
    ...partial,
  };
}

const videoPolicy = { parameters: { durations: [4, 8], resolutions: ["1280x720"], aspectRatios: ["16:9"], resolutionPricing: { "1280x720": "720p" } } };
const videoModel = () => model({
  kind: "video",
  catalogType: "video",
  gatewayMetadata: { supported_specifications: ["v4"], modalities: { input: ["text"], output: ["video"] } },
  productCompatibility: { video: videoPolicy },
});

describe("product compatibility policy", () => {
  it("requires SDK evidence before any route is offered", () => {
    // Historical Gateway rows keep the original rule: without a `v4` specification entry there is
    // no evidence the model can be driven through the AI SDK.
    const assessment = assessProductCompatibility(model({ gatewayMetadata: { modalities: { input: ["text"], output: ["text"] } } }), "chat");
    expect(assessment.supported).toBe(false);
    expect(assessment.reason).toMatch(/SDK support is not evidenced/);
  });

  it("accepts OpenRouter modality evidence in place of the Gateway v4 field", () => {
    // `supported_specifications` does not exist in OpenRouter's catalogue. Continuing to require it
    // would reject every OpenRouter model while looking like a compatibility rule.
    const supported = assessProductCompatibility(model({
      gatewayMetadata: { openrouterId: "acme/text", modalities: { input: ["text"], output: ["text"] } },
    }), "chat");
    expect(supported.supported).toBe(true);

    // Modalities are still required: identity alone is not evidence of capability.
    const noModalities = assessProductCompatibility(model({ gatewayMetadata: { openrouterId: "acme/text" } }), "chat");
    expect(noModalities.supported).toBe(false);
  });

  it("keeps unreviewed media and cross-type routes closed", () => {
    expect(assessProductCompatibility(model({ kind: "image", catalogType: "image" }), "video").supported).toBe(false);
    const image = assessProductCompatibility(model({
      kind: "image",
      catalogType: "image",
      gatewayMetadata: { supported_specifications: ["v4"], modalities: { input: ["text"], output: ["image"] } },
    }), "image");
    expect(image.supported).toBe(true);
    expect(image.reviewed).toBe(false);
    expect(image.parameters.sizes).toEqual([]);
  });

  it("honours an explicit administrator disable and invalid policy", () => {
    const disabled = assessProductCompatibility(model({ productCompatibility: { chat: { disabled: true, parameters: {} } } }), "chat");
    expect(disabled).toMatchObject({ supported: false, reviewed: true });
    const invalid = assessProductCompatibility(model({ productCompatibility: { chat: { parameters: { sizes: ["huge"] } } } }), "chat");
    expect(invalid).toMatchObject({ supported: false, reviewed: false });
  });

  it("fails video closed without reviewed durations and resolutions", () => {
    expect(assessProductCompatibility(videoModel(), "video").supported).toBe(true);
    expect(assessProductCompatibility(videoModel(), "image").supported).toBe(false);
    const missingLabel = model({
      kind: "video",
      catalogType: "video",
      gatewayMetadata: { supported_specifications: ["v4"], modalities: { input: ["text"], output: ["video"] } },
      productCompatibility: { video: { parameters: { durations: [4], resolutions: ["1280x720"], resolutionPricing: {} } } },
    });
    // A historical Gateway row still needs its label mapping, because its quote is resolved through it.
    expect(assessProductCompatibility(missingLabel, "video").reason).toMatch(/exact pricing label/);
    // An OpenRouter row does not: its endpoints publish a per-second rate, so demanding a Gateway SKU
    // label would make every real OpenRouter video model impossible to enable.
    const openRouterVideo = model({
      kind: "video",
      catalogType: "video",
      gatewayMetadata: { openrouterId: "acme/motion", modalities: { input: ["text"], output: ["video"] } },
      productCompatibility: { video: { parameters: { durations: [5], resolutions: ["720p"], aspectRatios: ["16:9"], generateAudio: false } } },
    });
    expect(assessProductCompatibility(openRouterVideo, "video").supported).toBe(true);
    // Durations and resolutions are still mandatory for OpenRouter, and a quality label is accepted.
    const noDurationsOpenRouter = model({
      kind: "video",
      catalogType: "video",
      gatewayMetadata: { openrouterId: "acme/motion", modalities: { input: ["text"], output: ["video"] } },
      productCompatibility: { video: { parameters: { resolutions: ["720p"] } } },
    });
    expect(assessProductCompatibility(noDurationsOpenRouter, "video").supported).toBe(false);
    const noDurations = model({ kind: "video", catalogType: "video", productCompatibility: { video: { parameters: { resolutions: ["1280x720"] } } } });
    expect(assessProductCompatibility(noDurations, "video").supported).toBe(false);
  });

  it("rejects options outside the published allowlist", () => {
    const chat = assessProductCompatibility(model(), "chat");
    expect(validateProductOptions("chat", chat.parameters, { prompt: "hi" })).toBeNull();
    expect(validateProductOptions("chat", chat.parameters, { prompt: "hi", size: "1024x1024" })).toMatch(/not allowed/);
    expect(validateProductOptions("chat", chat.parameters, { prompt: "hi", maxOutputTokens: 9_999 })).toMatch(/output token/);

    const video = assessProductCompatibility(videoModel(), "video");
    expect(validateProductOptions("video", video.parameters, { prompt: "hi", duration: 4, resolution: "1280x720" })).toBeNull();
    expect(validateProductOptions("video", video.parameters, { prompt: "hi", duration: 6, resolution: "1280x720" })).toMatch(/duration/);
    expect(validateProductOptions("video", video.parameters, { prompt: "hi", resolution: "1280x720" })).toMatch(/duration/);
    expect(validateProductOptions("video", video.parameters, { prompt: "hi", duration: 4, resolution: "1920x1080" })).toMatch(/resolution/);
    expect(validateProductOptions("video", video.parameters, { prompt: "hi", duration: 4, resolution: "1280x720", generateAudio: true })).toMatch(/Audio/);
  });

  it("exposes only safe option DTOs to the customer UI", () => {
    const options = publicProductOptions(assessProductCompatibility(videoModel(), "video").parameters);
    expect(options).toMatchObject({ durations: [4, 8], resolutions: ["1280x720"], generateAudio: false });
    // The server-side pricing label mapping and review metadata stay on the server.
    expect(options).not.toHaveProperty("resolutionPricing");
    expect(options).not.toHaveProperty("reviewed");
  });
});
