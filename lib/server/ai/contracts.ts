import { z } from "zod";

/**
 * Wire contracts for the OpenRouter endpoints Orindle consumes.
 *
 * These schemas are intentionally `looseObject`: OpenRouter adds fields over time and an unknown
 * field must never fail a whole catalogue sync. What is strict is everything the money path reads —
 * an unparseable price is rejected rather than silently defaulted to zero.
 */

const modality = z.string().trim().min(1).max(40);
const slug = z.string().trim().min(1).max(320);

/** `GET /api/v1/models` — one model. Prices are decimal strings per token. */
export const openRouterModelSchema = z.looseObject({
  id: slug.regex(/^[^/\s]+\/[^\s/]+$/),
  canonical_slug: z.string().max(320).optional(),
  name: z.string().trim().min(1).max(300),
  description: z.string().max(20_000).nullish(),
  created: z.number().int().nonnegative().optional(),
  context_length: z.number().int().nonnegative().max(100_000_000).nullish(),
  architecture: z.looseObject({
    input_modalities: z.array(modality).max(40).optional(),
    output_modalities: z.array(modality).max(40).optional(),
    modality: z.string().max(200).optional(),
    tokenizer: z.string().max(120).nullish(),
  }).nullish(),
  pricing: z.record(z.string(), z.unknown()).nullish(),
  supported_parameters: z.union([z.array(z.string().max(120)).max(120), z.record(z.string(), z.unknown())]).nullish(),
  top_provider: z.looseObject({
    context_length: z.number().int().nonnegative().max(100_000_000).nullish(),
    max_completion_tokens: z.number().int().nonnegative().max(100_000_000).nullish(),
    is_moderated: z.boolean().nullish(),
  }).nullish(),
  endpoints: z.string().max(600).nullish(),
});

export const openRouterModelListSchema = z.looseObject({
  data: z.array(z.unknown()).max(20_000),
});

/** `GET /api/v1/models/{author}/{slug}/endpoints` — one serving endpoint with its own price. */
export const openRouterEndpointSchema = z.looseObject({
  name: z.string().max(240).optional(),
  provider_name: z.string().trim().min(1).max(240),
  provider_slug: z.string().max(120).nullish(),
  context_length: z.number().int().nonnegative().max(100_000_000).nullish(),
  max_completion_tokens: z.number().int().nonnegative().max(100_000_000).nullish(),
  pricing: z.record(z.string(), z.unknown()).nullish(),
  supported_parameters: z.union([z.array(z.string().max(120)).max(120), z.record(z.string(), z.unknown())]).nullish(),
  quantization: z.string().max(60).nullish(),
  status: z.number().int().nullish(),
});

export const openRouterEndpointListSchema = z.looseObject({
  data: z.looseObject({
    id: z.string().max(320).optional(),
    endpoints: z.array(z.unknown()).max(200).optional(),
  }).or(z.array(z.unknown()).max(200)).nullish(),
}).or(z.looseObject({ endpoints: z.array(z.unknown()).max(200) }));

/** Image capability descriptors: enum / range / boolean. An absent key means "unsupported". */
const capabilityDescriptor = z.looseObject({
  type: z.enum(["enum", "range", "boolean"]),
  values: z.array(z.union([z.string().max(80), z.number()])).max(200).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const imageCapabilitiesSchema = z.record(z.string().max(80), capabilityDescriptor);

/** `POST /api/v1/images` response. Output is base64, not a URL. */
export const openRouterImageResponseSchema = z.looseObject({
  created: z.number().int().nonnegative().optional(),
  data: z.array(z.looseObject({
    b64_json: z.string().min(1).max(200_000_000),
    media_type: z.string().max(120).nullish(),
  })).min(1).max(10),
  usage: z.looseObject({
    prompt_tokens: z.number().int().nonnegative().optional(),
    completion_tokens: z.number().int().nonnegative().optional(),
    total_tokens: z.number().int().nonnegative().optional(),
    cost: z.union([z.number(), z.string()]).nullish(),
  }).nullish(),
});

/** `GET /api/v1/images/models/{author}/{slug}/endpoints` pricing lines. */
export const imageEndpointPricingLine = z.looseObject({
  billable: z.string().max(80),
  unit: z.string().max(40),
  cost_usd: z.union([z.number(), z.string()]),
  variant: z.string().max(40).nullish(),
});

export const imageEndpointSchema = z.looseObject({
  provider_name: z.string().trim().min(1).max(240),
  provider_slug: z.string().max(120).nullish(),
  provider_tag: z.string().max(120).nullish(),
  supported_parameters: imageCapabilitiesSchema.nullish(),
  allowed_passthrough_parameters: z.array(z.string().max(80)).max(80).nullish(),
  supports_streaming: z.boolean().nullish(),
  pricing: z.array(imageEndpointPricingLine).max(80).nullish(),
});

/** `GET /api/v1/videos/models` */
export const openRouterVideoModelSchema = z.looseObject({
  id: slug.regex(/^[^/\s]+\/[^\s/]+$/),
  canonical_slug: z.string().max(320).optional(),
  name: z.string().trim().min(1).max(300),
  description: z.string().max(20_000).nullish(),
  created: z.number().int().nonnegative().optional(),
  supported_durations: z.array(z.number().int().min(1).max(120)).max(30).nullish(),
  supported_resolutions: z.array(z.string().max(40)).max(30).nullish(),
  supported_aspect_ratios: z.array(z.string().max(20)).max(30).nullish(),
  supported_sizes: z.array(z.string().max(40)).max(60).nullish(),
  pricing_skus: z.record(z.string().max(80), z.union([z.string().max(80), z.number()])).nullish(),
  allowed_passthrough_parameters: z.array(z.string().max(80)).max(80).nullish(),
});

/** `POST /api/v1/videos` acceptance, and `GET /api/v1/videos/{id}` polling. */
export const openRouterVideoJobSchema = z.looseObject({
  id: z.string().min(1).max(200),
  generation_id: z.string().max(200).nullish(),
  polling_url: z.string().max(600).nullish(),
  status: z.string().trim().min(1).max(40),
  error: z.union([z.string().max(600), z.looseObject({}).catchall(z.unknown())]).nullish(),
  unsigned_urls: z.array(z.string().max(2000)).max(10).nullish(),
  usage: z.looseObject({
    cost: z.union([z.number(), z.string()]).nullish(),
    is_byok: z.boolean().nullish(),
  }).nullish(),
});

/**
 * The documented terminal states. Anything not listed is treated as still in flight, which is the
 * safe assumption: guessing "finished" would settle credits for a render that may still change.
 */
export const VIDEO_TERMINAL_STATES = ["completed", "failed", "dead", "cancelled", "expired"] as const;
export type VideoTerminalState = (typeof VIDEO_TERMINAL_STATES)[number];

export function isVideoTerminal(status: string): status is VideoTerminalState {
  return (VIDEO_TERMINAL_STATES as readonly string[]).includes(status);
}
