import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The hosted Inngest and Upstash Redis integrations were removed. These tests fail loudly if either
 * is reintroduced or if the replacement loses the durability guarantees the outbox provided.
 */
const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("hosted integrations are gone", () => {
  it("does not depend on inngest or upstash packages", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(all).filter((name) => /inngest|upstash/i.test(name))).toEqual([]);
  });

  it("has no Inngest endpoint or signing-key wiring", () => {
    expect(() => read("app/api/inngest/route.ts")).toThrow();
    expect(() => read("lib/server/jobs/functions.ts")).toThrow();
    const env = read("lib/server/env.ts");
    expect(env).not.toMatch(/INNGEST_/);
    expect(env).not.toMatch(/UPSTASH_/);
  });

  it("keeps the outbox durable instead of switching to fire-and-forget", () => {
    // The outbox table is what replaced the queue's retry semantics; deleting it would silently
    // drop work whenever a handler throws.
    const schema = read("lib/server/db/schema.ts");
    expect(schema).toContain("export const outboxEvents");
    const outbox = read("lib/server/jobs/outbox.ts");
    expect(outbox).toContain('status: "published"');
    expect(outbox).toContain('status: "pending"');
    // A failed handler must return the row to pending with a delay, never drop it.
    expect(outbox).toContain("availableAt");
    expect(outbox).toContain("RETRY_DELAY_MS");
  });

  it("drives every formerly-queued event name in-process", () => {
    const runner = read("lib/server/jobs/runner.ts");
    for (const event of [
      "orindle/generation.requested",
      "orindle/website.validation.requested",
      "orindle/email.delivery.requested",
      "orindle/deployment.requested",
    ]) {
      expect(runner).toContain(event);
    }
  });

  it("exposes a guarded scheduled endpoint to replace Inngest cron", () => {
    const tick = read("app/api/v1/jobs/tick/route.ts");
    expect(tick).toContain("timingSafeEqual");
    expect(tick).toContain("JOBS_TICK_SECRET");
    for (const task of ["outbox", "metering", "catalog"]) expect(tick).toContain(task);
  });

  it("limits abuse through PostgreSQL rather than Redis", () => {
    const limiter = read("lib/server/security/rate-limit.ts");
    // No imports or client construction; the file only mentions the old service in a comment.
    expect(limiter).not.toMatch(/@upstash|from "ioredis"|new Redis/i);
    expect(limiter).toContain("rateLimits");
    // A counter-store outage must not take the product down.
    expect(limiter).toContain("allowing the request");
  });
});
