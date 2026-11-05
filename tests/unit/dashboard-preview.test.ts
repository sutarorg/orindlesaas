import { describe, expect, it } from "vitest";
import type { DashboardPreviewResult, DashboardService } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { MockDashboardAdapter } from "@/lib/mocks/dashboard-preview";

const service: DashboardService = new MockDashboardAdapter(0);

function expectNoOperation(result: DashboardPreviewResult) {
  expect(result.persisted).toBe(false);
  expect(result.creditsChanged).toBe(0);
  expect(["preview", "unavailable"]).toContain(result.status);
  expect(result.message).toMatch(/No |no /);
  expect(result).not.toHaveProperty("url");
  expect(result).not.toHaveProperty("session");
  expect(result).not.toHaveProperty("job");
}

describe("dashboard no-operation preview adapter", () => {
  it("covers every generation product without creating output", async () => {
    const before = JSON.stringify(workspaceFixture);
    for (const product of ["chat", "image", "video", "website"] as const) {
      expectNoOperation(await service.generate({ product, modelId: "catalog-fixture", prompt: "A local preview request", options: { mode: "test" } }));
    }
    expect(JSON.stringify(workspaceFixture)).toBe(before);
  });

  it("covers project and asset mutations without changing fixtures", async () => {
    const results = await Promise.all([
      service.saveProject({ name: "Local project", product: "chat" }),
      service.saveProject({ projectId: "project-launch", name: "Local rename", product: "image" }),
      service.deleteProject({ projectId: "project-launch" }),
      service.saveAsset({ assetId: "asset-mint-product" }),
      service.deleteAsset({ assetId: "asset-mint-product" }),
      service.downloadAsset({ assetId: "asset-retreat-video" }),
    ]);
    results.forEach(expectNoOperation);
    expect(workspaceFixture.projects[0]?.name).toBe("Spring product launch");
    expect(workspaceFixture.assets.some((asset) => asset.id === "asset-mint-product")).toBe(true);
  });

  it("never completes checkout, settings or account deletion", async () => {
    const results = await Promise.all([
      service.purchaseCredits({ packId: "creator" }),
      service.purchaseCredits({ packId: "pro" }),
      service.purchaseCredits({ packId: "studio" }),
      service.updateSettings({ section: "profile", values: { name: "Local name" } }),
      service.updateSettings({ section: "connections", values: { provider: "Google" } }),
      service.requestAccountDeletion({ confirmation: "DELETE" }),
    ]);
    results.forEach(expectNoOperation);
    expect(workspaceFixture.wallet.balance).toBe(2450);
  });

  it("keeps website edits and publishing non-persistent", async () => {
    const results = await Promise.all([
      service.saveWebsite({ projectId: "site-stillwater", code: "<main>local</main>", headline: "Local headline" }),
      service.publishWebsite({ projectId: "site-stillwater" }),
    ]);
    results.forEach(expectNoOperation);
    expect(workspaceFixture.websites[0]?.previewHeadline).toBe("A quieter kind of getaway.");
    expect(workspaceFixture.websites[0]?.previewUrl).toBeNull();
  });
});
