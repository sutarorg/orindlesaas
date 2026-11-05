import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "insufficient_credits"
  | "payload_too_large"
  | "rate_limited"
  | "step_up_required"
  | "integration_unavailable"
  | "reconciliation_required"
  | "internal_error";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly publicMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    status: number,
    publicMessage: string,
    options?: { cause?: unknown; details?: Record<string, unknown> },
  ) {
    super(publicMessage, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
    this.details = options?.details;
  }
}

export function integrationUnavailable(integration: string) {
  return new AppError(
    "integration_unavailable",
    503,
    `${integration} is not configured. No operation was submitted.`,
    { details: { integration } },
  );
}

export function errorResponse(error: unknown, requestId = crypto.randomUUID()) {
  const safeError =
    error instanceof AppError
      ? error
      : error instanceof ZodError
        ? new AppError("bad_request", 400, "Check the request fields and try again.")
        : new AppError("internal_error", 500, "The request could not be completed.");

  return NextResponse.json(
    {
      error: {
        code: safeError.code,
        message: safeError.publicMessage,
        ...(safeError.details ? { details: safeError.details } : {}),
      },
      requestId,
    },
    {
      status: safeError.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}
