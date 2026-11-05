import { NextResponse } from "next/server";
import type { z } from "zod";
import { AppError, errorResponse } from "@/lib/server/errors";

const MAX_JSON_BYTES = 64 * 1024;

export function requestId(request: Request) {
  return request.headers.get("X-Request-Id")?.slice(0, 100) || crypto.randomUUID();
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) {
    if (request.headers.get("Sec-Fetch-Site") === "cross-site") {
      throw new AppError("forbidden", 403, "Cross-site requests are not accepted.");
    }
    return;
  }
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new AppError("forbidden", 403, "The request origin is invalid.");
  }
  const expectedHost = request.headers.get("X-Forwarded-Host") ?? request.headers.get("Host");
  if (!expectedHost || originUrl.host !== expectedHost || !["https:", "http:"].includes(originUrl.protocol)) {
    throw new AppError("forbidden", 403, "The request origin does not match this application.");
  }
  if (process.env.NODE_ENV === "production" && originUrl.protocol !== "https:") {
    throw new AppError("forbidden", 403, "Secure requests are required.");
  }
}

export async function readJson<S extends z.ZodType>(
  request: Request,
  schema: S,
  maxBytes = MAX_JSON_BYTES,
): Promise<z.output<S>> {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0];
  if (contentType !== "application/json") {
    throw new AppError("bad_request", 415, "Send a JSON request body.");
  }
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > maxBytes) throw new AppError("payload_too_large", 413, "The request is too large.");
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new AppError("payload_too_large", 413, "The request is too large.");
  }
  try {
    return schema.parse(JSON.parse(body));
  } catch (error) {
    if (error instanceof SyntaxError) throw new AppError("bad_request", 400, "The JSON body is invalid.");
    throw error;
  }
}

export function apiHandler(
  handler: (request: Request, context: { requestId: string }) => Promise<Response>,
) {
  return async (request: Request) => {
    const id = requestId(request);
    try {
      const response = await handler(request, { requestId: id });
      response.headers.set("X-Request-Id", id);
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      return errorResponse(error, id);
    }
  };
}

export function json(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}
