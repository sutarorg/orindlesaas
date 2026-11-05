import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { accountDeletionRequests } from "@/lib/server/db/schema";

export const runtime = "nodejs";
const schema = z.object({ confirmation: z.literal("DELETE"), reason: z.string().trim().max(1000).optional() }).strict();
export const POST = apiHandler(async (request) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  const input = await readJson(request, schema);
  const [existing] = await getDb().select().from(accountDeletionRequests).where(and(eq(accountDeletionRequests.userId, identity.userId), inArray(accountDeletionRequests.status, ["requested", "review"]))).orderBy(desc(accountDeletionRequests.createdAt)).limit(1);
  if (existing) return json({ id: existing.id, status: existing.status, duplicate: true });
  const [created] = await getDb().insert(accountDeletionRequests).values({ userId: identity.userId, reason: input.reason }).returning({ id: accountDeletionRequests.id, status: accountDeletionRequests.status });
  return json({ ...created, duplicate: false }, 201);
});
