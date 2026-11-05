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
import { parsePackId } from "@/lib/auth/preview-states";

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

describe("authentication display intent", () => {
  it("allowlists pack intent without accepting arbitrary state or provider input", () => {
    expect(parsePackId("pro")).toBe("pro");
    expect(parsePackId("enterprise")).toBeUndefined();
    expect(parsePackId(["pro"])).toBeUndefined();
  });
});
