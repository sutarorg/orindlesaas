"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Coins,
  ExternalLink,
  FolderKanban,
  Globe2,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { ActionFeedback, DemoBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { formatCredits } from "@/lib/dashboard/format";
import { appNavigation, getAppBreadcrumbs, isNavItemActive } from "@/lib/dashboard/navigation";
import { cn } from "@/lib/utils";

const navigationIcons: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Chat: MessagesSquare,
  "Image Studio": ImageIcon,
  "Video Studio": Video,
  Websites: Globe2,
  Projects: FolderKanban,
  Library: LibraryBig,
  History,
  "Credits & Wallet": Coins,
  Settings,
  "Help & Support": CircleHelp,
};

function NavigationItems({ pathname, collapsed = false, onNavigate }: { pathname: string; collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Workspace navigation" className="space-y-5">
      {appNavigation.map((group) => (
        <div key={group.label}>
          <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted", collapsed && "sr-only")}>{group.label}</p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isNavItemActive(item, pathname);
              const Icon = navigationIcons[item.label] ?? CircleHelp;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors",
                      active ? "bg-[#eaf6f0] text-teal-dark" : "text-body hover:bg-soft hover:text-ink",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <Icon className={cn("size-[18px] shrink-0", active ? "text-teal" : "text-muted group-hover:text-ink")} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    <span className={cn(collapsed && "sr-only")}>{item.label}</span>
                    {active && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-teal" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function WalletCard({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return <Link href="/app/credits" className="mx-auto grid size-11 place-items-center rounded-xl bg-mint/50 text-teal-dark" aria-label={`${formatCredits(workspaceFixture.wallet.balance)} demo credits. Open wallet.`} title="Demo credits"><Coins className="size-5" aria-hidden="true" /></Link>;
  }
  return (
    <div className="rounded-2xl border border-teal/10 bg-[#f0f8f4] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-dark">Demo balance</span>
        <Coins className="size-4 text-teal" aria-hidden="true" />
      </div>
      <p className="mt-1 font-display text-xl font-semibold tracking-[-0.035em] text-ink">{formatCredits(workspaceFixture.wallet.balance)} <span className="text-xs font-medium text-body">credits</span></p>
      <Link href="/app/credits#packs" className="mt-3 flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-teal-dark"><Plus className="size-3.5" aria-hidden="true" />Buy credits</Link>
      <p className="mt-2 text-center text-[10px] text-muted">Purchase preview only</p>
    </div>
  );
}

function SidebarContent({ pathname, collapsed = false, onNavigate, onCollapse }: { pathname: string; collapsed?: boolean; onNavigate?: () => void; onCollapse?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-[72px] shrink-0 items-center border-b border-line px-5", collapsed && "justify-center px-2")}>
        <Link href="/app" aria-label="Orindle workspace overview" onClick={onNavigate}><Logo compact={collapsed} /></Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <NavigationItems pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      <div className="shrink-0 space-y-3 border-t border-line p-3">
        <WalletCard collapsed={collapsed} />
        {onCollapse && (
          <Button type="button" variant="ghost" size="sm" onClick={onCollapse} className={cn("w-full text-xs text-muted", collapsed && "px-0")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : undefined}>
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            <span className={cn(collapsed && "sr-only")}>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const breadcrumbs = getAppBreadcrumbs(pathname);
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs">
        {breadcrumbs.map((breadcrumb, index) => {
          const current = index === breadcrumbs.length - 1;
          return (
            <li key={`${breadcrumb.label}-${index}`} className={cn("flex min-w-0 items-center gap-1.5", !current && "hidden sm:flex")}>
              {index > 0 && <ChevronRight className={cn("size-3 shrink-0 text-muted", index === breadcrumbs.length - 1 && "hidden sm:block")} aria-hidden="true" />}
              {breadcrumb.href && !current ? (
                <Link href={breadcrumb.href} className="max-w-40 truncate rounded text-muted hover:text-ink">{breadcrumb.label}</Link>
              ) : <span aria-current={current ? "page" : undefined} className="max-w-[120px] truncate font-semibold text-ink sm:max-w-56">{breadcrumb.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function NotificationsMenu() {
  const [notifications, setNotifications] = useState(workspaceFixture.notifications);
  const unread = notifications.filter((notification) => !notification.read).length;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread fixture notifications` : "Notifications"}>
          <Bell className="size-[18px]" aria-hidden="true" />
          {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-teal" aria-hidden="true" />}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={10} className="z-[70] w-[min(360px,calc(100vw-1.5rem))] rounded-2xl border border-line bg-white p-2 shadow-[0_18px_60px_rgba(21,25,24,0.14)] focus:outline-none">
          <div className="flex items-center justify-between px-3 py-2">
            <DropdownMenu.Label className="text-sm font-semibold text-ink">Notifications</DropdownMenu.Label>
            <DemoBadge label="Fixtures" />
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          {notifications.length ? notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl px-3 py-3 hover:bg-soft">
              <div className="flex items-start gap-2.5">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", notification.read ? "bg-line" : "bg-teal")} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink">{notification.title}</p>
                  <p className="mt-1 text-xs leading-5 text-body">{notification.detail}</p>
                  <p className="mt-1.5 text-[11px] text-muted">{notification.timeLabel}{notification.read ? " · Read locally" : ""}</p>
                </div>
              </div>
            </div>
          )) : <p className="px-3 py-8 text-center text-sm text-muted">No local fixture notifications.</p>}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <div className="flex gap-1 p-1">
            <DropdownMenu.Item onSelect={() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))} className="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-medium text-ink outline-none hover:bg-soft focus:bg-soft">Mark all read locally</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => setNotifications((current) => current.filter((notification) => !notification.read))} className="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-xs font-medium text-ink outline-none hover:bg-soft focus:bg-soft">Clear read locally</DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ProfileMenu({ onPreview }: { onPreview: (result: DashboardPreviewResult) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-subtle font-display text-xs font-semibold text-teal-dark" aria-label="Open demo profile menu">AR</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={10} className="z-[70] w-64 rounded-2xl border border-line bg-white p-2 shadow-[0_18px_60px_rgba(21,25,24,0.14)] focus:outline-none">
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-ink">Asha · demo profile</p>
            <p className="mt-0.5 truncate text-xs text-muted">asha@example.test</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className="rounded-xl outline-none hover:bg-soft focus:bg-soft"><Link href="/app/settings" className="flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-ink"><Settings className="size-4" aria-hidden="true" />Settings</Link></DropdownMenu.Item>
          <DropdownMenu.Item asChild className="rounded-xl outline-none hover:bg-soft focus:bg-soft"><Link href="/app/support" className="flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-ink"><CircleHelp className="size-4" aria-hidden="true" />Help & Support</Link></DropdownMenu.Item>
          <DropdownMenu.Item asChild className="rounded-xl outline-none hover:bg-soft focus:bg-soft"><Link href="/" className="flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-ink"><ExternalLink className="size-4" aria-hidden="true" />Back to public website</Link></DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item onSelect={() => onPreview({ status: "unavailable", persisted: false, creditsChanged: 0, message: "There is no authenticated session to sign out of. This is only the future sign-out control." })} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm text-error outline-none hover:bg-[#fff5f3] focus:bg-[#fff5f3]"><LogOut className="size-4" aria-hidden="true" />Sign out preview</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [shellResult, setShellResult] = useState<DashboardPreviewResult | null>(null);

  useEffect(() => {
    const closeOnHistoryNavigation = () => setMobileOpen(false);
    window.addEventListener("popstate", closeOnHistoryNavigation);
    return () => window.removeEventListener("popstate", closeOnHistoryNavigation);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <a href="#main-content" className="skip-link">Skip to workspace content</a>
      <aside className={cn("fixed inset-y-0 left-0 z-50 hidden border-r border-line bg-white transition-[width] duration-200 lg:block", collapsed ? "w-[84px]" : "w-[248px]")}>
        <SidebarContent pathname={pathname} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} />
      </aside>

      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-[84px]" : "lg:pl-[248px]")}>
          <div className="sticky top-0 z-40">
            <div className="flex min-h-8 items-center justify-center border-b border-teal/10 bg-[#eaf6f0] px-3 py-1.5 text-center text-[11px] font-medium leading-4 text-teal-dark">
              <span>Demo workspace · illustrative fixtures · changes are not saved</span>
              <Link href="/app/support" className="ml-2 hidden underline underline-offset-2 sm:inline">Learn more</Link>
            </div>
            <header className="flex h-[68px] items-center gap-2 border-b border-line bg-white/95 px-3 backdrop-blur-md sm:px-5 lg:px-7">
              <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open workspace navigation"><Menu className="size-5" aria-hidden="true" /></Button></Dialog.Trigger>
              <div className="min-w-0 flex-1"><Breadcrumbs pathname={pathname} /></div>
              <Link href="/app/credits" className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-teal/15 bg-[#f0f8f4] px-2.5 text-xs font-semibold text-teal-dark transition-colors hover:border-teal/30 sm:px-3.5" aria-label={`${formatCredits(workspaceFixture.wallet.balance)} demo credits. Open Credits and Wallet.`}>
                <Coins className="size-4" aria-hidden="true" /><span>{formatCredits(workspaceFixture.wallet.balance)}</span><span className="hidden md:inline">demo credits</span><span className="sr-only md:hidden">demo credits</span>
              </Link>
              <NotificationsMenu />
              <ProfileMenu onPreview={setShellResult} />
            </header>
          </div>
          {shellResult && <div className="border-b border-line bg-white px-4 py-3 sm:px-6 lg:px-8"><ActionFeedback result={shellResult} /></div>}
          <main id="main-content" className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-[70] w-[min(320px,calc(100vw-1rem))] border-r border-line bg-white shadow-2xl focus:outline-none lg:hidden" aria-describedby="mobile-workspace-description">
            <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
            <Dialog.Description id="mobile-workspace-description" className="sr-only">Navigate the Orindle demo workspace. Press Escape to close.</Dialog.Description>
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-3 top-3.5 z-10" aria-label="Close workspace navigation"><X className="size-5" aria-hidden="true" /></Button></Dialog.Close>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
