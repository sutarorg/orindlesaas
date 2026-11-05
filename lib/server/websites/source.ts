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

export function validateWebsiteSource(value: unknown) {
  const parsed = generatedWebsiteSchema.parse(value);
  const paths = new Set(parsed.files.map((file) => file.path));
  if (!paths.has("index.html") || !paths.has("styles.css") || paths.size !== parsed.files.length) {
    throw new AppError("bad_request", 422, "The generated website must contain unique index.html and styles.css files.");
  }
  const totalBytes = new TextEncoder().encode(JSON.stringify(parsed.files)).byteLength;
  if (totalBytes > 512_000) throw new AppError("payload_too_large", 413, "The generated website source is too large.");
  const html = parsed.files.find((file) => file.path === "index.html")!.content;
  if (/<(?:iframe|object|embed|base)\b/i.test(html) || /\son[a-z]+\s*=/i.test(html) || /javascript\s*:/i.test(html)) {
    throw new AppError("bad_request", 422, "The generated HTML contains unsupported active content.");
  }
  if (/<script\b(?![^>]*\bsrc=["']script\.js["'])[^>]*>/i.test(html) || /<script\b[^>]*>(?!\s*<\/script>)/i.test(html)) {
    throw new AppError("bad_request", 422, "Only the local script.js file is allowed; inline and external scripts are not.");
  }
  for (const file of parsed.files) {
    if (/(?:<\/style|@import\b|url\s*\(\s*["']?https?:\/\/)/i.test(file.content)) {
      throw new AppError("bad_request", 422, "External style imports and style-document boundaries are not allowed.");
    }
    if (/(?:fetch\s*\(|XMLHttpRequest|WebSocket\s*\(|sendBeacon|eval\s*\(|new\s+Function\b|document\.cookie)/i.test(file.content)) {
      throw new AppError("bad_request", 422, "The generated website contains unsupported network or dynamic-code behavior.");
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
