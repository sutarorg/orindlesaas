import { AppError, type ErrorCode } from "@/lib/server/errors";

/**
 * Normalises OpenRouter failures into Orindle's own error vocabulary.
 *
 * Two rules drive this file. First, a customer must never see a raw upstream body, a provider slug
 * or anything resembling a credential. Second, the *classification* must be honest, because the
 * retry and reconciliation logic branches on it: a 402 is not retryable, a 502/503/429 may be.
 *
 * OpenRouter can also return HTTP 200 and emit the failure inside the stream, so
 * `classifyOpenRouterError` accepts streamed objects as well as HTTP responses.
 */
export type OpenRouterFailureKind =
  | "bad_request"
  | "unauthorized"
  | "insufficient_credit"
  | "forbidden"
  | "timeout"
  | "rate_limited"
  | "provider_unavailable"
  | "model_unavailable"
  | "content_rejected"
  | "overloaded"
  | "malformed_response"
  | "unknown";

export type NormalizedProviderError = {
  kind: OpenRouterFailureKind;
  /**
   * Whether a READ-ONLY request (catalogue, generation lookup, job status) may be retried.
   *
   * Deliberately not called `retryable`: a paid generation must never be repeated on this flag,
   * because a 500/502/524 can arrive after the upstream provider has already accepted and billed
   * the request. Retrying those would charge the customer twice for one click. Paid submissions use
   * `maxRetries: 0` and reconcile an uncertain outcome instead.
   */
  retryableReadOnly: boolean;
  /** Seconds to wait, taken from `Retry-After` when OpenRouter supplied one. */
  retryAfterSeconds?: number;
  /** Safe to show a customer. Never contains upstream internals. */
  publicMessage: string;
  code: ErrorCode;
  status: number;
  /** Retained for logs only; never returned to a browser. */
  providerStatus?: number;
  providerMessage?: string;
};

const KIND_BY_STATUS: Record<number, OpenRouterFailureKind> = {
  400: "bad_request",
  401: "unauthorized",
  402: "insufficient_credit",
  403: "forbidden",
  404: "model_unavailable",
  408: "timeout",
  429: "rate_limited",
  500: "provider_unavailable",
  502: "provider_unavailable",
  503: "provider_unavailable",
  524: "timeout",
  529: "overloaded",
};

/**
 * Failure kinds a read-only request may safely repeat. Even this list is only consulted by callers
 * that read state; no code path retries a generation submission on it.
 */
const RETRYABLE_READ_ONLY: ReadonlySet<OpenRouterFailureKind> = new Set<OpenRouterFailureKind>([
  "rate_limited",
  "provider_unavailable",
  "overloaded",
  "timeout",
]);

const PUBLIC_MESSAGE: Record<OpenRouterFailureKind, string> = {
  bad_request: "The AI request was rejected as invalid. No credits were charged.",
  unauthorized: "The AI provider rejected Orindle's credentials. No credits were charged.",
  insufficient_credit: "Orindle's AI account has insufficient funds. No operation was submitted.",
  forbidden: "The AI provider declined this request. No credits were charged.",
  timeout: "The AI provider did not respond in time.",
  rate_limited: "The AI provider is rate limiting Orindle. Please retry shortly.",
  provider_unavailable: "The AI provider is temporarily unavailable.",
  model_unavailable: "That model is not currently available from any provider.",
  content_rejected: "The request was rejected by the provider's content policy.",
  overloaded: "The AI provider is overloaded. Please retry shortly.",
  malformed_response: "The AI provider returned a response Orindle could not verify.",
  unknown: "The AI provider failed to complete the request.",
};

const ERROR_CODE: Record<OpenRouterFailureKind, ErrorCode> = {
  bad_request: "bad_request",
  unauthorized: "integration_unavailable",
  insufficient_credit: "integration_unavailable",
  forbidden: "forbidden",
  timeout: "integration_unavailable",
  rate_limited: "rate_limited",
  provider_unavailable: "integration_unavailable",
  model_unavailable: "conflict",
  content_rejected: "bad_request",
  overloaded: "integration_unavailable",
  malformed_response: "integration_unavailable",
  unknown: "integration_unavailable",
};

const HTTP_STATUS: Record<OpenRouterFailureKind, number> = {
  bad_request: 422,
  unauthorized: 503,
  insufficient_credit: 503,
  forbidden: 403,
  timeout: 504,
  rate_limited: 429,
  provider_unavailable: 503,
  model_unavailable: 409,
  content_rejected: 422,
  overloaded: 503,
  malformed_response: 502,
  unknown: 502,
};

function retryAfterFromHeaders(headers: Headers | Record<string, string> | undefined) {
  if (!headers) return undefined;
  const raw = headers instanceof Headers ? headers.get("retry-after") : headers["retry-after"] ?? headers["Retry-After"];
  if (!raw) return undefined;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 && seconds <= 900 ? Math.ceil(seconds) : undefined;
}

/** Pulls `{ error: { code, message, metadata } }` out of an already-parsed body, if present. */
export function openRouterErrorFromBody(body: unknown): { code?: number; message?: string; limitSource?: string } | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const error = record.error;
  if (!error || typeof error !== "object") return null;
  const fields = error as Record<string, unknown>;
  const metadata = fields.metadata && typeof fields.metadata === "object" ? fields.metadata as Record<string, unknown> : {};
  return {
    code: typeof fields.code === "number" ? fields.code : undefined,
    message: typeof fields.message === "string" ? fields.message.slice(0, 500) : undefined,
    limitSource: typeof metadata.limit_source === "string" ? metadata.limit_source : undefined,
  };
}

export function normalizeProviderError(input: {
  status?: number;
  body?: unknown;
  headers?: Headers | Record<string, string>;
  cause?: unknown;
}): NormalizedProviderError {
  const parsed = openRouterErrorFromBody(input.body);
  const status = parsed?.code ?? input.status;
  let kind: OpenRouterFailureKind = status ? KIND_BY_STATUS[status] ?? "unknown" : "unknown";
  const message = parsed?.message ?? (input.cause instanceof Error ? input.cause.message : undefined);

  // 402 is special: it is the one provider error that means the operator, not the customer, must act.
  // `limit_source = openrouter_in_flight_budget` is explicitly documented as a wait-and-retry case.
  if (kind === "insufficient_credit" && parsed?.limitSource === "openrouter_in_flight_budget") kind = "rate_limited";
  // 403 carries both permission failures and content/moderation blocks; the body disambiguates.
  if (kind === "forbidden" && message && /moderat|content|guardrail|policy|flagged|blocked/i.test(message)) kind = "content_rejected";
  // A timeout-shaped network error arrives without a status at all.
  if (!status && message && /timeout|aborted|timed out/i.test(message)) kind = "timeout";

  return {
    kind,
    retryableReadOnly: RETRYABLE_READ_ONLY.has(kind),
    retryAfterSeconds: retryAfterFromHeaders(input.headers),
    publicMessage: PUBLIC_MESSAGE[kind],
    code: ERROR_CODE[kind],
    status: HTTP_STATUS[kind],
    providerStatus: status,
    providerMessage: message,
  };
}

/** Converts to the error type the route layer already knows how to render safely. */
export function toAppError(error: NormalizedProviderError): AppError {
  return new AppError(error.code, error.status, error.publicMessage, {
    details: error.kind === "insufficient_credit" || error.kind === "unauthorized" ? { integration: "OpenRouter" } : undefined,
  });
}

/**
 * Classifies a thrown SDK error. The AI SDK throws `APICallError` (carrying `statusCode` and a
 * response body), `NoContentGeneratedError`, `TypeMismatchError` and abort errors; each maps to a
 * different recovery path, and a paid call must never be blindly repeated on an unknown outcome.
 */
export function classifyOpenRouterError(error: unknown): NormalizedProviderError {
  if (error instanceof AppError) {
    return {
      kind: "unknown",
      retryableReadOnly: false,
      publicMessage: error.publicMessage,
      code: error.code,
      status: error.status,
    };
  }
  const record = (error ?? {}) as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : "";
  if (name === "AbortError" || name === "TimeoutError" || (error instanceof Error && /abort/i.test(error.message))) {
    return normalizeProviderError({ status: 408, cause: error });
  }
  const statusCode = typeof record.statusCode === "number" ? record.statusCode : undefined;
  const responseBody = record.responseBody ?? record.cause ?? record.data;
  let body: unknown = responseBody;
  if (typeof responseBody === "string") {
    try { body = JSON.parse(responseBody); } catch { body = undefined; }
  }
  return normalizeProviderError({
    status: statusCode,
    body,
    headers: record.responseHeaders as Record<string, string> | undefined,
    cause: error,
  });
}
