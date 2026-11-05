import { describe, expect, it } from "vitest";
import {
  getPasswordGuidance,
  isValidEmail,
  passwordLength,
  validateEmailRequest,
  validateLogin,
  validatePasswordUpdate,
  validateSignUp,
} from "@/lib/auth/validation";
import {
  getCallbackPreviewState,
  getLoginPreviewState,
  getResetPreviewState,
  getSignupPreviewState,
  getVerificationPreviewState,
  parseOAuthProvider,
  parsePackId,
} from "@/lib/auth/preview-states";

describe("authentication validation", () => {
  it("validates email without persisting or transforming the source value", () => {
    expect(isValidEmail("  asha@example.com  ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(validateEmailRequest("").email).toBe("Enter your email address.");
    expect(validateEmailRequest("not-an-email").email).toContain("valid email");
    expect(validateLogin({ email: "asha@example.com", password: "secret" })).toEqual({});
  });

  it("uses Unicode code-point boundaries and permits passphrase whitespace", () => {
    expect(passwordLength("😀".repeat(15))).toBe(15);
    expect(validateSignUp({ name: "Asha Rao", email: "asha@example.com", password: "😀".repeat(14), confirmPassword: "😀".repeat(14), acceptedTerms: true }).password).toContain("at least 15");
    expect(validateSignUp({ name: "Asha Rao", email: "asha@example.com", password: "😀".repeat(15), confirmPassword: "😀".repeat(15), acceptedTerms: true })).toEqual({});
    expect(validatePasswordUpdate({ password: "a".repeat(128), confirmPassword: "a".repeat(128) })).toEqual({});
    expect(validatePasswordUpdate({ password: "a".repeat(129), confirmPassword: "a".repeat(129) }).password).toContain("no more than 128");
    expect(validatePasswordUpdate({ password: "a phrase with spaces", confirmPassword: "a phrase with spaces" })).toEqual({});
  });

  it("requires name, matching confirmation and affirmative terms acceptance", () => {
    const errors = validateSignUp({ name: "A", email: "bad", password: "short", confirmPassword: "different", acceptedTerms: false });
    expect(errors.name).toContain("at least 2");
    expect(errors.email).toContain("valid email");
    expect(errors.password).toContain("at least 15");
    expect(errors.confirmPassword).toContain("don’t match");
    expect(errors.terms).toContain("accept the Terms");
    expect(validateLogin({ email: "asha@example.com", password: "" }).password).toBe("Enter your password.");
  });

  it("gives length guidance rather than a fabricated strength score", () => {
    expect(getPasswordGuidance("")).toContain("15–128");
    expect(getPasswordGuidance("short")).toContain("10 more characters");
    expect(getPasswordGuidance("a".repeat(16))).toContain("20+");
    expect(getPasswordGuidance("a".repeat(20))).toContain("No special-character mix");
  });
});

describe("authentication presentation-state allowlists", () => {
  it("returns only documented route states", () => {
    expect(getLoginPreviewState("invalid-credentials")?.tone).toBe("error");
    expect(getLoginPreviewState("oauth-cancelled", "github")?.title).toContain("GitHub");
    expect(getLoginPreviewState("unexpected")).toBeNull();
    expect(getLoginPreviewState(["invalid-credentials"])).toBeNull();
    expect(getSignupPreviewState("already-registered")?.body).toContain("may already");
    expect(getResetPreviewState("expired")?.title).toContain("expired");
    expect(getResetPreviewState("other")).toBeNull();
  });

  it("keeps verification and callback success explicitly presentational", () => {
    expect(getVerificationPreviewState("success").body).toContain("no email has been verified");
    expect(getVerificationPreviewState("expired").tone).toBe("error");
    expect(getVerificationPreviewState("other").title).toBe("Confirm your email");
    expect(getCallbackPreviewState(undefined).body).toContain("No authorization code was exchanged");
    expect(getCallbackPreviewState("cancelled").title).toContain("cancelled");
    expect(getCallbackPreviewState("unexpected").title).toBe("Finishing your sign-in");
  });

  it("allowlists providers and pack display intent", () => {
    expect(parseOAuthProvider("github")).toBe("github");
    expect(parseOAuthProvider("unknown")).toBe("google");
    expect(parsePackId("pro")).toBe("pro");
    expect(parsePackId("enterprise")).toBeUndefined();
    expect(parsePackId(["pro"])).toBeUndefined();
  });
});
