import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { AdminPermission } from "@/lib/contracts/admin";
import { AppError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/server/auth/supabase";
import { getDb } from "@/lib/server/db/client";
import { adminRoles, profiles } from "@/lib/server/db/schema";

export const ADMIN_PERMISSIONS = [
  "admin:read",
  "users:read",
  "users:manage",
  "catalog:read",
  "catalog:manage",
  "pricing:read",
  "pricing:manage",
  "payments:read",
  "payments:reconcile",
  "credits:read",
  "credits:adjust",
  "disputes:read",
  "disputes:manage",
  "usage:read",
  "jobs:read",
  "jobs:retry",
  "websites:read",
  "settings:read",
  "settings:manage",
  "audit:read",
] as const satisfies readonly AdminPermission[];

const permissionSet = new Set<string>(ADMIN_PERMISSIONS);
const uuidSchema = z.uuid();
const authenticationMethodsSchema = z.array(z.object({ method: z.string(), timestamp: z.number().int().nonnegative() }));
export const ADMIN_STEP_UP_SECONDS = 10 * 60;

function hasRecentTotpStepUp(identity: VerifiedIdentity, nowSeconds: number) {
  if (identity.assuranceLevel !== "aal2") return false;
  const methods = authenticationMethodsSchema.safeParse(identity.claims.amr);
  return methods.success && methods.data.some((entry) => entry.method === "totp" && entry.timestamp <= nowSeconds + 60 && nowSeconds - entry.timestamp <= ADMIN_STEP_UP_SECONDS);
}

export type VerifiedIdentity = {
  userId: string;
  assuranceLevel: "aal1" | "aal2";
  claims: Record<string, unknown>;
};

export async function getVerifiedIdentity(): Promise<VerifiedIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims.sub;
  if (error || !data || !subject || !uuidSchema.safeParse(subject).success) return null;
  const aal = data.claims.aal;
  return {
    userId: subject,
    assuranceLevel: aal === "aal2" ? "aal2" : "aal1",
    claims: data.claims,
  };
}

export async function requireUser() {
  const identity = await getVerifiedIdentity();
  if (!identity) throw new AppError("unauthorized", 401, "Sign in to continue.");
  const [profile] = await getDb()
    .select({ id: profiles.id, status: profiles.status })
    .from(profiles)
    .where(eq(profiles.id, identity.userId))
    .limit(1);
  if (!profile || profile.status !== "active") {
    throw new AppError("forbidden", 403, "This account cannot perform that operation.");
  }
  return identity;
}

export async function requireAdmin(permission: AdminPermission, options?: { stepUp?: boolean }) {
  const identity = await requireUser();
  const now = new Date();
  const memberships = await getDb()
    .select({
      permissions: adminRoles.permissions,
      active: adminRoles.active,
      expiresAt: adminRoles.expiresAt,
    })
    .from(adminRoles)
    .where(and(eq(adminRoles.userId, identity.userId), eq(adminRoles.active, true)));
  const permissions = new Set(
    memberships
      .filter((membership) => !membership.expiresAt || membership.expiresAt > now)
      .flatMap((membership) => membership.permissions)
      .filter((value): value is AdminPermission => permissionSet.has(value)),
  );
  if (!permissions.has(permission)) {
    throw new AppError("forbidden", 403, "You do not have permission for this operation.");
  }
  if (options?.stepUp && !hasRecentTotpStepUp(identity, Math.floor(Date.now() / 1000))) {
    throw new AppError("step_up_required", 403, "Complete two-factor verification within the last 10 minutes before this operation.");
  }
  return { ...identity, permissions };
}
