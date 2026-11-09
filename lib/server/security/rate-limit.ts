/**
 * Fixed-window rate limiting backed by PostgreSQL, replacing the Upstash Redis integration.
 *
 * A counter row per (name, identifier, window-start) is incremented atomically, so concurrent
 * requests cannot both slip under the limit. Expired windows are pruned opportunistically, which
 * keeps the table small without needing Redis TTLs or a separate scheduler.
 */
import { and, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { rateLimits } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";

export type RateLimitWindow = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

const UNIT_MS: Record<string, number> = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function windowMs(window: RateLimitWindow) {
  const [amount, unit] = window.split(" ") as [string, keyof typeof UNIT_MS];
  return Number(amount) * (UNIT_MS[unit] ?? 60_000);
}

export async function enforceRateLimit(input: { name: string; identifier: string; limit: number; window?: RateLimitWindow }) {
  const window = input.window ?? "1 m";
  const span = windowMs(window);
  const now = Date.now();
  const windowStart = Math.floor(now / span) * span;
  const expiresAt = new Date(windowStart + span);
  const db = getDb();

  let count: number;
  try {
    const [row] = await db
      .insert(rateLimits)
      .values({ name: input.name, identifier: input.identifier, windowStart: new Date(windowStart), count: 1, expiresAt })
      .onConflictDoUpdate({
        target: [rateLimits.name, rateLimits.identifier, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count });
    count = row?.count ?? 1;
  } catch (error) {
    // Limiting is an abuse control, not a correctness gate. If the counter store is unreachable the
    // request is allowed rather than failing the whole product closed.
    console.error("[rate-limit] Could not record a hit; allowing the request.", error);
    return;
  }

  // Opportunistic pruning of windows that have already expired.
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.expiresAt, new Date())).catch(() => undefined);
  }

  if (count > input.limit) {
    throw new AppError("rate_limited", 429, "Too many requests. Wait before trying again.");
  }
}

export async function currentRateLimitCount(input: { name: string; identifier: string; window?: RateLimitWindow }) {
  const span = windowMs(input.window ?? "1 m");
  const windowStart = new Date(Math.floor(Date.now() / span) * span);
  const [row] = await getDb()
    .select({ count: rateLimits.count })
    .from(rateLimits)
    .where(and(eq(rateLimits.name, input.name), eq(rateLimits.identifier, input.identifier), eq(rateLimits.windowStart, windowStart)))
    .limit(1);
  return row?.count ?? 0;
}

export function requestIdentifier(request: Request, userId?: string) {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  return `ip:${forwarded || "unknown"}`;
}
