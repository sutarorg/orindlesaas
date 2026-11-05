import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/auth/callback"];

test("all authentication routes render one H1 and stay noindex", async ({ page }) => {
  for (const route of authRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1"), route).toHaveCount(1);
    await expect(page.locator("h1"), route).toBeVisible();
    await expect(page.locator('meta[name="robots"]'), route).toHaveAttribute("content", /noindex/);
  }
});

test("login validates, focuses the first error and preserves password visibility", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
  await page.getByLabel("Email address", { exact: true }).fill("asha@example.com");
  await page.getByLabel("Password", { exact: true }).fill("a private passphrase");
  await page.getByRole("button", { name: "Show password" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("a private passphrase");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await page.getByRole("checkbox").focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("checkbox")).toBeChecked();
});

test("login fails closed without Supabase and creates no session or preference", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("asha@example.com");
  await page.getByLabel("Password", { exact: true }).fill("a private passphrase");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText("Authentication is not configured. No account or session change was made.")).toBeVisible();
  const authStorage = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter((key) => /supabase|auth|password|remember/i.test(key)));
  expect(authStorage).toEqual([]);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "orindle_session_policy")).toBe(false);
});

test("signup explains weak and mismatched passwords, terms and honest completion", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email address", { exact: true }).fill("asha@example.com");
  await page.getByLabel("Create a password").fill("short");
  await page.getByLabel("Confirm password", { exact: true }).fill("different");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/Use at least 15 characters/)).toBeVisible();
  await expect(page.getByText(/Passwords don’t match/)).toBeVisible();
  await expect(page.getByText(/Please accept the Terms/)).toBeVisible();
  await page.getByLabel("Create a password").fill("a long private passphrase");
  await page.getByLabel("Confirm password", { exact: true }).fill("a long private passphrase");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Authentication is not configured. No account or session change was made.")).toBeVisible();
});

test("forgot-password validates and returns generic no-delivery feedback", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email address", { exact: true }).fill("not-an-email");
  await page.getByRole("button", { name: "Request reset link" }).click();
  await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("asha@example.com");
  await page.getByRole("button", { name: "Request reset link" }).click();
  await expect(page.getByText("Authentication is not configured. No account or session change was made.")).toBeVisible();
  await expect(page.getByText(/reset link has been requested/i)).toHaveCount(0);
});

test("password update validates and expired reset offers a real recovery route", async ({ page }) => {
  await page.goto("/reset-password");
  await page.getByLabel("New password", { exact: true }).fill("a long private passphrase");
  await page.getByLabel("Confirm new password").fill("a different private passphrase");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText(/Passwords don’t match/)).toBeVisible();
  await page.getByLabel("Confirm new password").fill("a long private passphrase");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Authentication is not configured. No account or session change was made.")).toBeVisible();
  await page.goto("/reset-password?state=expired");
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  await expect(page.getByText("This reset link has expired", { exact: true })).toHaveCount(0);
});

test("verification fails closed and query strings cannot spoof success or expiry", async ({ page }) => {
  await page.goto("/verify-email");
  await expect(page.getByText("Confirm your email", { exact: true })).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("asha@example.com");
  await page.getByRole("button", { name: "Request verification email" }).click();
  await expect(page.getByText("Authentication is not configured. No account or session change was made.")).toBeVisible();
  for (const state of ["success", "expired"]) {
    await page.goto(`/verify-email?state=${state}`);
    await expect(page.getByText("Confirm your email", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request verification email" })).toBeVisible();
    await expect(page.getByText("Your email is verified", { exact: true })).toHaveCount(0);
  }
});

test("OAuth controls fail closed without implying provider contact", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue with GitHub" }).click();
  await expect(page.getByText("Authentication is not configured. No account or session change was made.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/login?state=oauth-cancelled&provider=github");
  await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
  await expect(page.getByText("GitHub sign-in was cancelled", { exact: true })).toHaveCount(0);
});

test("login and signup ignore visitor-supplied account state", async ({ page }) => {
  for (const route of ["/login?state=invalid-credentials", "/login?state=network-failure", "/login?state=session-expired"]) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Log in", exact: true })).toBeVisible();
    await expect(page.getByText(/presentation preview|expiry-state preview|no credentials were checked/i)).toHaveCount(0);
  }
  for (const route of ["/signup?state=already-registered", "/signup?state=verification-required"]) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(page.getByText(/This email may already be registered|No account was created and no verification email was sent in this preview/)).toHaveCount(0);
  }
});

test("callback requires a real code exchange and never reflects secrets or arbitrary next values", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page.getByText("This sign-in link could not be used", { exact: true })).toBeVisible();
  await page.goto("/auth/callback?error=access_denied");
  await expect(page.getByText("This sign-in link could not be used", { exact: true })).toBeVisible();
  await page.goto("/auth/callback?code=do-not-reflect-this&next=https%3A%2F%2Fmalicious.invalid");
  await expect(page).toHaveURL(/\/auth\/callback\?/);
  await expect(page.getByText("Authentication is not configured", { exact: true })).toBeVisible();
  expect(await page.locator("body").innerText()).not.toContain("do-not-reflect-this");
  expect(await page.locator("body").innerText()).not.toContain("malicious.invalid");
});

test("authentication routes and states do not overflow mobile or desktop", async ({ page }) => {
  const routes = [...authRoutes, "/signup?pack=studio", "/reset-password?state=expired", "/verify-email?state=success"];
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} overflows at ${width}px`).toBe(false);
    }
  }
});

const axeRoutes = [
  ...authRoutes,
  "/login?state=invalid-credentials",
  "/login?state=oauth-cancelled&provider=github",
  "/signup?state=already-registered&pack=pro",
  "/reset-password?state=expired",
  "/verify-email?state=success",
  "/verify-email?state=expired",
  "/auth/callback?state=error",
];

for (const route of axeRoutes) {
  test(`axe auth review: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}
