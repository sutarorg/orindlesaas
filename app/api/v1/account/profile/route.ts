import { eq } from "drizzle-orm";
import { z } from "zod";
import { apiHandler, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth/guards";
import { getDb } from "@/lib/server/db/client";
import { profiles } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";

export const runtime = "nodejs";
const schema = z.object({ displayName: z.string().trim().min(2).max(80) }).strict();
export const PATCH = apiHandler(async (request) => {
  assertSameOrigin(request);
  const identity = await requireUser();
  const input = await readJson(request, schema);
  const [profile] = await getDb().update(profiles).set({ displayName: input.displayName, updatedAt: new Date() }).where(eq(profiles.id, identity.userId)).returning({ displayName: profiles.displayName });
  if (!profile) throw new AppError("not_found", 404, "The profile was not found.");
  return json(profile);
});
