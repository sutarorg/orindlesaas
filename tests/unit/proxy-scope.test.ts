import { describe, expect, it } from "vitest";
import { requiresPrivateSession } from "@/lib/server/auth/safe-redirect";
import { config } from "@/proxy";

describe("proxy session-refresh scope", () => {
  it("only runs for the private workspace and admin areas", () => {
    const [appMatcher, adminMatcher] = config.matcher;
    expect(config.matcher).toHaveLength(2);
    expect(appMatcher).toBe("/app/:path*");
    expect(adminMatcher).toBe("/admin/:path*");
  });

  it("keeps the areas the matcher covers identical to the areas the server guards", () => {
    // The matcher must not skip a route that actually reads the session, or that route would start
    // failing closed. Every path here is guarded by requireUser/requireAdmin on the server.
    for (const path of ["/app", "/app/chat", "/app/credits/history", "/app/websites/x/editor", "/admin", "/admin/users"]) {
      expect(requiresPrivateSession(path), path).toBe(true);
    }
  });

  it("leaves public marketing routes out of auth work", () => {
    // These pages never read the session, so refreshing it there was pure latency.
    for (const path of ["/", "/pricing", "/features", "/blog", "/about", "/faq", "/login", "/signup", "/models"]) {
      expect(requiresPrivateSession(path), path).toBe(false);
    }
  });

  it("does not mistake lookalike prefixes for protected areas", () => {
    expect(requiresPrivateSession("/application")).toBe(false);
    expect(requiresPrivateSession("/administrator")).toBe(false);
  });
});
