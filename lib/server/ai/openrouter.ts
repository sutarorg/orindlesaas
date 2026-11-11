import { createOpenRouter, type OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { requireEnvironment } from "@/lib/server/env";

/**
 * The single server-side OpenRouter client for the whole application.
 *
 * Constructed lazily and memoised so importing this module never requires credentials: a request
 * that does not touch AI (a public page, a webhook) must not fail because the AI key is absent.
 * Callers that genuinely need the provider go through here and get a clear
 * `integration_unavailable` when it is not configured.
 */
let cached: OpenRouterProvider | undefined;

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function getOpenRouterProvider(): OpenRouterProvider {
  if (cached) return cached;
  const { OPENROUTER_API_KEY: apiKey } = requireEnvironment(["OPENROUTER_API_KEY"], "OpenRouter");
  cached = createOpenRouter({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    // `strict` is the documented mode for talking to the real OpenRouter API (as opposed to a
    // third-party compatible endpoint). It enables newer fields such as streamOptions.
    compatibility: "strict",
    appName: "Orindle",
    appUrl: "https://orindle.com",
  });
  return cached;
}

/** Test seam: drops the memoised client so a changed environment is picked up. */
export function resetOpenRouterProvider() {
  cached = undefined;
}

/**
 * A language model instance for a canonical OpenRouter model ID (`author/slug`).
 * Routing settings are always built server-side; a client cannot pass them here.
 */
export function openRouterLanguageModel(
  modelId: string,
  routing?: { provider?: Record<string, unknown> },
) {
  // The settings object is typed loosely by the provider package, and routing is assembled by
  // `planRouting` from database state rather than from caller input.
  return getOpenRouterProvider().chat(modelId, routing as Parameters<OpenRouterProvider["chat"]>[1]);
}
