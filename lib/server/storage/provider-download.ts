import { AppError } from "@/lib/server/errors";
import { readServerEnvironment } from "@/lib/server/env";

const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

export async function downloadProviderFile(value: string) {
  const url = new URL(value);
  const allowed = new Set((readServerEnvironment().AI_ALLOWED_ASSET_HOSTS ?? "").split(",").map((host) => host.trim()).filter(Boolean));
  if (url.protocol !== "https:" || url.username || url.password || !allowed.has(url.hostname)) {
    throw new AppError("forbidden", 403, "The provider asset host is not on the server allowlist.");
  }
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error("Provider asset download failed.");
  const declared = Number(response.headers.get("Content-Length") ?? 0);
  if (declared > MAX_DOWNLOAD_BYTES || !response.body) throw new AppError("payload_too_large", 413, "The provider asset is too large.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    size += chunk.byteLength;
    if (size > MAX_DOWNLOAD_BYTES) {
      await reader.cancel();
      throw new AppError("payload_too_large", 413, "The provider asset is too large.");
    }
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { bytes, mimeType: response.headers.get("Content-Type")?.split(";", 1)[0] ?? "application/octet-stream" };
}
