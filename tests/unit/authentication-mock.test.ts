import { describe, expect, it } from "vitest";
import { MockAuthenticationAdapter } from "@/lib/mocks/authentication-preview";

const service = new MockAuthenticationAdapter(0);
const signup = { name: "Asha Rao", email: "asha@example.com", password: "a long private passphrase", confirmPassword: "a long private passphrase", acceptedTerms: true };

describe("frontend-only authentication adapter", () => {
  it("never returns real success, a user, a session or an OAuth redirect", async () => {
    const results = await Promise.all([
      service.signUp(signup),
      service.signIn({ email: signup.email, password: signup.password, rememberMe: true }),
      service.signOut(),
      service.requestPasswordReset({ email: signup.email }),
      service.updatePassword({ password: signup.password, confirmPassword: signup.password }),
      service.requestEmailVerification({ email: signup.email }),
      service.completeEmailVerification({ code: "must-not-be-used", next: "https://malicious.invalid" }),
      service.beginOAuth({ provider: "google", intent: "login" }),
      service.beginOAuth({ provider: "github", intent: "signup" }),
      service.completeOAuthCallback({ code: "must-not-be-used" }),
    ]);

    for (const result of results) {
      expect(result.status).toBe("preview");
      expect(result.session).toBeNull();
      expect(result.message).toMatch(/No |no /);
      expect(result).not.toHaveProperty("user");
      expect(result).not.toHaveProperty("url");
    }
  });

  it("uses generic reset copy and explicitly unavailable session/access states", async () => {
    const first = await service.requestPasswordReset({ email: "known@example.com" });
    const second = await service.requestPasswordReset({ email: "unknown@example.com" });
    expect(first).toEqual(second);
    expect(first.message).toContain("whether or not an account exists");
    await expect(service.getSession()).resolves.toEqual({ status: "unavailable", user: null });
    await expect(service.requireRouteAccess({ requestedPath: "/dashboard" })).resolves.toEqual({ status: "unavailable", reason: "auth_not_connected" });
  });
});
