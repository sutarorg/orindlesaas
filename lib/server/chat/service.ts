import { streamText, type ModelMessage } from "ai";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { conversations, messages, generationJobs } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { resolveGenerationModel } from "@/lib/server/ai/models";
import { holdCredits, lockCreditWallet } from "@/lib/server/credits/ledger";
import { openRouterLanguageModel } from "@/lib/server/ai/openrouter";
import { providerRoutingBody } from "@/lib/server/ai/routing";
import { isOpenRouterGenerationId } from "@/lib/server/ai/usage";
import { classifyOpenRouterError } from "@/lib/server/ai/errors";
import { generationRequestHash, markSubmissionAttempt, markSubmissionUncertain, recordProviderReference, settleGeneration } from "@/lib/server/generations/service";

export const chatRequestSchema = z.object({
  modelId: z.string().min(1).max(200),
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(8000),
  idempotencyKey: z.string().trim().min(12).max(100).regex(/^[a-zA-Z0-9:_-]+$/),
}).strict();


/**
 * Extracts the OpenRouter generation ID from an AI SDK step's response metadata.
 *
 * Verified against `@openrouter/ai-sdk-provider@3.1.0`: `doGenerate`/`doStream` return
 * `response: { id, modelId, headers, body }`, where `id` is the OpenRouter generation ID. The value
 * is validated against the documented `gen-` form so a malformed or missing ID cannot be mistaken
 * for a real reference — an unclassifiable reference would make settlement look up the wrong thing.
 */
function openRouterGenerationIdFrom(response: { id?: string } | undefined): string | null {
  const id = response?.id;
  return typeof id === "string" && isOpenRouterGenerationId(id) ? id : null;
}

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

  // Routing is built from the server-side plan, never from the request body. `max_price` bounds the
  // provider's spend to the figure the reservation was quoted from.
  const routing = model.routing ? providerRoutingBody(model.routing) : undefined;
  const result = streamText({
    model: openRouterLanguageModel(model.providerModelId, routing ? { provider: routing } : undefined),
    system: "You are Orindle's helpful AI workspace assistant. Be clear about uncertainty. Never claim to have performed external actions or persist memory beyond this conversation.",
    messages: modelHistory,
    maxOutputTokens,
    // A paid generation is never automatically repeated: an uncertain outcome must be reconciled,
    // not resubmitted, or the customer could be charged twice for one click.
    maxRetries: 0,
    streamRetries: 0,
    // Attribution only. The OpenRouter provider reads `user` for abuse detection; it is not a
    // routing or pricing control.
    providerOptions: { openrouter: { user: userId } },
    onStepEnd: async (step) => {
      const generationId = openRouterGenerationIdFrom(step.response);
      if (generationId) await recordProviderReference({ jobId, userId, generationId });
    },
    onEnd: async (event) => {
      try {
        // The OpenRouter generation ID is the provider's response `id`, surfaced by the AI SDK as
        // `response.id`. It is NOT `providerMetadata.gateway.generationId` (a Gateway-only field),
        // and reading the wrong location would send every chat job to reconciliation.
        const generationId = openRouterGenerationIdFrom(event.finalStep.response);
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
    /**
     * OpenRouter can return HTTP 200 and then fail inside the stream, so this callback is the only
     * place a mid-stream failure is visible. The job is *not* settled here even when text arrived:
     * credits follow the provider's billed cost, not the first token, and an errored stream may have
     * been partially billed. The classification is recorded so an operator can tell a content
     * rejection apart from an outage without reading provider logs.
     */
    onError: async (error) => {
      const normalized = classifyOpenRouterError(error);
      await markSubmissionUncertain(jobId, userId, `stream_${normalized.kind}`);
    },
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
