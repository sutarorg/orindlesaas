export type AdminNavigationItem = {
  label: string;
  href: string;
  description: string;
};

export type AdminNavigationGroup = {
  label: string;
  items: readonly AdminNavigationItem[];
};

export const adminNavigation: readonly AdminNavigationGroup[] = [
  {
    label: "Command",
    items: [
      { label: "Overview", href: "/admin", description: "Operational metrics and exceptions" },
      { label: "Users", href: "/admin/users", description: "Customers and account operations" },
    ],
  },
  {
    label: "AI operations",
    items: [
      { label: "AI Models", href: "/admin/models", description: "Capabilities and availability" },
      { label: "Providers", href: "/admin/providers", description: "Catalog enablement and configuration" },
      { label: "Model Pricing", href: "/admin/model-pricing", description: "Cost and credit price versions" },
      { label: "AI Usage & Costs", href: "/admin/usage", description: "Usage value and provider costs" },
      { label: "Generation Jobs", href: "/admin/jobs", description: "Queues and redacted diagnostics" },
      { label: "Website Projects", href: "/admin/websites", description: "Project and deployment metadata" },
    ],
  },
  {
    label: "Revenue operations",
    items: [
      { label: "Credit Packages", href: "/admin/credit-packages", description: "One-time pack configuration" },
      { label: "Payments", href: "/admin/payments", description: "Payment and fulfillment review" },
      { label: "Transactions", href: "/admin/transactions", description: "Operational reference ledger" },
      { label: "Adjustments & Disputes", href: "/admin/adjustments", description: "Reasoned financial review" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Admin Settings", href: "/admin/settings", description: "Preferences and access contract" },
    ],
  },
] as const;

export const adminNavigationItems = adminNavigation.flatMap((group) => group.items);

export function isAdminNavigationActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminBreadcrumbs(pathname: string) {
  const item = adminNavigationItems.find((candidate) => isAdminNavigationActive(candidate.href, pathname));
  if (pathname === "/admin") return [{ label: "Overview", href: null }];
  return [
    { label: "Admin", href: "/admin" as string | null },
    { label: item?.label ?? "Not found", href: null as string | null },
  ];
}

export function getAdminPageTitle(pathname: string) {
  return adminNavigationItems.find((item) => isAdminNavigationActive(item.href, pathname))?.label ?? "Admin";
}
