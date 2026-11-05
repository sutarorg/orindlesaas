export type AppNavItem = {
  label: string;
  shortLabel: string;
  href: string;
  match: "exact" | "prefix";
};

export type AppNavGroup = {
  label: "Main" | "Workspace" | "Account";
  items: readonly AppNavItem[];
};

export const appNavigation: readonly AppNavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", shortLabel: "Home", href: "/app", match: "exact" },
      { label: "Chat", shortLabel: "Chat", href: "/app/chat", match: "prefix" },
      { label: "Image Studio", shortLabel: "Images", href: "/app/image-studio", match: "exact" },
      { label: "Video Studio", shortLabel: "Video", href: "/app/video-studio", match: "exact" },
      { label: "Websites", shortLabel: "Websites", href: "/app/websites", match: "prefix" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Projects", shortLabel: "Projects", href: "/app/projects", match: "exact" },
      { label: "Library", shortLabel: "Library", href: "/app/library", match: "exact" },
      { label: "History", shortLabel: "History", href: "/app/history", match: "exact" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Credits & Wallet", shortLabel: "Credits", href: "/app/credits", match: "prefix" },
      { label: "Settings", shortLabel: "Settings", href: "/app/settings", match: "exact" },
      { label: "Help & Support", shortLabel: "Support", href: "/app/support", match: "exact" },
    ],
  },
] as const;

export const allNavItems = appNavigation.flatMap((group) => group.items);

export function isNavItemActive(item: AppNavItem, pathname: string) {
  return item.match === "exact" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export type Breadcrumb = { label: string; href?: string };

export function getAppBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === "/app") return [{ label: "Overview" }];
  const parts = pathname.split("/").filter(Boolean);
  if (parts[1] === "chat" && parts[2]) {
    return [
      { label: "Chat", href: "/app/chat" },
      { label: "Conversation" },
    ];
  }
  if (parts[1] === "websites" && parts[2] && parts[2] !== "new") {
    return [
      { label: "Websites", href: "/app/websites" },
      { label: "Website", href: `/app/websites/${parts[2]}/editor` },
      { label: parts[3] === "settings" ? "Settings" : "Editor" },
    ];
  }
  if (pathname === "/app/credits/history") {
    return [{ label: "Credits & Wallet", href: "/app/credits" }, { label: "Transaction history" }];
  }
  if (pathname === "/app/websites/new") {
    return [{ label: "Websites", href: "/app/websites" }, { label: "New website" }];
  }
  const item = allNavItems.find((candidate) => isNavItemActive(candidate, pathname));
  return [{ label: item?.label ?? "Workspace" }];
}
