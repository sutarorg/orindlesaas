import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const adminRoutes = [
  ["/admin", "Platform overview"],
  ["/admin/users", "User management"],
  ["/admin/models", "AI Models"],
  ["/admin/providers", "Providers"],
  ["/admin/model-pricing", "Model Pricing"],
  ["/admin/credit-packages", "Credit Packages"],
  ["/admin/payments", "Payments"],
  ["/admin/transactions", "Transactions"],
  ["/admin/usage", "AI Usage & Costs"],
  ["/admin/jobs", "Generation Jobs"],
  ["/admin/websites", "Website Projects"],
  ["/admin/adjustments", "Adjustments & Disputes"],
  ["/admin/settings", "Admin Settings"],
] as const;

async function confirmReasonedAction(page: Page, reason: string, confirmName: string) {
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("at least 12 characters");
  await page.getByLabel("Administrative reason").fill(reason);
  await page.getByRole("button", { name: "Continue to review" }).click();
  await expect(page.getByText("Review the preview intent")).toBeVisible();
  await page.getByRole("button", { name: confirmName }).click();
}

test("all 13 admin routes render one H1, demo chrome, noindex and semantic data regions", async ({ page }) => {
  test.setTimeout(90_000);
  for (const [route, heading] of adminRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1"), route).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: heading }), route).toBeVisible();
    await expect(page.locator('meta[name="robots"]'), route).toHaveAttribute("content", /noindex/);
    await expect(page.getByText("Demo data", { exact: true }), route).toBeVisible();
    await expect(page.getByText(/Demo admin · fictional operational data · no live changes/), route).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }), route).toBeVisible();
    expect(await page.locator('[role="grid"]').count(), `${route} must not misuse ARIA grid`).toBe(0);
  }
});

test("unknown admin destinations are real noindex 404s and crawlers exclude admin", async ({ page, request }) => {
  const response = await page.goto("/admin/not-a-real-destination");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Admin destination not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  await page.getByRole("link", { name: "Return to admin overview" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin/");
  expect(robots).toContain("Disallow: /admin\n");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/admin");
});

test("global fixture search navigates with a safe local query and reports no matches", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Search admin fixtures" }).click();
  await page.getByLabel("Search by name, ID or reference").fill("Maya");
  await expect(page.getByRole("status")).toContainText("local fixture");
  await page.getByRole("link", { name: /Maya Chen/ }).click();
  await expect(page).toHaveURL(/\/admin\/users\?q=Maya$/);
  await expect(page.getByLabel("Search users")).toHaveValue("Maya");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Search admin fixtures" }).click();
  await page.getByLabel("Search by name, ID or reference").fill("no-such-admin-fixture");
  await expect(page.getByText(/No fixtures match “no-such-admin-fixture”/)).toBeVisible();
});

test("mobile navigation traps focus, closes with Escape and navigates without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  const trigger = page.getByRole("button", { name: "Open admin navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Admin navigation" });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer.getByRole("link", { name: "AI Usage & Costs", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/usage$/);
  await expect(drawer).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("notifications and admin sign-out remain explicitly local previews", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: /Admin notifications, 2 unread/ }).click();
  await page.getByRole("menuitem", { name: "Mark all read locally" }).click();
  await expect(page.getByRole("button", { name: "Admin notifications", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open demo admin profile menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out preview" }).click();
  await expect(page.getByText(/There is no authenticated admin session to sign out of/)).toBeVisible();
  await expect(page.getByText(/0 credits changed · No audit persisted/)).toBeVisible();
});

test("overview ranges and exact chart values remain readable and defined", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText(/Credits deducted ÷100 in USD/)).toBeVisible();
  await expect(page.getByText(/Usage value minus provider cost; excludes every other operating expense/)).toBeVisible();
  await page.getByLabel("Fixture range").selectOption("7d");
  await expect(page.getByLabel("Fixture range")).toHaveValue("7d");
  await expect(page.getByText("Illustrative jobs per UTC day · Last 7 demo days", { exact: true })).toBeVisible();
  const chart = page.getByRole("region", { name: "Successful and failed purchases chart" });
  await expect(chart).toBeVisible();
  await page.getByText("View exact demo values").nth(1).click();
  await expect(page.getByRole("table", { name: /Exact values for Successful and failed purchases/ })).toBeVisible();
});

test("user filtering, pagination, detail history and account-action review never mutate an account", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page.getByRole("button", { name: "Next users page" }).click();
  await expect(page.getByRole("navigation", { name: "users pagination" })).toContainText("Page 2 of 3");
  await expect(page.locator("tbody")).toContainText("Nina Petrov");
  await page.getByLabel("Account status").selectOption("review");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByLabel("Search users").fill("Maya");
  await expect(page.getByRole("heading", { name: "No users match these filters" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).last().click();
  await page.getByLabel("Search users").fill("Maya");
  await page.getByRole("button", { name: "View Maya Chen" }).click();
  await expect(page.getByRole("dialog", { name: "Maya Chen" })).toContainText("Purchase history · demo");
  await expect(page.getByRole("dialog", { name: "Maya Chen" })).toContainText("Usage history · demo");
  await page.getByRole("button", { name: "Preview suspension" }).click();
  await confirmReasonedAction(page, "Support ticket verifies the requested suspension review", "Confirm status preview");
  await expect(page.getByText(/No user account or status changed/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "View Maya Chen" }).click();
  await expect(page.getByRole("dialog", { name: "Maya Chen" })).toContainText("active");
});

test("model, pricing and package configuration use reviewed no-operation forms", async ({ page }) => {
  await page.goto("/admin/models");
  await page.getByRole("button", { name: /Configure / }).first().click();
  await page.getByLabel("Configuration reason").fill("Catalogue availability review for the admin demo");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("button", { name: "Confirm model preview" }).click();
  await expect(page.getByText(/No model, product availability or provider configuration changed/)).toBeVisible();

  await page.goto("/admin/model-pricing");
  await page.getByRole("button", { name: /Edit pricing for/ }).first().click();
  await page.getByLabel("Pricing change reason").fill("Illustrative provider cost and credit price review");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("button", { name: "Confirm pricing preview" }).click();
  await expect(page.getByText(/No price version was saved, scheduled or used for a charge/)).toBeVisible();

  await page.goto("/admin/credit-packages");
  await expect(page.getByText("$49", { exact: true })).toBeVisible();
  await expect(page.getByText(/4,900/)).toBeVisible();
  await page.getByRole("button", { name: "Configure Pro" }).click();
  await page.getByLabel("Package change reason").fill("Confirm the exact Pro fixture remains intentional");
  await page.getByRole("button", { name: "Continue to review" }).click();
  await page.getByRole("button", { name: "Confirm package preview" }).click();
  await expect(page.getByText(/No package, checkout or customer price changed/)).toBeVisible();
  await expect(page.getByLabel("One-time price · USD")).toHaveCount(0);
  await expect(page.getByText("$49", { exact: true })).toBeVisible();
});

test("payment reconciliation and transaction references keep payment, webhook and fulfillment states separate", async ({ page }) => {
  await page.goto("/admin/payments?q=pay_demo_004");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("provider_pay_demo_004");
  await expect(page.locator("tbody")).toContainText("verified");
  await expect(page.locator("tbody")).toContainText("Pending");
  await page.getByRole("button", { name: "Review provider_pay_demo_004" }).click();
  await expect(page.getByRole("dialog")).toContainText("Safe transaction reference");
  await page.getByRole("button", { name: "Review reconciliation intent" }).click();
  await confirmReasonedAction(page, "Reconcile the documented pending fulfillment fixture", "Confirm reconciliation preview");
  await expect(page.getByText(/No payment, webhook, fulfillment or credit ledger changed/)).toBeVisible();
  await page.goto("/admin/transactions");
  await page.getByLabel("Transaction type").selectOption("usage");
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await expect(page.locator("tbody")).not.toContainText("purchase");
  await page.getByLabel("Search transactions").fill("no-such-reference");
  await expect(page.getByRole("heading", { name: "No transactions match these filters" })).toBeVisible();
});

test("credit adjustments require reference, reason, confirmation and an ephemeral audit preview", async ({ page }) => {
  await page.goto("/admin/adjustments");
  await page.getByRole("button", { name: "Review adjustment preview" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("support ticket or change reference");
  await page.getByLabel("Support ticket or change reference").fill("SUP-DEMO-1043");
  await page.getByRole("button", { name: "Review adjustment preview" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("at least 12 characters");
  await page.getByLabel("Substantive administrative reason").fill("Correct a documented duplicate demo usage deduction");
  await page.getByRole("button", { name: "Review adjustment preview" }).click();
  const review = page.getByRole("dialog", { name: "Confirm credit adjustment preview" });
  await expect(review).toContainText("+100 credits");
  await expect(review).toContainText("0 credits changed · no audit persisted");
  await page.getByRole("button", { name: "Confirm adjustment preview" }).click();
  await expect(page.getByText(/No wallet or ledger changed/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "This session · not persisted" })).toBeVisible();
  await expect(page.getByText("+100 credits · correction", { exact: true })).toBeVisible();
  await expect(page.getByText("Audit records persisted", { exact: true }).locator("..")).toContainText("0");
});

test("job retries and website details expose only safe redacted metadata", async ({ page }) => {
  await page.goto("/admin/jobs");
  await page.getByLabel("Status", { exact: true }).selectOption("failed");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("button", { name: /Inspect job_demo/ }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Redacted diagnostic summary");
  await page.getByRole("button", { name: "Review retry intent" }).click();
  await confirmReasonedAction(page, "Retry the documented failed generation fixture safely", "Confirm retry preview");
  await expect(page.getByText(/No provider was called, no job was queued and no credits were deducted/)).toBeVisible();
  await page.goto("/admin/websites");
  await page.getByLabel("Deployment status").selectOption("failed");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: /View / }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Not included or authorized by this view");
  await expect(page.locator("pre, code")).toHaveCount(0);
});

test("usage filters conserve explicit cost categories and settings never persist access changes", async ({ page }) => {
  await page.goto("/admin/usage");
  await expect(page.getByText("AI provider cost · demo", { exact: true })).toBeVisible();
  await expect(page.getByText("Customer usage value · demo", { exact: true })).toBeVisible();
  await expect(page.getByText("Failed generation cost · demo", { exact: true })).toBeVisible();
  await expect(page.getByText("Unreconciled usage", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Product", { exact: true }).selectOption("video");
  await expect(page.getByRole("table", { name: /AI usage and cost events/ }).locator("tbody")).toContainText("Video");
  await expect(page.getByRole("table", { name: "Product-level AI costs" })).toContainText("Video");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.goto("/admin/settings");
  await page.getByLabel("Default fixture range").selectOption("7d");
  await page.getByLabel("Compact", { exact: true }).check();
  await page.getByLabel("Show fixture notification examples").uncheck();
  await page.getByRole("button", { name: "Preview preference validation" }).click();
  await expect(page.getByText(/No admin preference, notification setting or role changed/)).toBeVisible();
  await expect(page.getByText(/Permission bundles for backend review—not active roles/)).toBeVisible();
});

test("admin tables and workspaces do not create document-level horizontal overflow", async ({ page }) => {
  test.setTimeout(240_000);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route] of adminRoutes) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${route} overflows at ${width}px`).toBe(false);
    }
  }
  for (const width of [768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/admin", "/admin/users", "/admin/usage", "/admin/adjustments", "/admin/settings"]) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${route} overflows at ${width}px`).toBe(false);
    }
  }
});

test("all admin routes pass automated WCAG accessibility checks", async ({ page }) => {
  test.setTimeout(240_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [route] of adminRoutes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations, `axe violations on ${route}`).toEqual([]);
  }
});
