import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { articles } from "@/lib/content/articles";
import { products } from "@/lib/content/products";

const publicRoutes = [
  "/",
  "/features",
  ...products.map((product) => product.route),
  "/pricing",
  "/models",
  "/blog",
  ...articles.map((article) => `/blog/${article.slug}`),
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/credits-policy",
] as const;
const productionOrigin = "https://orindle.com";

function absolute(route: string) {
  return new URL(route, productionOrigin).href;
}

test("every indexable route has unique metadata and a verified-origin canonical", async ({ page }) => {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const route of publicRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    const title = (await page.title()).trim();
    const description = (await page.locator('meta[name="description"]').getAttribute("content"))?.trim() ?? "";
    expect(title.length, route).toBeGreaterThan(10);
    expect(description.length, route).toBeGreaterThan(40);
    expect(titles.has(title), `duplicate title ${title}`).toBe(false);
    expect(descriptions.has(description), `duplicate description on ${route}`).toBe(false);
    titles.set(title, route);
    descriptions.set(description, route);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    const openGraphUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
    expect(new URL(canonical!).href, route).toBe(absolute(route));
    expect(new URL(openGraphUrl!).href, route).toBe(absolute(route));
    const openGraphTitle = (await page.locator('meta[property="og:title"]').getAttribute("content"))?.trim() ?? "";
    expect(openGraphTitle.length, route).toBeGreaterThan(10);
    expect(title, route).toContain(openGraphTitle);
    await expect(page.locator('meta[property="og:description"]'), route).toHaveAttribute("content", description);
    await expect(page.locator('meta[property="og:image"]'), route).toHaveAttribute("content", /^https:\/\/orindle\.com\//);
    await expect(page.locator('meta[name="twitter:image"]'), route).toHaveAttribute("content", /^https:\/\/orindle\.com\//);
    await expect(page.locator('meta[name="twitter:card"]'), route).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator("h1"), route).toHaveCount(1);
    await expect(page.locator("h1"), route).toBeVisible();
  }
});

test("sitemap exactly matches the indexable registry and robots excludes all private boundaries", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const actual = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
  const expected = publicRoutes.map((route) => absolute(route)).sort();
  expect(actual).toEqual(expected);
  expect(new Set(actual).size).toBe(actual.length);

  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.status()).toBe(200);
  const robots = await robotsResponse.text();
  expect(robots).toContain(`Sitemap: ${absolute("/sitemap.xml")}`);
  for (const path of ["/app", "/admin", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/auth/"]) {
    expect(robots).toContain(`Disallow: ${path}`);
  }
});

test("all public internal links and fragments resolve without dead placeholder controls", async ({ page, request }) => {
  const internal = new Set<string>();
  const fragments = new Set<string>();
  for (const route of publicRoutes) {
    await page.goto(route);
    const hrefs = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") ?? ""));
    for (const href of hrefs) {
      expect(href, `${route} contains a placeholder href`).not.toBe("#");
      if (href.startsWith("#")) {
        expect(await page.locator(href).count(), `${route} missing ${href}`).toBeGreaterThan(0);
      } else if (href.startsWith("/") && !href.startsWith("//")) {
        internal.add(href);
        if (href.includes("#")) fragments.add(href);
      }
    }
  }
  for (const href of internal) {
    const path = href.split("#", 1)[0] || "/";
    const response = await request.get(path);
    expect(response.status(), href).toBeLessThan(400);
  }
  for (const href of fragments) {
    const [path, fragment] = href.split("#");
    await page.goto(path || "/");
    expect(await page.locator(`[id="${fragment}"]`).count(), href).toBeGreaterThan(0);
  }
});

test("every public route reflows at core widths and keeps native controls operable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of publicRoutes) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}`).toBe(true);
      const undersizedButtons = await page.getByRole("button").evaluateAll((buttons) => buttons.filter((button) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24);
      }).map((button) => ({ text: button.textContent?.trim(), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
      expect(undersizedButtons, `${route} undersized buttons at ${width}`).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

for (const route of publicRoutes) {
  test(`axe WCAG 2.2 AA review: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}
