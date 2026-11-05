import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { deployments, outboxEvents, websiteBuilds, websiteProjects } from "@/lib/server/db/schema";
import { AppError, integrationUnavailable } from "@/lib/server/errors";
import { requireEnvironment } from "@/lib/server/env";
import { readOwnedAssetBytes } from "@/lib/server/storage/r2";
import { validateWebsiteSource } from "@/lib/server/websites/source";

export const deploymentRequestSchema = z.object({ idempotencyKey: z.string().min(12).max(128).regex(/^[A-Za-z0-9:_-]+$/) }).strict();

function deploymentConfig() {
  const env = requireEnvironment(["VERCEL_API_TOKEN", "VERCEL_TEAM_ID", "VERCEL_PROJECT_PREFIX", "VERCEL_DEPLOY_TARGET"], "Vercel preview deployment");
  if (env.VERCEL_DEPLOY_TARGET !== "preview") throw integrationUnavailable("Preview-only Vercel deployment policy");
  return env;
}

function safeProjectName(slug: string, prefix: string) {
  const value = `${prefix}-${slug}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 52);
  if (value.length < 3) throw new AppError("bad_request", 422, "The deployment project name is invalid.");
  return value;
}

function providerStatus(value: unknown): "queued" | "building" | "ready" | "error" | "cancelled" {
  const status = String(value ?? "").toUpperCase();
  if (status === "READY") return "ready";
  if (["ERROR", "FAILED"].includes(status)) return "error";
  if (status === "CANCELED" || status === "CANCELLED") return "cancelled";
  if (["BUILDING", "DEPLOYING", "INITIALIZING"].includes(status)) return "building";
  return "queued";
}

function safeDeploymentUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") || url.username || url.password) throw new Error("Vercel returned an invalid deployment URL.");
  return url.origin;
}

async function vercelRequest(path: string, init?: RequestInit) {
  const env = deploymentConfig();
  const response = await fetch(`https://api.vercel.com${path}${path.includes("?") ? "&" : "?"}teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.VERCEL_API_TOKEN}`, "Content-Type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(20_000),
    redirect: "error",
    cache: "no-store",
  });
  const text = await response.text();
  if (text.length > 1_000_000) throw new Error("Vercel response exceeded the bounded size.");
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Vercel request failed with status ${response.status}.`);
  return body as Record<string, unknown>;
}

export async function queueDeployment(userId: string, projectId: string, rawInput: unknown) {
  deploymentConfig();
  const input = deploymentRequestSchema.parse(rawInput);
  const [project] = await getDb().select().from(websiteProjects).where(and(eq(websiteProjects.id, projectId), eq(websiteProjects.userId, userId))).limit(1);
  if (!project?.sourceAssetId) throw new AppError("not_found", 404, "The website project was not found.");
  const { bytes } = await readOwnedAssetBytes(userId, project.sourceAssetId);
  const source = validateWebsiteSource(JSON.parse(new TextDecoder().decode(bytes)));
  const [passed] = await getDb().select({ id: websiteBuilds.id }).from(websiteBuilds).where(and(eq(websiteBuilds.projectId, projectId), eq(websiteBuilds.sourceSha256, source.sourceSha256), eq(websiteBuilds.status, "passed"))).orderBy(desc(websiteBuilds.createdAt)).limit(1);
  if (!passed) throw new AppError("conflict", 409, "The current source must pass isolated validation before deployment.");
  const [latest] = await getDb().select({ status: deployments.status, providerDeploymentId: deployments.providerDeploymentId }).from(deployments).where(eq(deployments.projectId, projectId)).orderBy(desc(deployments.createdAt)).limit(1);
  if (latest?.status === "error" && !latest.providerDeploymentId) throw new AppError("conflict", 409, "The last deployment acceptance is uncertain and requires review before another create.");
  const deploymentId = crypto.randomUUID();
  const providerProjectId = safeProjectName(project.slug, deploymentConfig().VERCEL_PROJECT_PREFIX);
  return getDb().transaction(async (tx) => {
    const [inserted] = await tx.insert(deployments).values({ id: deploymentId, projectId, buildId: passed.id, providerProjectId, target: "preview", status: "queued", idempotencyKey: input.idempotencyKey }).onConflictDoNothing().returning();
    if (!inserted) {
      const [existing] = await tx.select().from(deployments).where(and(eq(deployments.projectId, projectId), eq(deployments.idempotencyKey, input.idempotencyKey))).limit(1);
      if (!existing || existing.buildId !== passed.id || existing.target !== "preview") throw new AppError("conflict", 409, "This deployment key was already used for a different source or target.");
      return { deploymentId: existing.id, status: existing.status, duplicate: true };
    }
    await tx.insert(outboxEvents).values({ eventKey: `deployment:${deploymentId}`, eventName: "orindle/deployment.requested", payload: { deploymentId, userId } });
    await tx.update(websiteProjects).set({ status: "deploying", updatedAt: new Date() }).where(eq(websiteProjects.id, projectId));
    return { deploymentId, status: "queued" as const, duplicate: false };
  });
}

export async function submitDeployment(deploymentId: string) {
  const [deployment] = await getDb().select().from(deployments).where(eq(deployments.id, deploymentId)).limit(1);
  if (!deployment) throw new AppError("not_found", 404, "The deployment was not found.");
  if (deployment.providerDeploymentId) return pollDeployment(deploymentId);
  if (deployment.status !== "queued") return { status: deployment.status, uncertain: !deployment.providerDeploymentId };
  const [project] = await getDb().select().from(websiteProjects).where(eq(websiteProjects.id, deployment.projectId)).limit(1);
  if (!project?.sourceAssetId) throw new AppError("not_found", 404, "The deployment project is missing.");
  const [build] = await getDb().select().from(websiteBuilds).where(and(eq(websiteBuilds.id, deployment.buildId), eq(websiteBuilds.status, "passed"))).limit(1);
  if (!build) throw new AppError("conflict", 409, "The deployment build is not eligible.");
  const { bytes } = await readOwnedAssetBytes(project.userId, project.sourceAssetId);
  const source = validateWebsiteSource(JSON.parse(new TextDecoder().decode(bytes)));
  if (source.sourceSha256 !== build.sourceSha256) throw new AppError("conflict", 409, "The current source no longer matches the validated build.");
  const [claimed] = await getDb().update(deployments).set({ status: "building", updatedAt: new Date() }).where(and(eq(deployments.id, deploymentId), eq(deployments.status, "queued"), eq(deployments.target, "preview"))).returning();
  if (!claimed) return { status: "uncertain" as const };
  try {
    const body = await vercelRequest("/v13/deployments", { method: "POST", body: JSON.stringify({ name: deployment.providerProjectId, target: "preview", files: source.files.map((file) => ({ file: file.path, data: file.content })), projectSettings: { framework: null, buildCommand: null, installCommand: null, outputDirectory: null } }) });
    const providerDeploymentId = typeof body.id === "string" ? body.id : null;
    if (!providerDeploymentId) throw new Error("Vercel response omitted the deployment ID.");
    const status = providerStatus(body.status ?? body.readyState);
    const url = status === "ready" ? safeDeploymentUrl(body.url) : null;
    const providerProjectId = typeof body.projectId === "string" ? body.projectId : deployment.providerProjectId;
    await getDb().transaction(async (tx) => {
      await tx.update(deployments).set({ providerDeploymentId, providerProjectId, status, url, updatedAt: new Date() }).where(eq(deployments.id, deploymentId));
      await tx.update(websiteProjects).set({ vercelProjectId: providerProjectId, status: status === "ready" ? "published" : status === "error" ? "failed" : "deploying", updatedAt: new Date() }).where(eq(websiteProjects.id, project.id));
    });
    return { status, providerDeploymentId, url };
  } catch (error) {
    await getDb().update(deployments).set({ status: "error", updatedAt: new Date() }).where(and(eq(deployments.id, deploymentId), eq(deployments.status, "building"), isNull(deployments.providerDeploymentId)));
    return { status: "error" as const, uncertain: true, error: error instanceof Error ? error.name : "DeploymentError" };
  }
}

export async function pollDeployment(deploymentId: string) {
  const [deployment] = await getDb().select().from(deployments).where(eq(deployments.id, deploymentId)).limit(1);
  if (!deployment?.providerDeploymentId) return { status: deployment?.status ?? "missing", uncertain: true };
  if (["ready", "error", "cancelled"].includes(deployment.status)) return { status: deployment.status, url: deployment.url };
  const body = await vercelRequest(`/v13/deployments/${encodeURIComponent(deployment.providerDeploymentId)}`);
  const status = providerStatus(body.status ?? body.readyState);
  const url = status === "ready" ? safeDeploymentUrl(body.url) : null;
  await getDb().transaction(async (tx) => {
    await tx.update(deployments).set({ status, url, updatedAt: new Date() }).where(eq(deployments.id, deploymentId));
    await tx.update(websiteProjects).set({ status: status === "ready" ? "published" : status === "error" || status === "cancelled" ? "failed" : "deploying", updatedAt: new Date() }).where(eq(websiteProjects.id, deployment.projectId));
  });
  return { status, url };
}
