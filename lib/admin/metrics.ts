import type { AdminRange, AdminUsageEvent } from "@/lib/contracts/admin";
import type { DashboardProduct } from "@/lib/contracts/dashboard";
import {
  ADMIN_AS_OF,
  adminPayments,
  adminTransactions,
  adminTrend,
  adminUsageEvents,
  adminUsers,
} from "@/lib/admin/fixtures";

export const adminRangeDays: Readonly<Record<AdminRange, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const adminRangeLabels: Readonly<Record<AdminRange, string>> = {
  "7d": "Last 7 demo days",
  "30d": "Last 30 demo days",
  "90d": "Last 90 demo days",
};

export function getAdminRangeStart(range: AdminRange) {
  const finalDay = Date.UTC(2026, 10, 5);
  return new Date(finalDay - (adminRangeDays[range] - 1) * 86_400_000).toISOString();
}

export function isInAdminRange(value: string, range: AdminRange) {
  const timestamp = new Date(value).getTime();
  return timestamp >= new Date(getAdminRangeStart(range)).getTime() && timestamp <= new Date(ADMIN_AS_OF).getTime();
}

export function getAdminTrend(range: AdminRange) {
  return adminTrend.filter((point) => isInAdminRange(point.date, range));
}

export function getAdminOverviewMetrics(range: AdminRange) {
  const trend = getAdminTrend(range);
  const payments = adminPayments.filter((payment) => isInAdminRange(payment.createdAt, range));
  const transactions = adminTransactions.filter((transaction) => isInAdminRange(transaction.createdAt, range));
  const usage = adminUsageEvents.filter((event) => isInAdminRange(event.occurredAt, range));
  const successfulPayments = payments.filter((payment) => payment.status === "succeeded");
  const providerCostCents = usage.reduce((total, event) => total + event.providerCostCents, 0);
  const creditsConsumed = usage.reduce((total, event) => total + event.creditsDeducted, 0);

  return {
    registeredUsers: adminUsers.length,
    activeUsers: adminUsers.filter((user) => user.status === "active" && isInAdminRange(user.lastActiveAt, "30d")).length,
    newUsers: trend.reduce((total, point) => total + point.newUsers, 0),
    totalRevenueCents: successfulPayments.reduce((total, payment) => total + payment.amountCents, 0),
    successfulPurchases: successfulPayments.length,
    creditsIssued: transactions.filter((transaction) => transaction.credits > 0).reduce((total, transaction) => total + transaction.credits, 0),
    creditsConsumed,
    providerCostCents,
    grossContributionCents: creditsConsumed - providerCostCents,
    paymentFailures: payments.filter((payment) => payment.status === "failed").length,
    generationFailures: trend.reduce((total, point) => total + point.generationFailures, 0),
    jobProcessingVolume: trend.reduce((total, point) => total + point.jobVolume, 0),
  };
}

export type UsageFilters = {
  product: DashboardProduct | "all";
  modelId: string;
};

export function filterUsageEvents(range: AdminRange, filters: UsageFilters = { product: "all", modelId: "all" }) {
  return adminUsageEvents.filter((event) => {
    if (!isInAdminRange(event.occurredAt, range)) return false;
    if (filters.product !== "all" && event.product !== filters.product) return false;
    if (filters.modelId !== "all" && event.modelId !== filters.modelId) return false;
    return true;
  });
}

export function getUsageMetrics(events: readonly AdminUsageEvent[]) {
  const providerCostCents = events.reduce((total, event) => total + event.providerCostCents, 0);
  const creditsDeducted = events.reduce((total, event) => total + event.creditsDeducted, 0);
  const activeUsers = adminUsers.filter((user) => user.status === "active" && isInAdminRange(user.lastActiveAt, "30d")).length;
  return {
    eventCount: events.length,
    providerCostCents,
    creditsDeducted,
    customerUsageValueCents: creditsDeducted,
    grossContributionCents: creditsDeducted - providerCostCents,
    failedGenerationCostCents: events.filter((event) => event.generationStatus === "failed").reduce((total, event) => total + event.providerCostCents, 0),
    unreconciledUsage: events.filter((event) => event.reconciliationStatus === "unreconciled").length,
    activeUsers,
    costPerActiveUserCents: activeUsers === 0 ? 0 : Math.round(providerCostCents / activeUsers),
  };
}

export function getUsageBreakdown(events: readonly AdminUsageEvent[], key: "product" | "modelId") {
  const groups = new Map<string, { key: string; events: AdminUsageEvent[] }>();
  for (const event of events) {
    const groupKey = event[key];
    const group = groups.get(groupKey) ?? { key: groupKey, events: [] };
    group.events.push(event);
    groups.set(groupKey, group);
  }
  return Array.from(groups.values())
    .map((group) => ({ key: group.key, ...getUsageMetrics(group.events) }))
    .sort((a, b) => b.providerCostCents - a.providerCostCents);
}

export function getDailyUsage(range: AdminRange, events: readonly AdminUsageEvent[]) {
  return getAdminTrend(range).map((point) => {
    const day = point.date.slice(0, 10);
    const dailyEvents = events.filter((event) => event.occurredAt.slice(0, 10) === day);
    return {
      date: point.date,
      providerCostCents: dailyEvents.reduce((total, event) => total + event.providerCostCents, 0),
      creditsDeducted: dailyEvents.reduce((total, event) => total + event.creditsDeducted, 0),
    };
  });
}
