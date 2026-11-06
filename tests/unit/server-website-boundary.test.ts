import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), readOwnedAssetBytes: vi.fn() }));
vi.mock("@/lib/server/auth/guards", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/server/storage/r2", () => ({ readOwnedAssetBytes: mocks.readOwnedAssetBytes, storeGeneratedAsset: vi.fn() }));
vi.mock("@/lib/server/db/client", () => ({ getDb: () => ({ select: selectFor }) }));

import { GET } from "@/app/api/v1/websites/[projectId]/preview/route";
import { getOwnedWebsite } from "@/lib/server/websites/projects";
import { deployments, websiteBuilds, websiteProjects } from "@/lib/server/db/schema";

const projectId = "00000000-0000-4000-8000-000000000101";
const userId = "00000000-0000-4000-8000-000000000102";
const now = new Date("2026-11-05T00:00:00Z");
const project = {
  id: projectId,
  userId,
  generationJobId: "00000000-0000-4000-8000-000000000103",
  name: "Synthetic site",
  slug: "synthetic-site",
  status: "validated",
  sourceAssetId: "00000000-0000-4000-8000-000000000104",
  vercelProjectId: "prj_restricted_project",
  createdAt: now,
  updatedAt: now,
};
const build = {
  id: "00000000-0000-4000-8000-000000000105",
  projectId,
  sandboxId: "sbx_restricted_sandbox",
  status: "passed",
  sourceSha256: "a".repeat(64),
  outputAssetId: "00000000-0000-4000-8000-000000000106",
  diagnostics: { internal: "restricted diagnostic" },
  createdAt: now,
  updatedAt: now,
};
const deployment = {
  id: "00000000-0000-4000-8000-000000000107",
  projectId,
  buildId: build.id,
  providerDeploymentId: "dpl_restricted_deployment",
  providerProjectId: project.vercelProjectId,
  target: "preview",
  status: "ready",
  url: "https://preview.example",
  idempotencyKey: "restricted-deployment-key",
  createdAt: now,
  updatedAt: now,
};
const files = [
  { path: "index.html", content: "<!doctype html><html><head><link rel=\"stylesheet\" href=\"styles.css\"></head><body><h1>Safe fixture</h1><script src=\"script.js\"></script></body></html>" },
  { path: "styles.css", content: "body { color: black; }" },
  { path: "script.js", content: "document.querySelector('h1').dataset.ready = 'true';" },
];

function selectFor() {
  return {
    from(table: unknown) {
      if (table === websiteProjects) return { where: () => ({ limit: async () => [project] }) };
      if (table === websiteBuilds) return { where: () => ({ orderBy: () => ({ limit: async () => [build] }) }) };
      if (table === deployments) return { where: () => ({ orderBy: () => ({ limit: async () => [deployment] }) }) };
      throw new Error("Unexpected table");
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ userId });
  mocks.readOwnedAssetBytes.mockResolvedValue({ bytes: new TextEncoder().encode(JSON.stringify({ files })) });
});

describe("customer website isolation and redaction", () => {
  it("applies the same opaque-origin, network-denying policy to the direct preview response", async () => {
    const response = await GET(new Request(`https://orindle.com/api/v1/websites/${projectId}/preview`), { params: Promise.resolve({ projectId }) });
    expect(response.status).toBe(200);
    const csp = response.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-src 'self'");
    expect(csp).toContain("img-src data:");
    expect(csp).not.toMatch(/img-src[^;]*https:/i);
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("form-action 'none'");
    const document = await response.text();
    expect(document).toContain("<iframe title=\"Isolated generated website preview\" sandbox=\"allow-scripts\"");
    expect(document).toContain("sandbox allow-scripts");
    expect(document).not.toContain("<h1>Safe fixture</h1>");
    expect(document).not.toContain("img-src data: https:");
  });

  it("returns only display-safe project, build and deployment fields even if rows grow", async () => {
    const result = await getOwnedWebsite(userId, projectId);
    expect(Object.keys(result.project).sort()).toEqual(["createdAt", "id", "name", "slug", "status", "updatedAt"]);
    expect(result.builds).toHaveLength(1);
    expect(Object.keys(result.builds[0]!).sort()).toEqual(["createdAt", "id", "sourceSha256", "status"]);
    expect(result.deployments).toHaveLength(1);
    expect(Object.keys(result.deployments[0]!).sort()).toEqual(["createdAt", "id", "status", "target", "url"]);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("prj_restricted_project");
    expect(serialized).not.toContain("sbx_restricted_sandbox");
    expect(serialized).not.toContain("dpl_restricted_deployment");
    expect(serialized).not.toContain("restricted diagnostic");
    expect(serialized).not.toContain("restricted-deployment-key");
  });
});
