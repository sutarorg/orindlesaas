import {
  imageEndpointSchema,
  openRouterEndpointSchema,
  openRouterImageResponseSchema,
  openRouterModelSchema,
  openRouterVideoJobSchema,
  openRouterVideoModelSchema,
} from "@/lib/server/ai/contracts";
import { classifyOpenRouterError, normalizeProviderError, toAppError } from "@/lib/server/ai/errors";
import { OPENROUTER_BASE_URL } from "@/lib/server/ai/openrouter";
import { parseGatewayJson } from "@/lib/server/ai/pricing";
import { readServerEnvironment, requireEnvironment } from "@/lib/server/env";
import { AppError } from "@/lib/server/errors";

/**
 * Native OpenRouter REST client.
 *
 * The AI SDK provider is used for chat/streaming, where it works well. It is *not* used for image,
 * video or catalogue, and that is a deliberate, evidence-based split rather than inconsistency:
 *
 * - image: the SDK's `OpenRouterImageModel` returns only base64 strings and token usage, discarding
 *   `media_type` (needed to store the file correctly) and `usage.cost` (the cost evidence).
 * - video: the SDK's `doGenerate` blocks internally for up to 10 minutes polling to completion.
 *   Orindle's request must return promptly and let the durable job runner poll.
 * - catalogue: no SDK surface exposes endpoint-level pricing, which the quote depends on.
 *
 * Every response is parsed against the schemas in `contracts.ts`; unknown fields are tolerated,
 * unparseable money is not.
 */

const MAX_BODY_BYTES = 20_000_000;

type FetchOptions = { fetchImpl?: typeof fetch; signal?: AbortSignal };

function apiKey() {
  return requireEnvironment(["OPENROUTER_API_KEY"], "OpenRouter").OPENROUTER_API_KEY;
}

/**
 * The key, if configured. Used for endpoints that are publicly readable: catalogue discovery works
 * without credentials, so an operator can inspect the catalogue before the key is installed, and a
 * missing key cannot make the read-only path fail.
 */
function optionalApiKey() {
  return readServerEnvironment().OPENROUTER_API_KEY;
}

async function requestJson(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; allowStatus?: number[]; publicRead?: boolean } & FetchOptions,
) {
  // Public reads (model lists) are documented as unauthenticated; everything else requires the key.
  const key = init.publicRead ? optionalApiKey() : apiKey();
  const url = path.startsWith("http") ? new URL(path) : new URL(`${OPENROUTER_BASE_URL}${path}`);
  const response = await (init.fetchImpl ?? fetch)(url, {
    method: init.method,
    headers: {
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      Accept: "application/json",
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      "X-Title": "Orindle",
      "HTTP-Referer": "https://orindle.com",
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    signal: init.signal ?? AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  const text = await response.text();
  if (text.length > MAX_BODY_BYTES) throw new AppError("integration_unavailable", 502, "OpenRouter response exceeded the safety bound.");
  if (!response.ok && !(init.allowStatus ?? []).includes(response.status)) {
    let body: unknown;
    try { body = parseGatewayJson(text); } catch { body = undefined; }
    const normalized = normalizeProviderError({ status: response.status, body, headers: response.headers });
    throw toAppError(normalized);
  }
  let payload: unknown;
  try {
    payload = parseGatewayJson(text);
  } catch {
    throw toAppError(normalizeProviderError({ status: 502, cause: new Error("invalid_json") }));
  }
  return { payload, status: response.status, headers: response.headers };
}

/** Follows `Retry-After` for a read-only request. Bounded, and never used for a paid submission. */
async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const normalized = classifyOpenRouterError(error);
      if (!normalized.retryableReadOnly || attempt === attempts - 1) break;
      const delay = normalized.retryAfterSeconds ?? Math.min(2 ** attempt, 8);
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    }
  }
  throw lastError;
}

/**
 * `GET /api/v1/models` with explicit paging.
 *
 * `output_modalities` MUST be set: the endpoint defaults to `text`, so image and video models are
 * invisible without it. That default is the single most likely way a migration silently empties two
 * of Orindle's four products.
 */
export async function listModels(input: {
  outputModalities?: string[];
  limit?: number;
  maxPages?: number;
} & FetchOptions) {
  const limit = Math.min(Math.max(input.limit ?? 500, 1), 1000);
  const maxPages = Math.min(Math.max(input.maxPages ?? 40, 1), 100);
  const seen = new Set<string>();
  const models: Array<ReturnType<typeof openRouterModelSchema.parse>> = [];
  let invalid = 0;
  let pages = 0;
  for (let offset = 0; pages < maxPages; offset += limit, pages += 1) {
    const query = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    if (input.outputModalities?.length) query.set("output_modalities", input.outputModalities.join(","));
    const { payload } = await withRetry(() => requestJson(`/models?${query.toString()}`, { method: "GET", publicRead: true, ...input }));
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) {
      throw new AppError("integration_unavailable", 502, "OpenRouter model list returned an unexpected shape.");
    }
    const page = (payload as { data: unknown[] }).data;
    for (const candidate of page) {
      const parsed = openRouterModelSchema.safeParse(candidate);
      if (!parsed.success) { invalid += 1; continue; }
      if (seen.has(parsed.data.id)) continue;
      seen.add(parsed.data.id);
      models.push(parsed.data);
    }
    // A short page is the documented end-of-list signal; a full page means continue.
    if (page.length < limit) break;
  }
  return { models, invalid, pages };
}

/** `GET /api/v1/models/{author}/{slug}/endpoints` — per-endpoint pricing and provider identity. */
export async function listModelEndpoints(modelId: string, options: FetchOptions = {}) {
  const [author, slug] = modelId.split("/");
  if (!author || !slug) throw new RangeError("A model ID must have the form author/slug.");
  const { payload } = await withRetry(() => requestJson(`/models/${encodeURIComponent(author)}/${encodeURIComponent(slug)}/endpoints`, { method: "GET", publicRead: true, ...options }));
  const container = payload as { data?: { endpoints?: unknown[] } | unknown[]; endpoints?: unknown[] } | null;
  const raw = Array.isArray(container)
    ? container
    : Array.isArray(container?.data)
      ? container!.data as unknown[]
      : Array.isArray(container?.data?.endpoints)
        ? (container!.data as { endpoints: unknown[] }).endpoints
        : Array.isArray(container?.endpoints) ? container!.endpoints : [];
  const endpoints = [];
  let invalid = 0;
  for (const candidate of raw) {
    const parsed = openRouterEndpointSchema.safeParse(candidate);
    if (!parsed.success) { invalid += 1; continue; }
    endpoints.push(parsed.data);
  }
  return { endpoints, invalid };
}

/** `GET /api/v1/images/models/{author}/{slug}/endpoints` — image capabilities and billable lines. */
export async function listImageEndpoints(modelId: string, options: FetchOptions = {}) {
  const [author, slug] = modelId.split("/");
  if (!author || !slug) throw new RangeError("A model ID must have the form author/slug.");
  const { payload } = await withRetry(() => requestJson(`/images/models/${encodeURIComponent(author)}/${encodeURIComponent(slug)}/endpoints`, { method: "GET", publicRead: true, ...options }));
  const container = payload as { data?: { endpoints?: unknown[] }; endpoints?: unknown[] } | null;
  const raw = Array.isArray(container?.data?.endpoints) ? container!.data!.endpoints! : Array.isArray(container?.endpoints) ? container.endpoints : [];
  const endpoints = [];
  for (const candidate of raw) {
    const parsed = imageEndpointSchema.safeParse(candidate);
    if (parsed.success) endpoints.push(parsed.data);
  }
  return { endpoints };
}

/** `GET /api/v1/videos/models` — durations, resolutions, aspect ratios and pricing SKUs. */
export async function listVideoModels(options: FetchOptions = {}) {
  const { payload } = await withRetry(() => requestJson("/videos/models", { method: "GET", ...options }));
  const raw = (payload as { data?: unknown[] } | null)?.data;
  if (!Array.isArray(raw)) throw new AppError("integration_unavailable", 502, "OpenRouter video model list returned an unexpected shape.");
  const models = [];
  let invalid = 0;
  for (const candidate of raw) {
    const parsed = openRouterVideoModelSchema.safeParse(candidate);
    if (!parsed.success) { invalid += 1; continue; }
    models.push(parsed.data);
  }
  return { models, invalid };
}

/**
 * `POST /api/v1/images`.
 *
 * Returns base64 plus the declared media type and the cost/usage block. The caller decides whether
 * that cost is authoritative; this function never converts it to the ledger figure.
 */
export async function generateOpenRouterImage(input: {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  aspectRatio?: string;
  seed?: number;
  provider?: Record<string, unknown>;
} & FetchOptions) {
  const body = {
    model: input.model,
    prompt: input.prompt,
    ...(input.n === undefined ? {} : { n: input.n }),
    ...(input.size === undefined ? {} : { size: input.size }),
    ...(input.aspectRatio === undefined ? {} : { aspect_ratio: input.aspectRatio }),
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    ...(input.provider === undefined ? {} : { provider: input.provider }),
  };
  const { payload } = await requestJson("/images", { method: "POST", body, fetchImpl: input.fetchImpl, signal: input.signal });
  const parsed = openRouterImageResponseSchema.safeParse(payload);
  if (!parsed.success) throw toAppError(normalizeProviderError({ status: 502, cause: new Error("malformed_image_response") }));
  return parsed.data;
}

/** `POST /api/v1/videos` — asynchronous acceptance; the job ID is the durable handle. */
export async function createOpenRouterVideoJob(input: {
  model: string;
  prompt: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  generateAudio?: boolean;
  provider?: Record<string, unknown>;
} & FetchOptions) {
  const body = {
    model: input.model,
    prompt: input.prompt,
    ...(input.duration === undefined ? {} : { duration: input.duration }),
    ...(input.resolution === undefined ? {} : { resolution: input.resolution }),
    ...(input.aspectRatio === undefined ? {} : { aspect_ratio: input.aspectRatio }),
    ...(input.generateAudio === undefined ? {} : { generate_audio: input.generateAudio }),
    ...(input.provider === undefined ? {} : { provider: input.provider }),
  };
  const { payload } = await requestJson("/videos", { method: "POST", body, allowStatus: [202], fetchImpl: input.fetchImpl, signal: input.signal });
  const parsed = openRouterVideoJobSchema.safeParse(payload);
  if (!parsed.success) throw toAppError(normalizeProviderError({ status: 502, cause: new Error("malformed_video_acceptance") }));
  return parsed.data;
}

/** `GET /api/v1/videos/{id}` — one poll. Never resubmits; a failure here must not create a job. */
export async function getOpenRouterVideoJob(jobId: string, options: FetchOptions = {}) {
  const { payload } = await requestJson(`/videos/${encodeURIComponent(jobId)}`, { method: "GET", ...options });
  const parsed = openRouterVideoJobSchema.safeParse(payload);
  if (!parsed.success) throw toAppError(normalizeProviderError({ status: 502, cause: new Error("malformed_video_status") }));
  return parsed.data;
}

/**
 * `GET /api/v1/videos/{id}/content` — the media bytes.
 *
 * The response is proxied through Orindle rather than handing the browser a provider URL. Provider
 * URLs are unauthenticated, temporary and outside the allowlist that protects against SSRF, so they
 * are never treated as permanent customer asset locations.
 */
export async function downloadOpenRouterVideoContent(jobId: string, options: FetchOptions & { maxBytes?: number } = {}) {
  const maxBytes = options.maxBytes ?? 200 * 1024 * 1024;
  const url = new URL(`${OPENROUTER_BASE_URL}/videos/${encodeURIComponent(jobId)}/content`);
  const response = await (options.fetchImpl ?? fetch)(url, {
    headers: { Authorization: `Bearer ${apiKey()}`, Accept: "video/*,application/octet-stream" },
    redirect: "error",
    signal: options.signal ?? AbortSignal.timeout(180_000),
    cache: "no-store",
  });
  if (!response.ok) throw toAppError(normalizeProviderError({ status: response.status }));
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new AppError("payload_too_large", 413, "The generated video is too large.");
  if (!response.body) throw new AppError("integration_unavailable", 502, "The provider returned an empty video body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new AppError("payload_too_large", 413, "The generated video is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return {
    bytes,
    mimeType: response.headers.get("content-type")?.split(";", 1)[0] ?? "video/mp4",
  };
}
