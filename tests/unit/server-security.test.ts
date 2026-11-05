import { describe, expect, it } from "vitest";
import { safeNextPath, requiresPrivateSession } from "@/lib/server/auth/safe-redirect";
import { readServerEnvironment, validateNoPublicSecrets } from "@/lib/server/env";

describe("server security primitives", () => {
  it.each(["//evil.example", "https://evil.example", "/\\evil.example", "/app\r\nLocation:https://evil.example"]) (
    "rejects unsafe redirect %s",
    (value) => expect(safeNextPath(value)).toBe("/app"),
  );

  it("allows local paths and detects private route boundaries", () => {
    expect(safeNextPath("/app/credits?purchase=1")).toBe("/app/credits?purchase=1");
    expect(requiresPrivateSession("/app")).toBe(true);
    expect(requiresPrivateSession("/admin/users")).toBe(true);
    expect(requiresPrivateSession("/application")).toBe(false);
  });

  it("uses safe defaults without requiring provider secrets", () => {
    const env = readServerEnvironment({});
    expect(env.DODO_PAYMENTS_ENVIRONMENT).toBe("test_mode");
    expect(env.VERCEL_DEPLOY_TARGET).toBe("preview");
  });

  it("rejects secret-like public variable names", () => {
    expect(() => validateNoPublicSecrets({ NEXT_PUBLIC_DATABASE_URL: "secret" })).toThrow(/Forbidden/);
  });
});
