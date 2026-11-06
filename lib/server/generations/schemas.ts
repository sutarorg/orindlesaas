import { z } from "zod";

const key = z.string().min(8).max(128).regex(/^[A-Za-z0-9:_-]+$/);
const modelId = z.string().min(3).max(200).regex(/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/i);
const prompt = z.string().trim().min(1).max(16_000);

export const mediaGenerationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    modelId,
    prompt,
    idempotencyKey: key,
    size: z.string().regex(/^\d{3,4}x\d{3,4}$/).optional(),
    aspectRatio: z.string().regex(/^\d{1,2}:\d{1,2}$/).optional(),
    seed: z.number().int().nonnegative().max(2_147_483_647).optional(),
  }),
  z.object({
    kind: z.literal("video"),
    modelId,
    prompt,
    idempotencyKey: key,
    duration: z.number().int().min(1).max(30),
    aspectRatio: z.string().regex(/^\d{1,2}:\d{1,2}$/).optional(),
    resolution: z.string().regex(/^\d{3,4}x\d{3,4}$/),
    generateAudio: z.boolean().optional(),
  }),
  z.object({
    kind: z.literal("website"),
    modelId,
    prompt: prompt.max(8_000),
    idempotencyKey: key,
    name: z.string().trim().min(2).max(80),
  }),
]);

export const chatGenerationSchema = z.object({
  modelId,
  conversationId: z.uuid().optional(),
  idempotencyKey: key,
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(16_000),
  })).min(1).max(30),
  maxOutputTokens: z.number().int().min(64).max(2_000).default(1200),
}).refine((value) => value.messages.reduce((sum, message) => sum + message.content.length, 0) <= 48_000, {
  message: "The conversation is too large for one request.",
});

export const generationListSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
