import { z } from "zod";

export const catalogProducts = ["chat", "image", "video", "website"] as const;
export type CatalogProduct = (typeof catalogProducts)[number];

const size = z.string().regex(/^\d{2,5}x\d{2,5}$/).max(32);
const aspectRatio = z.string().regex(/^\d{1,3}:\d{1,3}$/).max(16);

export const compatibilityParametersSchema = z.object({
  maxOutputTokens: z.number().int().min(1).max(32_000).optional(),
  sizes: z.array(size).max(40).optional(),
  aspectRatios: z.array(aspectRatio).max(40).optional(),
  durations: z.array(z.number().int().min(1).max(30)).max(20).optional(),
  resolutions: z.array(size).max(20).optional(),
  resolutionPricing: z.record(z.string(), z.string().min(1).max(80)).optional(),
  generateAudio: z.boolean().optional(),
  seed: z.boolean().optional(),
}).strict();

export const productPolicySchema = z.object({
  disabled: z.boolean().default(false),
  parameters: compatibilityParametersSchema.default({}),
}).strict();

export type CompatibilityParameters = z.infer<typeof compatibilityParametersSchema>;
export type ProductPolicy = z.infer<typeof productPolicySchema>;

export type PublicProductOptions = {
  maxOutputTokens?: number;
  sizes?: string[];
  aspectRatios?: string[];
  durations?: number[];
  resolutions?: string[];
  resolutionPricing?: Record<string, string>;
  generateAudio?: boolean;
  seed?: boolean;
};
