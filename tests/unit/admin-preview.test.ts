import { describe, expect, it } from "vitest";
import type { AdminPreviewResult, AdminService } from "@/lib/contracts/admin";
import { adminCreditPackages, adminFixture, adminUsers } from "@/lib/admin/fixtures";
import { MockAdminAdapter } from "@/lib/mocks/admin-preview";

const service: AdminService = new MockAdminAdapter(0);
const reason = "Documented fixture-only administrative validation";

function expectNoOperation(result: AdminPreviewResult) {
  expect(result.status).toBe("preview");
  expect(result.persisted).toBe(false);
  expect(result.auditPersisted).toBe(false);
  expect(result.paymentChanged).toBe(false);
  expect(result.creditsChanged).toBe(0);
  expect(result.message).toMatch(/No |no /);
  expect(result).not.toHaveProperty("session");
  expect(result).not.toHaveProperty("payment");
  expect(result).not.toHaveProperty("balance");
  expect(result).not.toHaveProperty("job");
}

describe("admin no-operation preview adapter", () => {
  it("never mutates users, providers, models, prices or packages", async () => {
    const before = JSON.stringify(adminFixture);
    const results = await Promise.all([
      service.updateUserStatus({ userId: "usr_demo_001", status: "suspended", reason, confirmed: true }),
      service.invalidateUserSessions({ userId: "usr_demo_001", reason, confirmed: true }),
      service.configureProvider({ providerId: "provider_openai", enabled: false, reason, confirmed: true }),
      service.configureModel({ modelId: "gpt-6.1-sol", enabled: false, products: ["chat"], reason, confirmed: true }),
      service.updateModelPricing({ modelId: "gpt-6.1-sol", providerCostCentsPerUnit: 200, customerCreditsPerUnit: 400, effectiveAt: "2026-11-06T00:00:00.000Z", reason, confirmed: true }),
      service.updateCreditPackage({ packageId: "pro", priceCents: 4900, credits: 4900, enabled: true, reason, confirmed: true }),
    ]);
    results.forEach(expectNoOperation);
    expect(JSON.stringify(adminFixture)).toBe(before);
    expect(adminUsers[0]?.status).toBe("active");
    expect(adminCreditPackages[1]?.priceCents).toBe(4900);
  });

  it("never reconciles payments, disputes, retries or settings", async () => {
    const before = JSON.stringify(adminFixture);
    const results = await Promise.all([
      service.reconcilePayment({ paymentId: "pay_demo_004", reason, confirmed: true }),
      service.reviewDispute({ disputeId: "dispute_demo_002", status: "under-review", reason, confirmed: true }),
      service.retryJob({ jobId: "job_demo_002", reason, confirmed: true }),
      service.updatePreferences({ defaultRange: "7d", density: "compact", notifications: false, reason, confirmed: true }),
    ]);
    results.forEach(expectNoOperation);
    expect(JSON.stringify(adminFixture)).toBe(before);
  });

  it("returns a complete but ephemeral credit-adjustment audit preview", async () => {
    const balanceBefore = adminUsers[0]?.creditBalance;
    const result = await service.adjustCredits({ userId: "usr_demo_001", credits: -250, category: "correction", reference: "SUP-DEMO-TEST", reason, confirmed: true });
    expectNoOperation(result);
    expect(result.auditPreview).toMatchObject({
      actorLabel: "Demo admin",
      action: "credit.adjustment.preview",
      targetType: "user",
      targetId: "usr_demo_001",
      reason,
      reference: "SUP-DEMO-TEST",
      summary: "-250 credits · correction",
      persisted: false,
    });
    expect(Number.isNaN(new Date(result.auditPreview?.createdAt ?? "").getTime())).toBe(false);
    expect(adminUsers[0]?.creditBalance).toBe(balanceBefore);
    expect(JSON.stringify(adminFixture)).not.toContain("SUP-DEMO-TEST");
  });
});
