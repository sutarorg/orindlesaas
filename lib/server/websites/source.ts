import { createHash } from "node:crypto";
import { z } from "zod";
import { AppError } from "@/lib/server/errors";

const fileSchema = z.object({
  path: z.enum(["index.html", "styles.css", "script.js"]),
  content: z.string().min(1).max(250_000),
});
export const generatedWebsiteSchema = z.object({
  files: z.array(fileSchema).min(2).max(3),
}).strict();

export type WebsiteSourceFile = z.infer<typeof fileSchema>;

// The HTTP sandbox is the primary isolation boundary. The iframe sandbox and
// source filter are independent layers; none relies on model goodwill.
const websitePreviewResourceCsp = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'self'";
export const websitePreviewCsp = `sandbox allow-scripts; ${websitePreviewResourceCsp}`;
// A direct top-level response must not rely on CSP sandbox alone: Chromium can
// retain the application origin there. Serve only a static shell and put the
// untrusted document inside an actual sandboxed srcDoc iframe instead.
export const websitePreviewShellCsp = `${websitePreviewResourceCsp}; frame-src 'self'`;

export function validateWebsiteSource(value: unknown) {
  const parsed = generatedWebsiteSchema.parse(value);
  const paths = new Set(parsed.files.map((file) => file.path));
  if (!paths.has("index.html") || !paths.has("styles.css") || paths.size !== parsed.files.length) {
    throw new AppError("bad_request", 422, "The generated website must contain unique index.html and styles.css files.");
  }
  const totalBytes = new TextEncoder().encode(JSON.stringify(parsed.files)).byteLength;
  if (totalBytes > 512_000) throw new AppError("payload_too_large", 413, "The generated website source is too large.");
  const html = parsed.files.find((file) => file.path === "index.html")!.content;
  if (/<(?:iframe|object|embed|base|form)\b/i.test(html) || /<meta\b[^>]*http-equiv\s*=\s*["']?refresh\b/i.test(html) || /\son[a-z]+\s*=/i.test(html) || /javascript\s*:/i.test(html)) {
    throw new AppError("bad_request", 422, "The generated HTML contains unsupported active content or navigation.");
  }
  if (/(?:src|srcset|href|action|poster)\s*=\s*["']?\s*(?:https?:|\/\/)/i.test(html)) {
    throw new AppError("bad_request", 422, "Remote source, navigation and form URLs are not allowed in the static recipe.");
  }
  if (/<script\b(?![^>]*\bsrc=["']script\.js["'])[^>]*>/i.test(html) || /<script\b[^>]*>(?!\s*<\/script>)/i.test(html)) {
    throw new AppError("bad_request", 422, "Only the local script.js file is allowed; inline and external scripts are not.");
  }
  for (const file of parsed.files) {
    if (/(?:<\/style|@import\b|url\s*\(\s*["']?\s*(?:https?:|\/\/))/i.test(file.content)) {
      throw new AppError("bad_request", 422, "External style imports, remote resources and style-document boundaries are not allowed.");
    }
    if (/(?:fetch\s*\(|XMLHttpRequest|WebSocket\s*\(|EventSource\s*\(|sendBeacon|eval\s*\(|new\s+Function\b|import\s*\(|document\.cookie|\b(?:localStorage|sessionStorage|indexedDB|serviceWorker)\b)/i.test(file.content)) {
      throw new AppError("bad_request", 422, "The generated website contains unsupported network, storage or dynamic-code behavior.");
    }
    if (/(?:src|href)=["']https?:\/\//i.test(file.content) && /\.(?:js|css)(?:["']|\s)/i.test(file.content)) {
      throw new AppError("bad_request", 422, "External scripts and styles are not allowed in the static recipe.");
    }
  }
  const files = [...parsed.files].sort((a, b) => a.path.localeCompare(b.path));
  return { files, sourceSha256: createHash("sha256").update(JSON.stringify(files)).digest("hex") };
}

export function parseGeneratedWebsite(text: string) {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AppError("bad_request", 422, "The model did not return the required static JSON source.");
  }
  return validateWebsiteSource(value);
}
