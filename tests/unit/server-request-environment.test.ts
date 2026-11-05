import { describe, expect, it } from "vitest";
import { requestId } from "@/lib/server/http";
import { readServerEnvironment, validateDodoMode, validateNoPublicSecrets } from "@/lib/server/env";

function withRequestId(value?: string) {
  return new Request("https://orindle.com/api/v1/workspace", value === undefined ? undefined : { headers: { "X-Request-Id": value } });
}

describe("request correlation and environment boundaries", () => {
  it("retains only a bounded explicit correlation ID", () => {
    expect(requestId(withRequestId("request:ABC_def-123.xyz"))).toBe("request:ABC_def-123.xyz");
  });

  it.each(["contains spaces", "tab\tseparator", "bad/slash", "bad@example", "x".repeat(101)])(
    "replaces an invalid caller-supplied request ID: %s",
    (value) => {
      const result = requestId(withRequestId(value));
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(result).not.toBe(value);
    },
  );

  it("rejects test-shaped Dodo credentials in live mode and live-shaped credentials in test mode", () => {
    expect(() => validateDodoMode(readServerEnvironment({ DODO_PAYMENTS_ENVIRONMENT: "test_mode", DODO_PAYMENTS_API_KEY: "live_synthetic" }))).toThrow(/live credentials/);
    expect(() => validateDodoMode(readServerEnvironment({ DODO_PAYMENTS_ENVIRONMENT: "live_mode", DODO_PAYMENTS_API_KEY: "test_synthetic" }))).toThrow(/test credentials/);
    expect(() => validateDodoMode(readServerEnvironment({ DODO_PAYMENTS_ENVIRONMENT: "live_mode", DODO_PAYMENTS_API_KEY: "pk_test_synthetic" }))).toThrow(/test credentials/);
  });

  it("rejects generic public API/private key names while allowing the Supabase publishable key", () => {
    expect(() => validateNoPublicSecrets({ NEXT_PUBLIC_API_KEY: "synthetic" })).toThrow(/Forbidden/);
    expect(() => validateNoPublicSecrets({ NEXT_PUBLIC_PRIVATE_KEY: "synthetic" })).toThrow(/Forbidden/);
    expect(() => validateNoPublicSecrets({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable" })).not.toThrow();
  });
});
