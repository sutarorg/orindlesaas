import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const workspaceRoutes = [
  "/app", "/app/chat", "/app/chat/00000000-0000-4000-8000-000000000001", "/app/image-studio", "/app/video-studio",
  "/app/websites", "/app/websites/new", "/app/websites/00000000-0000-4000-8000-000000000001/editor",
  "/app/websites/00000000-0000-4000-8000-000000000001/settings", "/app/projects", "/app/library", "/app/history",
  "/app/credits", "/app/credits/history", "/app/settings", "/app/support",
];

test("every workspace route requires verified identity before rendering customer data", async ({ page }) => {
  for (const route of workspaceRoutes) {
    await page.goto(route);
    const url = new URL(page.url());
    expect(url.pathname, route).toBe("/login");
    expect(url.searchParams.get("next"), route).toBe(route);
    expect(url.searchParams.get("reason"), route).toBe("configuration");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back." })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    expect(await page.locator("body").innerText()).not.toContain("Demo workspace");
  }
});

test("robots and sitemap keep the workspace non-discoverable", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /app");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("/app");
});

test("anonymous workspace reads deny by default with safe correlated errors", async ({ request }) => {
  for (const path of ["/api/v1/workspace", "/api/v1/chat", "/api/v1/generations/00000000-0000-4000-8000-000000000001"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(503);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect(response.headers()["x-request-id"]).toBeTruthy();
    const body = await response.json();
    expect(body.error.code).toBe("integration_unavailable");
    expect(JSON.stringify(body)).not.toContain("password");
  }
});

test("anonymous charged and account mutations cannot bypass CSRF or identity checks", async ({ request }) => {
  const origin = "https://127.0.0.1:3000";
  const cases = [
    ["/api/v1/generations", { kind: "image", modelId: "gateway:provider/model", prompt: "A safe test prompt", idempotencyKey: "00000000-0000-4000-8000-000000000001" }],
    ["/api/v1/chat", { modelId: "gateway:provider/model", message: "Hello", idempotencyKey: "00000000-0000-4000-8000-000000000001" }],
    ["/api/v1/account/deletion", { confirmation: "DELETE", reason: "Anonymous test must not persist" }],
  ] as const;
  for (const [path, data] of cases) {
    const response = await request.post(path, { data, headers: { Origin: origin } });
    expect(response.status(), path).toBe(503);
    expect((await response.json()).error.code).toBe("integration_unavailable");
  }
});

test("private-route login handoff remains accessible and responsive", async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/credits");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  }
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
});
