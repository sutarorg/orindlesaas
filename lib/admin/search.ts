import { adminJobs, adminModels, adminPayments, adminUsers } from "@/lib/admin/fixtures";
import { adminNavigationItems } from "@/lib/admin/navigation";
import { matchesAdminQuery } from "@/lib/admin/format";

export type AdminSearchResult = {
  id: string;
  category: "Navigation" | "User" | "Model" | "Payment" | "Job";
  label: string;
  detail: string;
  href: string;
};

export function getAdminSearchResults(query: string): readonly AdminSearchResult[] {
  const normalized = query.trim();
  if (normalized.length < 2) return [];
  const encoded = encodeURIComponent(normalized);
  const results: AdminSearchResult[] = [];

  for (const item of adminNavigationItems) {
    if (matchesAdminQuery(normalized, item.label, item.description)) {
      results.push({ id: `nav-${item.href}`, category: "Navigation", label: item.label, detail: item.description, href: item.href });
    }
  }
  for (const user of adminUsers) {
    if (matchesAdminQuery(normalized, user.id, user.name, user.email)) {
      results.push({ id: user.id, category: "User", label: user.name, detail: `${user.email} · ${user.status}`, href: `/admin/users?q=${encoded}` });
    }
  }
  for (const model of adminModels) {
    if (matchesAdminQuery(normalized, model.id, model.displayName, model.provider)) {
      results.push({ id: model.id, category: "Model", label: model.displayName, detail: `${model.provider} · ${model.id}`, href: `/admin/models?q=${encoded}` });
    }
  }
  for (const payment of adminPayments) {
    if (matchesAdminQuery(normalized, payment.id, payment.providerPaymentId, payment.reference)) {
      results.push({ id: payment.id, category: "Payment", label: payment.providerPaymentId, detail: `${payment.status} · ${payment.reference}`, href: `/admin/payments?q=${encoded}` });
    }
  }
  for (const job of adminJobs) {
    if (matchesAdminQuery(normalized, job.id, job.modelId, job.errorCode)) {
      results.push({ id: job.id, category: "Job", label: job.id, detail: `${job.product} · ${job.status} · ${job.modelId}`, href: `/admin/jobs?q=${encoded}` });
    }
  }
  return results.slice(0, 8);
}
