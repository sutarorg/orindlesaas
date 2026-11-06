import { streamText, type ModelMessage } from "ai";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { conversations, messages, generationJobs } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { resolveGenerationModel } from "@/lib/server/ai/models";
import { holdCredits, lockCreditWallet } from "@/lib/server/credits/ledger";
import { getGateway, extractGatewayGenerationId } from "@/lib/server/ai/gateway";
import { generationRequestHash, markSubmissionAttempt, markSubmissionUncertain, recordProviderReference, settleGeneration } from "@/lib/server/generations/service";

export const chatRequestSchema = z.object({
  modelId: z.string().min(1).max(200),
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(8000),
  idempotencyKey: z.string().trim().min(12).max(100).regex(/^[a-zA-Z0-9:_-]+$/),
}).strict();

async function modelMessages(conversationId: string | undefined, message: string) {
  if (!conversationId) return [{ role: "user", content: message }] satisfies ModelMessage[];
  const rows = await getDb().select({ role: messages.role, content: messages.content }).from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt), asc(messages.id)).limit(40);
  return [...rows.map((row) => ({ role: row.role, content: row.content }) as ModelMessage), { role: "user", content: message }] satisfies ModelMessage[];
}

export async function createChatStream(userId: string, rawInput: unknown, correlationId: string) {
  const input = chatRequestSchema.parse(rawInput);
  if (input.conversationId) {
    const [owned] = await getDb().select({ id: conversations.id }).from(conversations).where(and(eq(conversations.id, input.conversationId), eq(conversations.userId, userId))).limit(1);
    if (!owned) throw new AppError("not_found", 404, "The conversation was not found.");
  }
  const modelHistory = await modelMessages(input.conversationId, input.message);
  const prompt = modelHistory.map((message) => String(message.content)).join("\n");
  const model = await resolveGenerationModel({ modelId: input.modelId, kind: "chat", prompt, options: { messages: modelHistory } });
  const maxOutputTokens = Math.min(2000, model.compatibilityParameters.maxOutputTokens ?? 2000);
  const estimatedCostUsd = model.estimatedCostUsd;
  const requestSha256 = generationRequestHash({ modelId: input.modelId, conversationId: input.conversationId ?? null, message: input.message });
  const jobId = crypto.randomUUID();
  const conversationId = input.conversationId ?? crypto.randomUUID();

  await getDb().transaction(async (tx) => {
    await lockCreditWallet(tx, userId);
    const [existing] = await tx.select({ id: generationJobs.id }).from(generationJobs).where(and(eq(generationJobs.userId, userId), eq(generationJobs.idempotencyKey, input.idempotencyKey))).limit(1);
    if (existing) throw new AppError("conflict", 409, "This chat request was already submitted. Reuse its conversation instead of charging again.");
    if (input.conversationId) {
      const [conversation] = await tx.select({ id: conversations.id }).from(conversations).where(and(eq(conversations.id, input.conversationId), eq(conversations.userId, userId))).for("update").limit(1);
      if (!conversation) throw new AppError("not_found", 404, "The conversation was not found.");
    }
    const [active] = await tx.select({ value: count() }).from(generationJobs).where(and(eq(generationJobs.userId, userId), inArray(generationJobs.status, ["queued", "running", "awaiting_provider"])));
    if ((active?.value ?? 0) >= 3) throw new AppError("rate_limited", 429, "You already have three active generations.");
    await tx.insert(generationJobs).values({ id: jobId, userId, idempotencyKey: input.idempotencyKey, requestSha256, kind: "chat", modelId: input.modelId, status: "queued", request: { message: input.message, conversationId } });
    const { reservation } = await holdCredits(tx, { userId, jobId, estimatedCostUsd, idempotencyKey: input.idempotencyKey, correlationId });
    await tx.update(generationJobs).set({ reservationId: reservation.id }).where(eq(generationJobs.id, jobId));
    if (!input.conversationId) {
      await tx.insert(conversations).values({ id: conversationId, userId, title: input.message.slice(0, 80), modelId: input.modelId });
    } else {
      await tx.update(conversations).set({ updatedAt: new Date(), modelId: input.modelId }).where(eq(conversations.id, conversationId));
    }
    await tx.insert(messages).values({ conversationId, role: "user", content: input.message, generationJobId: jobId });
  });

  const attempted = await markSubmissionAttempt(jobId, userId);
  if (!attempted) throw new AppError("conflict", 409, "This chat request was already submitted.");

  const result = streamText({
    model: getGateway().languageModel(model.gatewayModelId),
    system: "You are Orindle's helpful AI workspace assistant. Be clear about uncertainty. Never claim to have performed external actions or persist memory beyond this conversation.",
    messages: modelHistory,
    maxOutputTokens,
    maxRetries: 0,
    streamRetries: 0,
    providerOptions: { gateway: { user: userId, tags: [`generation:${jobId}`] } },
    onStepEnd: async (step) => {
      const generationId = extractGatewayGenerationId(step.providerMetadata);
      if (generationId) await recordProviderReference({ jobId, userId, generationId });
    },
    onEnd: async (event) => {
      try {
        const generationId = extractGatewayGenerationId(event.finalStep.providerMetadata);
        if (!generationId) {
          await markSubmissionUncertain(jobId, userId, "missing_generation_id");
          return;
        }
        await getDb().transaction(async (tx) => {
          await tx.insert(messages).values({ conversationId, role: "assistant", content: event.text, generationJobId: jobId });
          await tx.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));
        });
        await settleGeneration({ jobId, userId, result: { conversationId } });
      } catch {
        await markSubmissionUncertain(jobId, userId, "chat_postprocessing_uncertain");
      }
    },
    onError: async () => { await markSubmissionUncertain(jobId, userId, "stream_error"); },
    onAbort: async () => { await markSubmissionUncertain(jobId, userId, "stream_aborted"); },
  });

  return result.toTextStreamResponse({ headers: { "x-orindle-conversation-id": conversationId, "x-orindle-generation-id": jobId, "cache-control": "no-store" } });
}

export async function listConversations(userId: string) {
  return getDb().select({ id: conversations.id, title: conversations.title, updatedAt: conversations.updatedAt }).from(conversations).where(eq(conversations.userId, userId)).orderBy(asc(conversations.createdAt)).limit(50);
}

export async function getConversation(userId: string, conversationId: string) {
  const [conversation] = await getDb().select({ id: conversations.id, title: conversations.title, modelId: conversations.modelId }).from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId))).limit(1);
  if (!conversation) throw new AppError("not_found", 404, "The conversation was not found.");
  const history = await getDb().select({ id: messages.id, role: messages.role, content: messages.content, createdAt: messages.createdAt }).from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt), asc(messages.id));
  return { conversation, messages: history };
}
