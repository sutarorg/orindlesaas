import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = [
  "/", "/features", "/features/ai-chat", "/features/ai-image-generator", "/features/ai-video-generator", "/features/ai-website-builder",
  "/pricing", "/models", "/blog", "/blog/best-ai-tools-for-creators", "/blog/gpt-vs-claude-vs-gemini", "/blog/ai-image-generation-guide",
  "/blog/create-ai-videos", "/blog/build-website-with-ai", "/blog/ai-for-small-business", "/about", "/contact", "/faq", "/privacy", "/terms", "/credits-policy",
];

test("all required public routes render one H1", async ({ page }) => {
  for (const route of publicRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1"), route).toHaveCount(1);
    await expect(page.locator("h1"), route).toBeVisible();
  }
});

test("prohibited and unknown routes return not-found UI", async ({ page }) => {
  for (const route of ["/refund-policy", "/blog/not-a-real-article", "/features/not-a-product"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This idea took a different direction." })).toBeVisible();
  }
});

test("article metadata, canonical and structured data are present", async ({ page }) => {
  await page.goto("/blog/gpt-vs-claude-vs-gemini");
  await expect(page).toHaveTitle(/GPT vs Claude vs Gemini/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/blog\/gpt-vs-claude-vs-gemini$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join(" ")).toContain('"Article"');
  expect(jsonLd.join(" ")).toContain('"BreadcrumbList"');
});

test("sitemap and robots exclude authentication routes", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain("/blog/ai-for-small-business");
  for (const route of ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/auth/callback"]) {
    expect(text).not.toContain(route);
  }
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.status()).toBe(200);
  const robots = await robotsResponse.text();
  for (const route of ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/auth/"]) {
    expect(robots).toContain(`Disallow: ${route}`);
  }
});

test("desktop Products disclosure supports Escape and navigates to a real product", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Products" });
  const productLink = page.locator("#products-navigation").getByRole("link").filter({ hasText: "Orindle Chat" });

  await trigger.click();
  await expect(productLink).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(productLink).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await productLink.click();
  await expect(page).toHaveURL(/\/features\/ai-chat$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A conversation that keeps the work moving.");
});

test("mobile navigation supports keyboard close and focus return", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("pricing offer fragments resolve to the visible pack cards", async ({ page }) => {
  await page.goto("/pricing");
  const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(" ");
  for (const id of ["creator", "pro", "studio"]) {
    expect(jsonLd).toContain(`/pricing#${id}`);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator(`#${id}`).getByRole("heading", { level: 3 })).toBeVisible();
  }
});

test("pack handoff never claims payment or credit success", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("link", { name: "Choose Pro" }).click();
  await expect(page).toHaveURL(/\/signup\?pack=pro$/);
  await expect(page.getByText("Pro selected for later")).toBeVisible();
  await expect(page.getByText(/No payment or entitlement is created here/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Start with your next idea." })).toBeVisible();
});

test("contact validates and reports durable queue acceptance without claiming inbox delivery", async ({ page }) => {
  let requestBody: { idempotencyKey?: string } = {};
  await page.route("**/api/v1/contact", async (route) => {
    requestBody = route.request().postDataJSON() as { idempotencyKey?: string };
    await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ data: { message: "Your message was accepted for support delivery. Delivery status is tracked separately." } }) });
  });
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Enter at least 2 characters for your name.")).toBeVisible();
  await page.getByLabel("Name").fill("Asha Rao");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Message").fill("Please explain how shared credits work across products.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message was accepted for support delivery. Delivery status is tracked separately.")).toBeVisible();
  await expect(page.getByText(/message sent successfully/i)).toHaveCount(0);
  expect(requestBody.idempotencyKey).toMatch(/^[a-f0-9-]{36}$/);
});

test("contact API rejects cross-origin writes and fails closed when abuse controls are absent", async ({ request }) => {
  const data = { name: "Asha Rao", email: "asha@example.com", topic: "general", message: "Please explain how shared credits work across products.", idempotencyKey: "00000000-0000-4000-8000-000000000001" };
  const crossOrigin = await request.post("/api/v1/contact", { data, headers: { Origin: "https://malicious.invalid" } });
  expect(crossOrigin.status()).toBe(403);
  const unconfigured = await request.post("/api/v1/contact", { data, headers: { Origin: "https://127.0.0.1:3000" } });
  expect(unconfigured.status()).toBe(503);
  expect((await unconfigured.json()).error.code).toBe("integration_unavailable");
});

test("FAQ disclosure exposes native expanded state", async ({ page }) => {
  await page.goto("/faq");
  const details = page.locator("details").filter({ hasText: "Is this a monthly subscription?" });
  const trigger = details.locator("summary");

  await expect(details).not.toHaveAttribute("open", "");
  await trigger.click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.getByText(/No. Creator, Pro and Studio are one-time credit packages/)).toBeVisible();
});

test("complex pages do not overflow target viewports", async ({ page }) => {
  const routes = ["/", "/pricing", "/models", "/features/ai-image-generator", "/blog/gpt-vs-claude-vs-gemini"];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} overflows at ${width}px`).toBe(false);
    }
  }
});

for (const route of ["/", "/pricing", "/contact", "/blog/ai-image-generation-guide"]) {
  test(`axe review: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("reduced motion keeps hero and every revealed section visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Everything AI. One Platform." })).toBeVisible();
  const reveals = page.locator("[data-motion-reveal]");
  expect(await reveals.count()).toBe(2);
  await expect.poll(() => reveals.evaluateAll((elements) => elements.every((element) => {
    const style = getComputedStyle(element);
    return style.opacity === "1" && style.transform === "none";
  }))).toBe(true);
});
