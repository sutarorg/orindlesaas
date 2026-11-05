import { test, expect } from "@playwright/test";

const adminRoutes = [
  "/admin", "/admin/users", "/admin/models", "/admin/providers", "/admin/model-pricing", "/admin/credit-packages",
  "/admin/payments", "/admin/transactions", "/admin/usage", "/admin/jobs", "/admin/websites", "/admin/adjustments", "/admin/settings",
];

test("all admin routes require identity and active permissions before rendering operations", async ({ page }) => {
  for (const route of adminRoutes) {
    await page.goto(route);
    const url = new URL(page.url());
    expect(url.pathname, route).toBe("/login");
    expect(url.searchParams.get("next"), route).toBe(route);
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back." })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await page.locator("body").innerText()).not.toContain("Fictional operational data");
  }
});

test("unknown admin destinations do not bypass the authentication boundary", async ({ page }) => {
  await page.goto("/admin/not-a-real-operation");
  expect(new URL(page.url()).pathname).toBe("/login");
  await expect(page.getByRole("heading", { level: 1, name: "Welcome back." })).toBeVisible();
});

test("anonymous admin mutations are denied before validation, credits or audit writes", async ({ request }) => {
  const origin = "https://127.0.0.1:3000";
  const responses = await Promise.all([
    request.post("/api/v1/admin/credits/adjust", { data: { userId: "00000000-0000-4000-8000-000000000001", amountCredits: 100, reason: "Anonymous adjustment must fail", idempotencyKey: "00000000-0000-4000-8000-000000000002" }, headers: { Origin: origin } }),
    request.post("/api/v1/admin/actions", { data: { action: "set_pack_enabled", packId: "pro", enabled: false, expectedEnabled: true, reason: "Anonymous disable must fail", idempotencyKey: "00000000-0000-4000-8000-000000000003" }, headers: { Origin: origin } }),
  ]);
  for (const response of responses) {
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect((await response.json()).error.code).toBe("integration_unavailable");
  }
});

test("admin discovery controls remain excluded from public crawler files", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /admin");
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain("/admin");
});
