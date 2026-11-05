import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { readServerEnvironment } from "@/lib/server/env";
import { AppError, integrationUnavailable } from "@/lib/server/errors";

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number, window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`) {
  const env = readServerEnvironment();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.NODE_ENV === "production") throw integrationUnavailable("Upstash rate limiting");
    return null;
  }
  const key = `${name}:${limit}:${window}`;
  const existing = limiters.get(key);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `orindle:${name}`,
    analytics: false,
  });
  limiters.set(key, limiter);
  return limiter;
}

export async function enforceRateLimit(input: { name: string; identifier: string; limit: number; window?: `${number} ${"ms" | "s" | "m" | "h" | "d"}` }) {
  const window = input.window ?? "1 m";
  const limiter = getLimiter(input.name, input.limit, window);
  if (!limiter) return;
  const result = await limiter.limit(input.identifier);
  if (!result.success) {
    throw new AppError("rate_limited", 429, "Too many requests. Wait before trying again.");
  }
}

export function requestIdentifier(request: Request, userId?: string) {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return `ip:${forwarded || "unknown"}`;
}
