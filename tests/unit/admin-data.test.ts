import { describe, expect, it } from "vitest";
import {
  ADMIN_AS_OF,
  adminCreditPackages,
  adminFixture,
  adminJobs,
  adminModelPrices,
  adminModels,
  adminPayments,
  adminProviders,
  adminTransactions,
  adminTrend,
  adminUsageEvents,
  adminUsers,
} from "@/lib/admin/fixtures";
import { formatCredits, formatDuration, formatMoney, matchesAdminQuery, paginate } from "@/lib/admin/format";
import { filterUsageEvents, getAdminOverviewMetrics, getAdminRangeStart, getAdminTrend, getDailyUsage, getUsageBreakdown, getUsageMetrics, isInAdminRange } from "@/lib/admin/metrics";
import { adminNavigationItems, getAdminBreadcrumbs, getAdminPageTitle, isAdminNavigationActive } from "@/lib/admin/navigation";
import { adminRoutePermissions } from "@/lib/admin/permissions";
import { getAdminSearchResults } from "@/lib/admin/search";

const expectedRoutes = [
  "/admin", "/admin/users", "/admin/models", "/admin/providers", "/admin/model-pricing", "/admin/credit-packages",
  "/admin/payments", "/admin/transactions", "/admin/usage", "/admin/jobs", "/admin/websites", "/admin/adjustments", "/admin/settings",
];

function uniqueIds(items: readonly { id: string }[]) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

describe("admin navigation and fixture integrity", () => {
  it("contains exactly the 13 documented destinations and proposed read permissions", () => {
    expect([...adminNavigationItems.map((item) => item.href)].sort()).toEqual([...expectedRoutes].sort());
    expect(new Set(adminNavigationItems.map((item) => item.label)).size).toBe(13);
    expect(Object.keys(adminRoutePermissions).sort()).toEqual([...expectedRoutes].sort());
    expect(isAdminNavigationActive("/admin", "/admin/users")).toBe(false);
    expect(isAdminNavigationActive("/admin/users", "/admin/users/usr_demo_001")).toBe(true);
    expect(getAdminPageTitle("/admin/usage")).toBe("AI Usage & Costs");
    expect(getAdminBreadcrumbs("/admin/jobs")).toEqual([{ label: "Admin", href: "/admin" }, { label: "Generation Jobs", href: null }]);
    expect(getAdminBreadcrumbs("/admin/unknown")[1]?.label).toBe("Not found");
  });

  it("preserves the exact one-time package fixtures", () => {
    expect(adminCreditPackages.map(({ name, priceCents, credits }) => ({ name, priceCents, credits }))).toEqual([
      { name: "Creator", priceCents: 1900, credits: 1900 },
      { name: "Pro", priceCents: 4900, credits: 4900 },
      { name: "Studio", priceCents: 9900, credits: 9900 },
    ]);
    for (const creditPackage of adminCreditPackages) {
      expect(creditPackage.fixture).toBe(true);
      expect(creditPackage.credits).toBe(creditPackage.priceCents);
    }
  });

  it("keeps IDs unique and every operational reference resolvable", () => {
    for (const records of [adminUsers, adminProviders, adminModels, adminModelPrices, adminPayments, adminTransactions, adminUsageEvents, adminJobs]) expect(uniqueIds(records)).toBe(true);
    const userIds = new Set(adminUsers.map((user) => user.id));
    const modelIds = new Set(adminModels.map((model) => model.id));
    const paymentIds = new Set(adminPayments.map((payment) => payment.id));
    const jobIds = new Set(adminJobs.map((job) => job.id));
    for (const payment of adminPayments) expect(userIds.has(payment.userId)).toBe(true);
    for (const job of adminJobs) { expect(userIds.has(job.userId)).toBe(true); expect(modelIds.has(job.modelId)).toBe(true); }
    for (const event of adminUsageEvents) { expect(jobIds.has(event.jobId)).toBe(true); expect(modelIds.has(event.modelId)).toBe(true); }
    for (const transaction of adminTransactions.filter((item) => item.type === "purchase")) expect(paymentIds.has(transaction.relatedId ?? "")).toBe(true);
    expect(adminFixture.fixture).toBe(true);
    expect(adminFixture.asOf).toBe(ADMIN_AS_OF);
  });

  it("represents distinct product capabilities and input/output modalities", () => {
    expect(adminModels).toHaveLength(6);
    expect(new Set(adminModels.flatMap((model) => model.outputModalities))).toEqual(new Set(["text", "image", "video"]));
    expect(adminModels.filter((model) => model.products.includes("website")).every((model) => model.outputModalities.includes("text"))).toBe(true);
    for (const model of adminModels) {
      expect(model.products.length).toBeGreaterThan(0);
      expect(model.inputModalities.length).toBeGreaterThan(0);
      expect(model.outputModalities.length).toBeGreaterThan(0);
      expect(model.id).not.toMatch(/sk-|api[_-]?key|secret/i);
    }
    expect(adminModels.find((model) => model.products.includes("image"))?.outputModalities).toContain("image");
    expect(adminModels.find((model) => model.products.includes("video"))?.outputModalities).toContain("video");
  });

  it("uses non-negative integer money/credit fields and safe diagnostics", () => {
    for (const price of adminModelPrices) {
      expect(Number.isInteger(price.providerCostCentsPerUnit)).toBe(true);
      expect(Number.isInteger(price.customerCreditsPerUnit)).toBe(true);
      expect(price.providerCostCentsPerUnit).toBeGreaterThanOrEqual(0);
      expect(price.customerCreditsPerUnit).toBeGreaterThan(0);
    }
    const serialized = JSON.stringify(adminFixture);
    expect(serialized).not.toMatch(/sk-live|sk-proj|BEGIN PRIVATE KEY|password|stack trace/i);
    for (const job of adminJobs) expect(job.diagnosticSummary).toMatch(/excluded|metadata|fixture|no /i);
  });
});

describe("admin financial and time-range calculations", () => {
  it("builds 90 continuous UTC fixture days with inclusive ranges", () => {
    expect(adminTrend).toHaveLength(90);
    for (let index = 1; index < adminTrend.length; index += 1) {
      expect(new Date(adminTrend[index]!.date).getTime() - new Date(adminTrend[index - 1]!.date).getTime()).toBe(86_400_000);
    }
    expect(getAdminTrend("7d")).toHaveLength(7);
    expect(getAdminTrend("30d")).toHaveLength(30);
    expect(getAdminTrend("90d")).toHaveLength(90);
    expect(getAdminRangeStart("7d")).toBe("2026-10-30T00:00:00.000Z");
    expect(isInAdminRange("2026-10-30T00:00:00.000Z", "7d")).toBe(true);
    expect(isInAdminRange("2026-10-29T23:59:59.000Z", "7d")).toBe(false);
    expect(isInAdminRange(ADMIN_AS_OF, "7d")).toBe(true);
  });

  it("separates successful demo payment value from usage value and contribution", () => {
    for (const range of ["7d", "30d", "90d"] as const) {
      const metrics = getAdminOverviewMetrics(range);
      const usage = filterUsageEvents(range);
      const payments = adminPayments.filter((payment) => isInAdminRange(payment.createdAt, range) && payment.status === "succeeded");
      expect(metrics.totalRevenueCents).toBe(payments.reduce((sum, payment) => sum + payment.amountCents, 0));
      expect(metrics.creditsConsumed).toBe(usage.reduce((sum, event) => sum + event.creditsDeducted, 0));
      expect(metrics.providerCostCents).toBe(usage.reduce((sum, event) => sum + event.providerCostCents, 0));
      expect(metrics.grossContributionCents).toBe(metrics.creditsConsumed - metrics.providerCostCents);
      expect(metrics.totalRevenueCents).not.toBe(metrics.creditsConsumed);
    }
  });

  it("conserves filtered totals across product/model breakdowns and daily points", () => {
    const events = filterUsageEvents("90d");
    const metrics = getUsageMetrics(events);
    for (const key of ["product", "modelId"] as const) {
      const groups = getUsageBreakdown(events, key);
      expect(groups.reduce((sum, group) => sum + group.creditsDeducted, 0)).toBe(metrics.creditsDeducted);
      expect(groups.reduce((sum, group) => sum + group.providerCostCents, 0)).toBe(metrics.providerCostCents);
      expect(groups.reduce((sum, group) => sum + group.eventCount, 0)).toBe(events.length);
    }
    const daily = getDailyUsage("90d", events);
    expect(daily.reduce((sum, point) => sum + point.creditsDeducted, 0)).toBe(metrics.creditsDeducted);
    expect(daily.reduce((sum, point) => sum + point.providerCostCents, 0)).toBe(metrics.providerCostCents);
    expect(metrics.failedGenerationCostCents).toBe(events.filter((event) => event.generationStatus === "failed").reduce((sum, event) => sum + event.providerCostCents, 0));
    expect(filterUsageEvents("90d", { product: "video", modelId: "all" }).every((event) => event.product === "video")).toBe(true);
  });
});

describe("admin formatting, pagination and local search", () => {
  it("formats integer cents, credits, duration and queries predictably", () => {
    expect(formatMoney(1900)).toBe("$19");
    expect(formatMoney(175)).toBe("$1.75");
    expect(formatMoney(1234, { whole: true })).toBe("$12");
    expect(formatCredits(4900)).toBe("4,900");
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(8400)).toBe("8.4s");
    expect(matchesAdminQuery("  MAYA ", "Maya Chen")).toBe(true);
    expect(matchesAdminQuery("absent", "Maya Chen", null)).toBe(false);
  });

  it("clamps pages and returns stable empty/current slices", () => {
    const page = paginate(Array.from({ length: 13 }, (_, index) => index), 99, 6);
    expect(page.page).toBe(3);
    expect(page.pageCount).toBe(3);
    expect(page.items).toEqual([12]);
    expect(paginate([1, 2], 0, 6).page).toBe(1);
    expect(paginate([], 4, 6)).toMatchObject({ items: [], totalItems: 0, page: 1, pageCount: 1 });
  });

  it("finds only local fixture matches across resource types", () => {
    const results = getAdminSearchResults("pay_demo_001");
    expect(results.some((result) => result.href === "/admin/payments?q=pay_demo_001")).toBe(true);
    expect(getAdminSearchResults("Maya").some((result) => result.href.includes("/admin/users"))).toBe(true);
    expect(getAdminSearchResults("DEMO-TIMEOUT").some((result) => result.href.includes("/admin/jobs"))).toBe(true);
    expect(getAdminSearchResults("definitely-not-a-fixture")).toEqual([]);
    expect(getAdminSearchResults("")).toEqual([]);
  });
});
