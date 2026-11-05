"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CloudCog,
  CreditCard,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Scale,
  Settings2,
  ShieldCheck,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminDemoBadge, AdminPreviewFeedback } from "@/components/admin/ui";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { adminNotifications } from "@/lib/admin/fixtures";
import { adminNavigation, getAdminBreadcrumbs, isAdminNavigationActive } from "@/lib/admin/navigation";
import type { AdminNotification, AdminPreviewResult } from "@/lib/contracts/admin";
import { cn } from "@/lib/utils";

const navigationIcons: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Users,
  "AI Models": Boxes,
  Providers: CloudCog,
  "Model Pricing": Tags,
  "AI Usage & Costs": BarChart3,
  "Generation Jobs": Activity,
  "Website Projects": Globe2,
  "Credit Packages": Package,
  Payments: CreditCard,
  Transactions: ReceiptText,
  "Adjustments & Disputes": Scale,
  "Admin Settings": Settings2,
};

function AdminNavigationItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin navigation" className="space-y-5">
      {adminNavigation.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">{group.label}</p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isAdminNavigationActive(item.href, pathname);
              const Icon = navigationIcons[item.label] ?? ShieldCheck;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors",
                      active ? "bg-[#eaf6f0] text-teal-dark" : "text-body hover:bg-soft hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-[17px] shrink-0", active ? "text-teal" : "text-muted group-hover:text-ink")} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto size-1.5 rounded-full bg-teal" aria-hidden="true" />}
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

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
        <Link href="/admin" aria-label="Orindle admin overview" onClick={onNavigate}><Logo /></Link>
        <span className="rounded-md bg-ink px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">Admin</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5"><AdminNavigationItems pathname={pathname} onNavigate={onNavigate} /></div>
      <div className="shrink-0 border-t border-line p-4">
        <div className="rounded-xl border border-line bg-soft p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink"><ShieldCheck className="size-4 text-teal" aria-hidden="true" />Frontend-only operations</div>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">No active admin role, live connection or persistent audit.</p>
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const breadcrumbs = getAdminBreadcrumbs(pathname);
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs">
        {breadcrumbs.map((breadcrumb, index) => {
          const current = index === breadcrumbs.length - 1;
          return (
            <li key={`${breadcrumb.label}-${index}`} className={cn("flex min-w-0 items-center gap-1.5", !current && "hidden sm:flex")}>
              {index > 0 && <ChevronRight className="size-3 shrink-0 text-muted" aria-hidden="true" />}
              {breadcrumb.href && !current ? <Link href={breadcrumb.href} className="rounded text-muted hover:text-ink">{breadcrumb.label}</Link> : <span aria-current={current ? "page" : undefined} className="max-w-36 truncate font-semibold text-ink sm:max-w-56">{breadcrumb.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function NotificationsMenu() {
  const [notifications, setNotifications] = useState<readonly AdminNotification[]>(adminNotifications);
  const unread = notifications.filter((notification) => !notification.read).length;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Admin notifications, ${unread} unread fixture notifications` : "Admin notifications"}>
          <Bell className="size-[18px]" aria-hidden="true" />
          {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white bg-teal" aria-hidden="true" />}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={10} className="z-[70] w-[min(370px,calc(100vw-1.5rem))] rounded-2xl border border-line bg-white p-2 shadow-[0_18px_60px_rgba(21,25,24,0.14)] focus:outline-none">
          <div className="flex items-center justify-between px-3 py-2"><DropdownMenu.Label className="text-sm font-semibold text-ink">Operational examples</DropdownMenu.Label><AdminDemoBadge label="Fixtures" /></div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          {notifications.length ? notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl px-3 py-3 hover:bg-soft">
              <div className="flex items-start gap-2.5">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", notification.read ? "bg-line" : "bg-teal")} aria-hidden="true" />
                <div><p className="text-sm font-semibold text-ink">{notification.title}</p><p className="mt-1 text-xs leading-5 text-body">{notification.detail}</p><p className="mt-1.5 text-[11px] text-muted">{notification.timeLabel}{notification.read ? " · Read locally" : ""}</p></div>
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

function ProfileMenu({ onPreview }: { onPreview: (result: AdminPreviewResult) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-subtle font-display text-xs font-semibold text-teal-dark" aria-label="Open demo admin profile menu">OP</Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={10} className="z-[70] w-64 rounded-2xl border border-line bg-white p-2 shadow-[0_18px_60px_rgba(21,25,24,0.14)] focus:outline-none">
          <div className="px-3 py-2.5"><p className="text-sm font-semibold text-ink">Demo operator</p><p className="mt-0.5 truncate text-xs text-muted">operator@example.com · no active role</p></div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className="rounded-xl outline-none hover:bg-soft focus:bg-soft"><Link href="/admin/settings" className="flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-ink"><Settings2 className="size-4" aria-hidden="true" />Admin Settings</Link></DropdownMenu.Item>
          <DropdownMenu.Item asChild className="rounded-xl outline-none hover:bg-soft focus:bg-soft"><Link href="/" className="flex min-h-10 cursor-pointer items-center gap-2.5 px-3 text-sm text-ink"><ExternalLink className="size-4" aria-hidden="true" />Back to public website</Link></DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item onSelect={() => onPreview({ status: "unavailable", persisted: false, auditPersisted: false, paymentChanged: false, creditsChanged: 0, message: "There is no authenticated admin session to sign out of. No role, session or account changed." })} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm text-error outline-none hover:bg-[#fff5f3] focus:bg-[#fff5f3]"><LogOut className="size-4" aria-hidden="true" />Sign out preview</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shellResult, setShellResult] = useState<AdminPreviewResult | null>(null);

  useEffect(() => {
    const closeOnHistoryNavigation = () => setMobileOpen(false);
    window.addEventListener("popstate", closeOnHistoryNavigation);
    return () => window.removeEventListener("popstate", closeOnHistoryNavigation);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <a href="#main-content" className="skip-link">Skip to admin content</a>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[264px] border-r border-line bg-white lg:block"><SidebarContent pathname={pathname} /></aside>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="min-h-screen lg:pl-[264px]">
          <div className="sticky top-0 z-40">
            <div className="flex min-h-8 items-center justify-center border-b border-teal/10 bg-[#eaf6f0] px-3 py-1.5 text-center text-[11px] font-medium leading-4 text-teal-dark">
              <span>Demo admin · fictional operational data · no live changes</span>
              <Link href="/admin/settings" className="ml-2 hidden underline underline-offset-2 sm:inline">Access contract</Link>
            </div>
            <header className="flex h-[68px] items-center gap-2 border-b border-line bg-white/95 px-2 backdrop-blur-md sm:px-4 lg:px-6">
              <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin navigation"><Menu className="size-5" aria-hidden="true" /></Button></Dialog.Trigger>
              <div className="min-w-0 flex-1"><Breadcrumbs pathname={pathname} /></div>
              <AdminSearch />
              <NotificationsMenu />
              <ProfileMenu onPreview={setShellResult} />
            </header>
          </div>
          {shellResult && <div className="border-b border-line bg-white px-4 py-3 sm:px-6"><AdminPreviewFeedback result={shellResult} /></div>}
          <main id="main-content" className="px-3 py-5 sm:px-5 sm:py-7 lg:px-7 lg:py-8">
            <div className="mx-auto w-full max-w-[1680px]">{children}</div>
          </main>
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-[70] w-[min(320px,calc(100vw-1rem))] border-r border-line bg-white shadow-2xl focus:outline-none lg:hidden" aria-describedby="mobile-admin-description">
            <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
            <Dialog.Description id="mobile-admin-description" className="sr-only">Navigate fictional Orindle administration views</Dialog.Description>
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-3 top-3 z-10" aria-label="Close admin navigation"><X className="size-5" aria-hidden="true" /></Button></Dialog.Close>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
