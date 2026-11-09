import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getClaims: vi.fn(), getDb: vi.fn() }));
vi.mock("@/lib/server/auth/supabase", () => ({ createSupabaseServerClient: async () => ({ auth: { getClaims: mocks.getClaims } }) }));
vi.mock("@/lib/server/db/client", () => ({ getDb: mocks.getDb }));

import { getVerifiedIdentity, requireAdmin, requireUser } from "@/lib/server/auth/guards";
import { enforceRateLimit } from "@/lib/server/security/rate-limit";

const userId = "00000000-0000-4000-8000-000000000001";
function claims(aal: "aal1" | "aal2" = "aal1", totpTimestamp = Math.floor(Date.now() / 1000)) {
  return { data: { claims: { sub: userId, aal, email: "asha@example.com", amr: [{ method: "password", timestamp: totpTimestamp - 30 }, ...(aal === "aal2" ? [{ method: "totp", timestamp: totpTimestamp }] : [])] } }, error: null };
}
function profileQuery(profile: { id: string; status: string } | null) {
  const limit = vi.fn().mockResolvedValue(profile ? [profile] : []);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { select: vi.fn().mockReturnValue({ from }) };
}
function rolesQuery(roles: { permissions: string[]; active: boolean; expiresAt: Date | null }[]) {
  const where = vi.fn().mockResolvedValue(roles);
  const from = vi.fn().mockReturnValue({ where });
  return { select: vi.fn().mockReturnValue({ from }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getClaims.mockResolvedValue(claims());
});
afterEach(() => vi.unstubAllEnvs());

describe("verified identity and deny-by-default authorization", () => {
  it("rejects malformed verified subjects before any database lookup", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "not-a-uuid" } }, error: null });
    await expect(getVerifiedIdentity()).resolves.toBeNull();
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("blocks missing and suspended profiles", async () => {
    mocks.getDb.mockReturnValueOnce(profileQuery(null));
    await expect(requireUser()).rejects.toMatchObject({ status: 403 });
    mocks.getDb.mockReturnValueOnce(profileQuery({ id: userId, status: "suspended" }));
    await expect(requireUser()).rejects.toMatchObject({ status: 403 });
  });

  it("rejects expired memberships and missing action permissions", async () => {
    mocks.getDb.mockReturnValueOnce(profileQuery({ id: userId, status: "active" })).mockReturnValueOnce(rolesQuery([{ permissions: ["admin:read", "users:read"], active: true, expiresAt: new Date(Date.now() - 1000) }]));
    await expect(requireAdmin("users:read")).rejects.toMatchObject({ status: 403 });

    mocks.getDb.mockReturnValueOnce(profileQuery({ id: userId, status: "active" })).mockReturnValueOnce(rolesQuery([{ permissions: ["admin:read", "users:read"], active: true, expiresAt: null }]));
    await expect(requireAdmin("credits:adjust")).rejects.toMatchObject({ status: 403 });
  });

  it("requires recent AAL2/TOTP evidence for high-impact actions and allows an active authorized membership", async () => {
    mocks.getDb.mockReturnValueOnce(profileQuery({ id: userId, status: "active" })).mockReturnValueOnce(rolesQuery([{ permissions: ["credits:adjust"], active: true, expiresAt: null }]));
    await expect(requireAdmin("credits:adjust", { stepUp: true })).rejects.toMatchObject({ code: "step_up_required" });

    mocks.getClaims.mockResolvedValue(claims("aal2", Math.floor(Date.now() / 1000) - 601));
    mocks.getDb.mockReturnValueOnce(profileQuery({ id: userId, status: "active" })).mockReturnValueOnce(rolesQuery([{ permissions: ["credits:adjust"], active: true, expiresAt: null }]));
    await expect(requireAdmin("credits:adjust", { stepUp: true })).rejects.toMatchObject({ code: "step_up_required" });

    mocks.getClaims.mockResolvedValue(claims("aal2"));
    mocks.getDb.mockReturnValueOnce(profileQuery({ id: userId, status: "active" })).mockReturnValueOnce(rolesQuery([{ permissions: ["credits:adjust"], active: true, expiresAt: new Date(Date.now() + 60_000) }]));
    const identity = await requireAdmin("credits:adjust", { stepUp: true });
    expect(identity.userId).toBe(userId);
    expect(identity.permissions.has("credits:adjust")).toBe(true);
  });

  it("does not require an external rate-limit service", async () => {
    // Limiting moved to PostgreSQL, so there is no longer a configuration that can make every
    // request fail closed. A store error must degrade to "allow", never to a 503 for the whole app.
    vi.stubEnv("NODE_ENV", "production");
    await expect(enforceRateLimit({ name: "test", identifier: "user:test", limit: 1 })).resolves.toBeUndefined();
  });
});
