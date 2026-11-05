import { expect, test, type Frame, type Page } from "@playwright/test";
import { websitePreviewDocument, websitePreviewShellDocument } from "@/lib/server/websites/projects";
import { websitePreviewShellCsp, type WebsiteSourceFile } from "@/lib/server/websites/source";

const previewUrl = "https://orindle.test/api/v1/websites/00000000-0000-4000-8000-000000000401/preview";
const files: WebsiteSourceFile[] = [
  { path: "index.html", content: "<!doctype html><html><head><link rel=\"stylesheet\" href=\"styles.css\"></head><body><h1>Isolation fixture</h1><pre id=\"result\">pending</pre><script src=\"script.js\"></script></body></html>" },
  { path: "styles.css", content: "body { font-family: sans-serif; }" },
  {
    path: "script.js",
    content: `
      const outcome = { origin: window.location.origin, cookie: "unread", storage: "untested", network: "pending" };
      try { outcome.cookie = document["coo" + "kie"] || "empty"; } catch (error) { outcome.cookie = error.name; }
      try { window["local" + "Storage"].setItem("qa", "sentinel"); outcome.storage = "write succeeded"; } catch (error) { outcome.storage = error.name; }
      const image = document.createElement("img");
      image.src = "https://orindle.test/pixel-sentinel";
      document.body.appendChild(image);
      window["fe" + "tch"]("/api/v1/workspace")
        .then(() => { outcome.network = "fulfilled"; })
        .catch(() => { outcome.network = "blocked"; })
        .finally(() => {
          document.querySelector("#result").textContent = JSON.stringify(outcome);
          document.body.dataset.done = "true";
        });
    `,
  },
];
const documentBody = websitePreviewDocument(files);
const shellBody = websitePreviewShellDocument(files);
const escapedDocumentBody = documentBody.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function outcome(page: Page | Frame) {
  await expect(page.locator("body")).toHaveAttribute("data-done", "true");
  const text = await page.locator("#result").textContent();
  return JSON.parse(text ?? "{}") as { origin: string; cookie: string; storage: string; network: string };
}

function expectIsolated(result: { origin: string; cookie: string; storage: string; network: string }, requests: string[]) {
  expect(result.origin).toBe("null");
  expect(result.cookie).not.toContain("qa_session=sentinel");
  expect(result.storage).not.toBe("write succeeded");
  expect(result.network).toBe("blocked");
  expect(requests.filter((url) => url.includes("pixel-sentinel") || url.includes("/api/v1/workspace"))).toEqual([]);
}

test("direct preview response enforces an opaque origin and blocks cookie, storage and network access", async ({ page, context }) => {
  await context.addCookies([{ name: "qa_session", value: "sentinel", domain: "orindle.test", path: "/", secure: true }]);
  const requests: string[] = [];
  await page.route("https://orindle.test/**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/html", headers: { "Content-Security-Policy": websitePreviewShellCsp }, body: shellBody });
  });
  await page.goto(previewUrl);
  const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
  expect(frame).toBeDefined();
  expectIsolated(await outcome(frame!), requests);
});

test("embedded srcDoc preview remains isolated even with an obfuscated sentinel script", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://orindle.test/**", (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.setContent(`<iframe title="Isolation fixture" sandbox="allow-scripts" srcdoc="${escapedDocumentBody}"></iframe>`);
  const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
  expect(frame).toBeDefined();
  await expect(frame!.locator("body")).toHaveAttribute("data-done", "true");
  const text = await frame!.locator("#result").textContent();
  expectIsolated(JSON.parse(text ?? "{}"), requests);
});
