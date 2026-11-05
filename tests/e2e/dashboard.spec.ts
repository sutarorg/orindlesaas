import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const workspaceRoutes = [
  "/app",
  "/app/chat",
  "/app/chat/conv-campaign",
  "/app/image-studio",
  "/app/video-studio",
  "/app/websites",
  "/app/websites/new",
  "/app/websites/site-stillwater/editor",
  "/app/websites/site-stillwater/settings",
  "/app/projects",
  "/app/library",
  "/app/history",
  "/app/credits",
  "/app/credits/history",
  "/app/settings",
  "/app/support",
];

test("all workspace routes render one H1, noindex and fixture chrome", async ({ page }) => {
  test.setTimeout(60_000);
  for (const route of workspaceRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1"), route).toHaveCount(1);
    await expect(page.locator("h1"), route).toBeVisible();
    await expect(page.locator('meta[name="robots"]'), route).toHaveAttribute("content", /noindex/);
    await expect(page.getByText("Demo workspace · illustrative fixtures · changes are not saved"), route).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]'), route).toHaveCount(0);
  }
});

test("unknown fixture IDs and workspace routes return safe not-found UI", async ({ page }) => {
  for (const route of ["/app/not-a-route", "/app/chat/not-a-conversation", "/app/websites/not-a-site/editor", "/app/websites/not-a-site/settings"]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(404);
    await expect(page.getByRole("heading", { name: "This fixture isn’t available" })).toBeVisible();
    await expect(page.getByText(/Nothing was looked up in a private account/)).toBeVisible();
  }
});

test("robots and sitemap treat the workspace as non-discoverable", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /app/");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/app");
});

test("overview exposes explicit empty, error, session and authorization fixtures", async ({ page }) => {
  await page.goto("/app?state=empty");
  await expect(page.getByRole("heading", { name: "Your workspace story starts here" })).toBeVisible();
  await page.goto("/app?state=error");
  await expect(page.getByRole("heading", { name: "The workspace fixture couldn’t be displayed" })).toBeVisible();
  await page.goto("/app?state=session-expired");
  await expect(page.getByText("Session-expiry design fixture")).toBeVisible();
  await expect(page.getByText(/No session existed or expired/)).toBeVisible();
  await page.goto("/app?state=unauthorized");
  await expect(page.getByText("Unauthorized-state design fixture")).toBeVisible();
  await expect(page.getByText(/No authorization check ran/)).toBeVisible();
});

test("desktop sidebar collapses and mobile drawer supports Escape, focus return and navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", { name: "Open workspace navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("dialog", { name: "Workspace navigation" }).getByRole("link", { name: "Chat", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/chat$/);
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toHaveCount(0);
});

test("notifications and profile actions stay local and honest", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: /Notifications, 2 unread/ }).click();
  await page.getByRole("menuitem", { name: "Mark all read locally" }).click();
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open demo profile menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out preview" }).click();
  await expect(page.getByText(/There is no authenticated session to sign out of/)).toBeVisible();
  await expect(page.getByText("Nothing persisted · 0 credits changed")).toBeVisible();
});

test("chat composer validates attachments locally and never calls a model", async ({ page }) => {
  await page.goto("/app/chat");
  await page.getByRole("button", { name: "Turn a rough idea into a practical creative brief" }).click();
  await expect(page.getByLabel("Message Orindle demo chat")).toHaveValue("Turn a rough idea into a practical creative brief");
  await page.locator("#chat-attachments").setInputFiles({ name: "brief.txt", mimeType: "text/plain", buffer: Buffer.from("local only") });
  await expect(page.getByText("brief.txt")).toBeVisible();
  await page.getByRole("button", { name: "Preview message" }).click();
  await expect(page.getByText(/No model was called, no stream started/)).toBeVisible();
  await expect(page.getByText(/1 selected file was not uploaded/)).toBeVisible();
});

test("chat conversations render safe markdown and expose streaming and error controls", async ({ page }) => {
  await page.goto("/app/chat/conv-campaign");
  await expect(page.getByRole("heading", { name: "Creative direction" })).toBeVisible();
  await expect(page.getByText(/This tag remains text in the safe fixture renderer/)).toBeVisible();
  expect(await page.locator("em").count()).toBe(0);
  await page.goto("/app/chat?state=streaming");
  await expect(page.getByTestId("streaming-fixture")).toBeVisible();
  await page.getByRole("button", { name: "Stop preview" }).click();
  await expect(page.getByText(/No active request or server job was cancelled/)).toBeVisible();
  await page.goto("/app/chat?state=error");
  await page.getByRole("button", { name: "Dismiss error fixture" }).click();
  await expect(page.getByText(/No network retry occurred/)).toBeVisible();
});

test("image controls update estimates, previews and no-operation feedback", async ({ page }) => {
  await page.goto("/app/image-studio");
  const initialEstimate = await page.getByText(/Illustrative estimate/).locator("..").innerText();
  await page.getByLabel("Resolution").selectOption("4k");
  await page.getByLabel("Number of images").selectOption("4");
  const updatedEstimate = await page.getByText(/Illustrative estimate/).locator("..").innerText();
  expect(updatedEstimate).not.toBe(initialEstimate);
  await page.getByRole("button", { name: "Preview generation" }).click();
  await expect(page.getByText(/No generation job, output, upload or credit deduction/)).toBeVisible();
  await page.getByRole("button", { name: /Open full-screen preview of Sage bottle studio/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByText(/not a private upload or production generation/)).toBeVisible();
  await page.getByRole("button", { name: "Close preview" }).click();
  await page.getByRole("button", { name: "Variation" }).first().click();
  await expect(page.getByLabel("Prompt", { exact: true })).toHaveValue(/composition variation/);
});

test("video modes, static jobs and retries never create playback or queue activity", async ({ page }) => {
  await page.goto("/app/video-studio");
  await expect(page.locator("progress")).toHaveAttribute("value", "62");
  await page.getByText("Image to video", { exact: true }).click();
  await page.getByRole("button", { name: "Preview video job" }).click();
  await expect(page.getByText("Choose a local reference file name for image-to-video mode.")).toBeVisible();
  await page.locator("#video-reference").setInputFiles({ name: "frame.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not-read") });
  await page.getByRole("button", { name: "Preview video job" }).click();
  await expect(page.getByText(/No job entered a queue, no reference was uploaded/)).toBeVisible();
  await page.getByRole("button", { name: "Retry Bottle orbit experiment" }).click();
  await expect(page.getByText(/The failed fixture remains unchanged/)).toBeVisible();
  await expect(page.getByText("Playback unavailable", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Playback unavailable; no video file" })).toBeDisabled();
});

test("website creation validates a brief without creating a project", async ({ page }) => {
  await page.goto("/app/websites/new");
  await expect(page.getByText("Illustrative estimate", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preview website creation" }).click();
  await expect(page.getByText(/No project, generated code, preview URL, deployment or credit deduction/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore existing editor fixture/ })).toBeVisible();
});

test("website editor separates structured fields, code text and publishing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/websites/site-stillwater/editor");
  await page.getByLabel("Hero headline").fill("A local editorial headline");
  await expect(page.locator("#preview").getByText("A local editorial headline")).toBeVisible();
  await page.getByRole("button", { name: "Mobile preview" }).click();
  await expect(page.locator('[data-viewport="mobile"]')).toBeVisible();
  await expect.poll(() => page.locator('[data-viewport="mobile"]').evaluate((element) => getComputedStyle(element).maxWidth)).toBe("390px");
  await page.getByRole("tab", { name: "Code" }).click();
  await page.getByLabel("HTML draft").fill("<script>window.__shouldNotRun = true</script>");
  expect(await page.evaluate(() => "__shouldNotRun" in window)).toBe(false);
  await expect(page.locator("#preview").getByText("A local editorial headline")).toBeVisible();
  await page.getByRole("tab", { name: "AI edit" }).click();
  await page.getByRole("button", { name: "Preview AI edit" }).click();
  await expect(page.getByText(/No AI edit was generated or applied/)).toBeVisible();
  await page.getByRole("button", { name: "Publish preview" }).click();
  await expect(page.getByText(/No deployment started, no published output changed/)).toBeVisible();
});

test("website settings validates slugs without saving", async ({ page }) => {
  await page.goto("/app/websites/site-stillwater/settings");
  await page.getByLabel("Local URL slug").fill("Invalid Slug!");
  await page.getByRole("button", { name: "Save settings preview" }).click();
  await expect(page.getByText(/Use lowercase letters, numbers and single hyphens/)).toBeVisible();
  await page.getByLabel("Local URL slug").fill("stillwater-local");
  await page.getByRole("button", { name: "Save settings preview" }).click();
  await expect(page.getByText(/No name, slug, SEO field, visibility setting or project record was saved/)).toBeVisible();
});

test("projects expose related records and CRUD confirmations without mutation", async ({ page }) => {
  await page.goto("/app/projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill("Local campaign");
  await page.getByRole("button", { name: "Validate project" }).click();
  await expect(page.getByText(/No project was created or added/)).toBeVisible();
  await page.getByRole("button", { name: "Details" }).first().click();
  await expect(page.getByText("Related generations")).toBeVisible();
  await page.getByRole("button", { name: "Rename" }).first().click();
  await page.getByLabel("Rename Spring product launch").fill("Locally renamed");
  await page.getByRole("button", { name: "Validate name" }).click();
  await expect(page.getByText(/remains unchanged and nothing was saved/)).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Validate delete" }).click();
  await expect(page.getByText(/The project and its related generations remain unchanged/)).toBeVisible();
});

test("library filters, previews and deletion confirmations preserve fixtures", async ({ page }) => {
  await page.goto("/app/library");
  await page.getByLabel("Search library").fill("ceramic");
  await expect(page.getByRole("heading", { name: "Ceramic material study" })).toBeVisible();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close preview" }).click();
  await page.getByLabel("Search library").fill("");
  await page.getByRole("button", { name: /Documents/ }).click();
  await page.getByRole("button", { name: "Download" }).click();
  await expect(page.getByText(/This fixture has no production file attached/)).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Validate delete" }).click();
  await expect(page.getByText(/The asset remains in this fixture library/)).toBeVisible();
});

test("history filters products and statuses across the shared records", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app/history");
  await page.getByLabel("Filter history by product").selectOption("video");
  await page.getByLabel("Filter history by status").selectOption("failed");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Bottle orbit experiment");
  await expect(page.locator("tbody")).toContainText("Google");
  await expect(page.locator("tbody")).toContainText("Failed");
});

test("wallet packs and ledger never imply a real payment", async ({ page }) => {
  await page.goto("/app/credits");
  await expect(page.getByText(/\$49/)).toBeVisible();
  await expect(page.getByText("4,900 credits", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Preview Pro purchase" }).click();
  await expect(page.getByText(/No checkout opened, no payment was taken, no credits were added/)).toBeVisible();
  await page.goto("/app/credits/history");
  await expect(page.getByText("Mock ledger — no real payments")).toBeVisible();
  await expect(page.getByText(/No checkout occurred, no payment succeeded/)).toBeVisible();
  await page.getByLabel("Filter transaction type").selectOption("usage");
  await expect(page.getByText("Creator credit pack")).toHaveCount(0);
});

test("settings deletion and support search keep account actions honest", async ({ page }) => {
  await page.goto("/app/settings");
  await page.getByRole("button", { name: "Deletion request" }).click();
  await page.getByLabel(/Type DELETE/).fill("NOT DELETE");
  await page.getByRole("button", { name: "Validate deletion request" }).click();
  await expect(page.getByText("Type DELETE exactly to validate the deletion-request design.")).toBeVisible();
  await page.getByLabel(/Type DELETE/).fill("DELETE");
  await page.getByRole("button", { name: "Validate deletion request" }).click();
  await expect(page.getByText(/No request was submitted, no account exists/)).toBeVisible();
  await page.goto("/app/support");
  await page.getByLabel("Search help and support").fill("zzzz-no-results");
  await expect(page.getByRole("heading", { name: "No product guides match" })).toBeVisible();
  await page.getByRole("button", { name: "Clear help search" }).click();
  await expect(page.getByRole("heading", { name: "Chat and creative briefs" })).toBeVisible();
});

for (const width of [320, 390, 1440]) {
  test(`workspace routes have no page-level overflow at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of workspaceRoutes) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${route} overflows at ${width}px`).toBe(false);
    }
  });
}

for (const route of workspaceRoutes) {
  test(`axe workspace review: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
}
