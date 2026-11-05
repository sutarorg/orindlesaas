import { createHash } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { requireEnvironment } from "@/lib/server/env";
import { getDb } from "@/lib/server/db/client";
import { assets } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";

const MAX_ASSET_BYTES = 100 * 1024 * 1024;

function r2Config() {
  return requireEnvironment(["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"], "Cloudflare R2");
}

export function getR2Client() {
  const config = r2Config();
  return {
    bucket: config.R2_BUCKET,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    }),
  };
}

export function createOwnedObjectKey(userId: string, assetId: string, kind: string, extension: string) {
  const safeExtension = /^[a-z0-9]{1,8}$/.test(extension) ? extension : "bin";
  return `users/${userId}/${kind}/${assetId}.${safeExtension}`;
}

export function assertOwnedObjectKey(userId: string, key: string) {
  if (!key.startsWith(`users/${userId}/`) || key.includes("..") || key.includes("\\") || key.length > 600) {
    throw new AppError("forbidden", 403, "The asset does not belong to this account.");
  }
}

async function readBoundedObjectBody(body: NonNullable<GetObjectCommandOutput["Body"]>, maximumBytes: number) {
  const reader = body.transformToWebStream().getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel().catch(() => undefined);
      throw new AppError("conflict", 409, "The stored asset size does not match its record.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function storeGeneratedAsset(input: {
  userId: string;
  jobId?: string;
  kind: "image" | "video" | "website_source" | "website_build";
  bytes: Uint8Array;
  mimeType: string;
  extension: string;
}) {
  if (input.bytes.byteLength > MAX_ASSET_BYTES) throw new AppError("payload_too_large", 413, "The generated asset is too large.");
  const { client, bucket } = getR2Client();
  const assetId = crypto.randomUUID();
  const objectKey = createOwnedObjectKey(input.userId, assetId, input.kind, input.extension);
  const sha256 = createHash("sha256").update(input.bytes).digest("hex");
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: input.bytes,
    ContentType: input.mimeType,
    ContentLength: input.bytes.byteLength,
    ChecksumSHA256: Buffer.from(sha256, "hex").toString("base64"),
    Metadata: { owner: input.userId, job: input.jobId ?? "none" },
  }));
  const [asset] = await getDb().insert(assets).values({
    id: assetId,
    userId: input.userId,
    jobId: input.jobId,
    kind: input.kind,
    bucket,
    objectKey,
    fileName: `${input.kind}.${input.extension}`,
    mimeType: input.mimeType,
    sizeBytes: input.bytes.byteLength,
    sha256,
    status: "ready",
  }).returning();
  if (!asset) throw new Error("Asset insert returned no row.");
  return asset;
}

export async function createAssetDownload(userId: string, assetId: string) {
  const [asset] = await getDb().select().from(assets).where(
    and(eq(assets.id, assetId), eq(assets.userId, userId), eq(assets.status, "ready")),
  ).limit(1);
  if (!asset) throw new AppError("not_found", 404, "The asset was not found.");
  assertOwnedObjectKey(userId, asset.objectKey);
  const { client, bucket } = getR2Client();
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: asset.objectKey }), { expiresIn: 300 });
  return { asset: { id: asset.id, kind: asset.kind, fileName: asset.fileName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes }, url, expiresIn: 300 };
}

export async function readOwnedAssetBytes(userId: string, assetId: string) {
  const [asset] = await getDb().select().from(assets).where(
    and(eq(assets.id, assetId), eq(assets.userId, userId), eq(assets.status, "ready")),
  ).limit(1);
  if (!asset) throw new AppError("not_found", 404, "The asset was not found.");
  assertOwnedObjectKey(userId, asset.objectKey);
  const { client, bucket } = getR2Client();
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: asset.objectKey }));
  if (!object.Body) throw new Error("Stored asset has no body.");
  if (object.ContentLength !== undefined && (object.ContentLength !== asset.sizeBytes || object.ContentLength > MAX_ASSET_BYTES)) {
    throw new AppError("conflict", 409, "The stored asset size does not match its record.");
  }
  const bytes = await readBoundedObjectBody(object.Body, Math.min(asset.sizeBytes, MAX_ASSET_BYTES));
  if (bytes.byteLength !== asset.sizeBytes || bytes.byteLength > MAX_ASSET_BYTES) {
    throw new AppError("conflict", 409, "The stored asset size does not match its record.");
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (asset.sha256 && asset.sha256 !== sha256) throw new AppError("conflict", 409, "The stored asset checksum does not match.");
  return { asset, bytes };
}

export async function completeUploadedAsset(userId: string, assetId: string) {
  const [asset] = await getDb().select().from(assets).where(
    and(eq(assets.id, assetId), eq(assets.userId, userId), eq(assets.status, "pending")),
  ).for("update").limit(1);
  if (!asset) throw new AppError("not_found", 404, "The pending upload was not found.");
  assertOwnedObjectKey(userId, asset.objectKey);
  const { client, bucket } = getR2Client();
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: asset.objectKey, ChecksumMode: "ENABLED" }));
  const expectedChecksum = asset.sha256 ? Buffer.from(asset.sha256, "hex").toString("base64") : null;
  if (head.ContentLength !== asset.sizeBytes || (expectedChecksum && head.ChecksumSHA256 !== expectedChecksum)) {
    throw new AppError("conflict", 409, "The uploaded bytes do not match the registered asset.");
  }
  const [updated] = await getDb().update(assets).set({ status: "ready", updatedAt: new Date() }).where(eq(assets.id, asset.id)).returning();
  return updated;
}
