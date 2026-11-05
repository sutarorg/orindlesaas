import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { deployments, generationJobs, outboxEvents, websiteBuilds, websiteProjects } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { readOwnedAssetBytes, storeGeneratedAsset } from "@/lib/server/storage/r2";
import { validateWebsiteSource, websitePreviewCsp, type WebsiteSourceFile } from "@/lib/server/websites/source";

export async function getOwnedWebsite(userId: string, projectId: string) {
  const [project] = await getDb().select().from(websiteProjects).where(and(eq(websiteProjects.id, projectId), eq(websiteProjects.userId, userId))).limit(1);
  if (!project) throw new AppError("not_found", 404, "The website project was not found.");
  const [builds, deploymentRows] = await Promise.all([
    getDb().select().from(websiteBuilds).where(eq(websiteBuilds.projectId, projectId)).orderBy(desc(websiteBuilds.createdAt)).limit(10),
    getDb().select({ id: deployments.id, target: deployments.target, status: deployments.status, url: deployments.url, createdAt: deployments.createdAt }).from(deployments).where(eq(deployments.projectId, projectId)).orderBy(desc(deployments.createdAt)).limit(10),
  ]);
  let files: WebsiteSourceFile[] = [];
  if (project.sourceAssetId) {
    const { bytes } = await readOwnedAssetBytes(userId, project.sourceAssetId);
    files = validateWebsiteSource(JSON.parse(new TextDecoder().decode(bytes))).files;
  }
  const currentSourceSha256 = files.length ? validateWebsiteSource({ files }).sourceSha256 : null;
  // These objects cross both the JSON API and the RSC/client boundary. Map
  // explicitly so future provider/internal columns cannot become public DTOs.
  return {
    project: { id: project.id, name: project.name, slug: project.slug, status: project.status, createdAt: project.createdAt, updatedAt: project.updatedAt },
    builds: builds.map((build) => ({ id: build.id, status: build.status, sourceSha256: build.sourceSha256, createdAt: build.createdAt })),
    deployments: deploymentRows.map((deployment) => ({ id: deployment.id, target: deployment.target, status: deployment.status, url: deployment.url, createdAt: deployment.createdAt })),
    files,
    currentSourceSha256,
  };
}

export type OwnedWebsite = Awaited<ReturnType<typeof getOwnedWebsite>>;

export async function updateWebsiteSource(userId: string, projectId: string, rawFiles: unknown) {
  const source = validateWebsiteSource({ files: rawFiles });
  const [project] = await getDb().select().from(websiteProjects).where(and(eq(websiteProjects.id, projectId), eq(websiteProjects.userId, userId))).limit(1);
  if (!project?.generationJobId) throw new AppError("not_found", 404, "The website project was not found.");
  const [job] = await getDb().select({ status: generationJobs.status }).from(generationJobs).where(eq(generationJobs.id, project.generationJobId)).limit(1);
  if (job?.status !== "succeeded") throw new AppError("conflict", 409, "The original generation must be reconciled before editing this source.");
  const asset = await storeGeneratedAsset({ userId, jobId: project.generationJobId, kind: "website_source", bytes: new TextEncoder().encode(JSON.stringify({ files: source.files })), mimeType: "application/json", extension: "json" });
  const buildId = crypto.randomUUID();
  await getDb().transaction(async (tx) => {
    await tx.update(websiteProjects).set({ sourceAssetId: asset.id, status: "validating", updatedAt: new Date() }).where(eq(websiteProjects.id, projectId));
    await tx.insert(websiteBuilds).values({ id: buildId, projectId, status: "queued", sourceSha256: source.sourceSha256 });
    await tx.insert(outboxEvents).values({ eventKey: `website-validation:${buildId}`, eventName: "orindle/website.validation.requested", payload: { buildId, userId } });
  });
  return { buildId, sourceAssetId: asset.id, sourceSha256: source.sourceSha256 };
}

export async function renameWebsite(userId: string, projectId: string, name: string) {
  const [project] = await getDb().update(websiteProjects).set({ name, updatedAt: new Date() }).where(and(eq(websiteProjects.id, projectId), eq(websiteProjects.userId, userId))).returning({ id: websiteProjects.id, name: websiteProjects.name });
  if (!project) throw new AppError("not_found", 404, "The website project was not found.");
  return project;
}

export function websitePreviewDocument(files: WebsiteSourceFile[]) {
  const source = validateWebsiteSource({ files });
  const html = source.files.find((file) => file.path === "index.html")!.content;
  const css = source.files.find((file) => file.path === "styles.css")!.content;
  const script = source.files.find((file) => file.path === "script.js")?.content ?? "";
  const scriptUrl = `data:text/javascript;base64,${Buffer.from(script).toString("base64")}`;
  const sanitized = html
    .replace(/<link\b[^>]*href=["']styles\.css["'][^>]*>/gi, "")
    .replace(/<script\b[^>]*src=["']script\.js["'][^>]*>\s*<\/script>/gi, "");
  const withStyle = sanitized.includes("</head>") ? sanitized.replace("</head>", `<style>${css}</style></head>`) : `<style>${css}</style>${sanitized}`;
  const withScript = withStyle.includes("</body>") ? withStyle.replace("</body>", `<script src="${scriptUrl}"></script></body>`) : `${withStyle}<script src="${scriptUrl}"></script>`;
  const meta = `<meta http-equiv="Content-Security-Policy" content="${websitePreviewCsp}">`;
  if (/<head(?:\s[^>]*)?>/i.test(withScript)) return withScript.replace(/<head(\s[^>]*)?>/i, `<head$1>${meta}`);
  if (/<html(?:\s[^>]*)?>/i.test(withScript)) return withScript.replace(/<html(\s[^>]*)?>/i, `<html$1><head>${meta}</head>`);
  return `${meta}${withScript}`;
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function websitePreviewShellDocument(files: WebsiteSourceFile[]) {
  const document = escapeHtmlAttribute(websitePreviewDocument(files));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated website preview</title><style>html,body{margin:0;width:100%;height:100%;background:#fff}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe title="Isolated generated website preview" sandbox="allow-scripts" srcdoc="${document}"></iframe></body></html>`;
}
