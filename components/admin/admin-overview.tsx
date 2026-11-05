"use client";

import { AlertTriangle, ArrowRight, CircleDollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminTrendChart } from "@/components/admin/trend-chart";
import { AdminMetricCard, AdminNotice, AdminPageHeader, AdminPanel, AdminPanelHeader } from "@/components/admin/ui";
import { adminPayments, adminUsageEvents, adminWebsites } from "@/lib/admin/fixtures";
import { formatMoney, formatNumber } from "@/lib/admin/format";
import { adminRangeLabels, getAdminOverviewMetrics, getAdminTrend } from "@/lib/admin/metrics";
import type { AdminRange } from "@/lib/contracts/admin";

export function AdminOverview() {
  const [range, setRange] = useState<AdminRange>("30d");
  const metrics = getAdminOverviewMetrics(range);
  const trend = getAdminTrend(range);
  const pendingFulfillment = adminPayments.filter((payment) => payment.fulfillmentStatus === "pending" && payment.status === "succeeded").length;
  const failedPayments = adminPayments.filter((payment) => payment.status === "failed").length;
  const unreconciled = adminUsageEvents.filter((event) => event.reconciliationStatus === "unreconciled").length;
  const failedDeployments = adminWebsites.filter((website) => website.deploymentStatus === "failed").length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations command"
        title="Platform overview"
        description="A focused view of fictional customer, payment, credit and generation operations. Values demonstrate the admin interface; they are not Orindle performance data."
        actions={
          <div>
            <label htmlFor="overview-range" className="mb-1.5 block text-xs font-semibold text-ink">Fixture range</label>
            <select id="overview-range" value={range} onChange={(event) => setRange(event.target.value as AdminRange)} className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15">
              {Object.entries(adminRangeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        }
      />

      <div className="mb-5"><AdminNotice title="Illustrative operations dataset">Demo as of Nov 5, 2026 UTC. Aggregate trend points and recent record samples are deterministic fixtures, not collected analytics, live incidents or actual received revenue.</AdminNotice></div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total revenue · demo" value={formatMoney(metrics.totalRevenueCents)} detail={`${adminRangeLabels[range]} · successful fixture payments`} definition="Captured successful demo payment value; not actual or accounting-recognized revenue." />
        <AdminMetricCard label="Gross contribution · demo" value={formatMoney(metrics.grossContributionCents)} detail="Customer usage value minus AI provider cost" definition="Before payment fees, infrastructure, support, taxes, refunds and other operating expenses." />
        <AdminMetricCard label="Active users" value={formatNumber(metrics.activeUsers)} detail="Active fixture accounts with activity in the last 30 demo days" />
        <AdminMetricCard label="Job processing volume" value={formatNumber(metrics.jobProcessingVolume)} detail={`${adminRangeLabels[range]} · queued, running, completed and failed fixtures`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard compact label="Total registered users" value={formatNumber(metrics.registeredUsers)} detail="All fictional account records" />
        <AdminMetricCard compact label="New users" value={formatNumber(metrics.newUsers)} detail={adminRangeLabels[range]} />
        <AdminMetricCard compact label="Successful purchases" value={formatNumber(metrics.successfulPurchases)} detail="Successful fixture payments in range" />
        <AdminMetricCard compact label="Credits issued" value={formatNumber(metrics.creditsIssued)} detail="Positive fixture ledger entries in range" />
        <AdminMetricCard compact label="Credits consumed" value={formatNumber(metrics.creditsConsumed)} detail="Verified-field fixture usage deductions" />
        <AdminMetricCard compact label="AI provider costs · demo" value={formatMoney(metrics.providerCostCents)} detail="Illustrative cost fields; not incurred Orindle cost" />
        <AdminMetricCard compact label="Payment failures" value={formatNumber(metrics.paymentFailures)} detail="Failed fixture payments in range" />
        <AdminMetricCard compact label="Generation failures" value={formatNumber(metrics.generationFailures)} detail="Failed-generation trend fixtures in range" />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
        <AdminPanel>
          <AdminTrendChart
            title="Completed and failed generation jobs"
            description={`Illustrative jobs per UTC day · ${adminRangeLabels[range]}`}
            summary={`${formatNumber(trend.reduce((sum, point) => sum + point.completedJobs, 0))} completed and ${formatNumber(metrics.generationFailures)} failed demo jobs appear in this range.`}
            points={trend.map((point) => ({ label: point.date, values: [point.completedJobs, point.generationFailures] }))}
            series={[{ label: "Completed jobs", color: "#067a67" }, { label: "Failed jobs", color: "#b42318" }]}
            formatValue={formatNumber}
          />
        </AdminPanel>
        <AdminPanel>
          <AdminTrendChart
            title="Successful and failed purchases"
            description={`Fixture payment outcomes per UTC day · ${adminRangeLabels[range]}`}
            summary={`${formatNumber(metrics.successfulPurchases)} successful and ${formatNumber(metrics.paymentFailures)} failed demo payments appear in this range.`}
            points={trend.map((point) => ({ label: point.date, values: [point.successfulPurchases, point.paymentFailures] }))}
            series={[{ label: "Successful payments", color: "#067a67" }, { label: "Failed payments", color: "#b42318" }]}
            formatValue={formatNumber}
          />
        </AdminPanel>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel>
          <AdminPanelHeader title="Operational review queue" description="Fictional exceptions that demonstrate useful next actions; none is a live incident." />
          <ul className="divide-y divide-line">
            {[
              { icon: CircleDollarSign, label: "Pending credit fulfillment", count: pendingFulfillment, detail: "Successful demo payment awaiting a fulfilled state", href: "/admin/payments" },
              { icon: AlertTriangle, label: "Failed payment review", count: failedPayments, detail: "Failed demo payments across the fixture ledger", href: "/admin/payments" },
              { icon: Activity, label: "Unreconciled AI usage", count: unreconciled, detail: "Usage examples requiring reconciliation review", href: "/admin/usage" },
              { icon: AlertTriangle, label: "Failed website deployments", count: failedDeployments, detail: "Safe deployment metadata only; no customer code", href: "/admin/websites" },
            ].map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="group flex min-h-16 items-center gap-3 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-soft text-teal"><item.icon className="size-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted">{item.detail}</span></span>
                  <span className="rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold tabular-nums text-ink">{item.count}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-teal" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </AdminPanel>
        <AdminPanel>
          <AdminPanelHeader title="Metric definitions" description="These meanings stay visible wherever financial values are compared." />
          <dl className="space-y-3 text-xs leading-5">
            <div><dt className="font-semibold text-ink">Total revenue · demo</dt><dd className="mt-0.5 text-body">Sum of successful fixture payment amounts in range. Not actual received or recognized revenue.</dd></div>
            <div><dt className="font-semibold text-ink">Customer usage value</dt><dd className="mt-0.5 text-body">Credits deducted ÷100 in USD. This is modeled usage value, not a cash receipt.</dd></div>
            <div><dt className="font-semibold text-ink">AI provider cost</dt><dd className="mt-0.5 text-body">Restricted illustrative cost fields. Production requires verified provider metering/invoice reconciliation.</dd></div>
            <div><dt className="font-semibold text-ink">Gross contribution</dt><dd className="mt-0.5 text-body">Usage value minus provider cost; excludes every other operating expense and is not net profit.</dd></div>
            <div><dt className="font-semibold text-ink">Credits issued / consumed</dt><dd className="mt-0.5 text-body">Positive fixture ledger entries versus fixture usage deductions in the selected range.</dd></div>
          </dl>
        </AdminPanel>
      </div>
    </>
  );
}
