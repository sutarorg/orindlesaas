import type { AdminPermission } from "@/lib/contracts/admin";

export const adminRoutePermissions: Readonly<Record<string, AdminPermission>> = {
  "/admin": "admin:read",
  "/admin/users": "users:read",
  "/admin/models": "catalog:read",
  "/admin/providers": "catalog:read",
  "/admin/model-pricing": "pricing:read",
  "/admin/credit-packages": "pricing:read",
  "/admin/payments": "payments:read",
  "/admin/transactions": "payments:read",
  "/admin/usage": "usage:read",
  "/admin/jobs": "jobs:read",
  "/admin/websites": "websites:read",
  "/admin/adjustments": "credits:read",
  "/admin/settings": "settings:read",
};

export const proposedAdminRoles = [
  {
    name: "Support analyst",
    summary: "Safe customer, payment, job and website lookup.",
    permissions: ["admin:read", "users:read", "payments:read", "jobs:read", "websites:read", "disputes:read"],
    excluded: "No costs, adjustments, retries, availability changes or customer code.",
  },
  {
    name: "AI operations",
    summary: "Catalogue, provider, usage and retry operations.",
    permissions: ["admin:read", "catalog:read", "catalog:manage", "usage:read", "jobs:read", "jobs:retry"],
    excluded: "No payment reconciliation, credit adjustment or role administration.",
  },
  {
    name: "Finance operations",
    summary: "Pricing, payments, credits, disputes and cost review.",
    permissions: ["admin:read", "pricing:read", "pricing:manage", "payments:read", "payments:reconcile", "credits:read", "credits:adjust", "disputes:read", "disputes:manage", "usage:read", "audit:read"],
    excluded: "No provider availability, job retry or customer code by default.",
  },
  {
    name: "Security administrator",
    summary: "Account security, admin preferences and audit review.",
    permissions: ["admin:read", "users:read", "users:manage", "settings:read", "settings:manage", "audit:read"],
    excluded: "No financial or pricing operations by default; role assignment is separate.",
  },
] as const satisfies readonly {
  name: string;
  summary: string;
  permissions: readonly AdminPermission[];
  excluded: string;
}[];
