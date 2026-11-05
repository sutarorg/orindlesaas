import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, FlaskConical, Inbox, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminPreviewResult } from "@/lib/contracts/admin";
import { cn } from "@/lib/utils";

export function AdminDemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal/15 bg-[#eff9f4] px-2.5 py-1 text-[11px] font-semibold text-teal-dark">
      <FlaskConical className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">{eyebrow}</p>
          <AdminDemoBadge />
        </div>
        <h1 className="mb-2.5 text-[clamp(1.75rem,3.4vw,2.35rem)] font-semibold leading-[1.15] tracking-[-0.04em] text-ink">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-body">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

export function AdminPanel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={cn("min-w-0 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(21,25,24,0.02)] sm:p-5", className)}>{children}</section>;
}

export function AdminPanelHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export type AdminBadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const badgeStyles: Record<AdminBadgeTone, string> = {
  success: "border-teal/15 bg-[#edf8f2] text-teal-dark",
  warning: "border-[#e3d5ae] bg-[#fff9e9] text-[#725511]",
  danger: "border-error/15 bg-[#fff2f0] text-error",
  info: "border-[#b9dce5] bg-[#edf8fb] text-[#17677a]",
  neutral: "border-line bg-soft text-body",
};

export function AdminBadge({ label, tone = "neutral" }: { label: string; tone?: AdminBadgeTone }) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold leading-4", badgeStyles[tone])}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

export function getAdminStatusTone(status: string): AdminBadgeTone {
  if (["active", "enabled", "succeeded", "fulfilled", "verified", "completed", "deployed", "reconciled", "operational-fixture", "available-fixture", "current-fixture", "resolved-fixture"].includes(status)) return "success";
  if (["failed", "suspended", "disputed", "degraded-fixture", "disabled-fixture"].includes(status)) return "danger";
  if (["pending", "review", "queued", "under-review", "scheduled-fixture", "review-fixture", "unreconciled"].includes(status)) return "warning";
  if (["running", "processing"].includes(status)) return "info";
  return "neutral";
}

export function AdminNotice({ title, children, tone = "neutral" }: { title: string; children: React.ReactNode; tone?: "neutral" | "warning" | "error" }) {
  return (
    <div className={cn(
      "rounded-xl border px-4 py-3.5 text-sm leading-6",
      tone === "neutral" && "border-line bg-soft text-body",
      tone === "warning" && "border-[#eadfca] bg-[#fffaf0] text-[#6f5525]",
      tone === "error" && "border-error/20 bg-[#fff5f3] text-error",
    )}>
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

export function AdminPreviewFeedback({ result }: { result: AdminPreviewResult | null }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {result && (
        <div className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-6",
          result.status === "unavailable" ? "border-[#eadfca] bg-[#fffaf0] text-[#6f5525]" : "border-teal/20 bg-[#f1faf6] text-teal-dark",
        )}>
          {result.status === "unavailable" ? <AlertCircle className="mt-1 size-4 shrink-0" aria-hidden="true" /> : <FlaskConical className="mt-1 size-4 shrink-0" aria-hidden="true" />}
          <div>
            <p className="font-semibold text-ink">Preview only · no administrative operation ran</p>
            <p>{result.message}</p>
            <p className="mt-1 text-xs font-medium">Nothing persisted · No payment changed · 0 credits changed · No audit persisted</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminMetricCard({ label, value, detail, definition, compact = false }: { label: string; value: string; detail: string; definition?: string; compact?: boolean }) {
  return (
    <article className={cn("min-w-0 rounded-2xl border border-line bg-white", compact ? "p-4" : "p-5")}>
      <p className="text-xs font-medium leading-5 text-muted">{label}</p>
      <p className={cn("mt-2 font-display font-semibold tabular-nums tracking-[-0.04em] text-ink", compact ? "text-xl" : "text-[clamp(1.55rem,3vw,2rem)]")}>{value}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-body">{detail}</p>
      {definition && <p className="mt-2 border-t border-line pt-2 text-[11px] leading-5 text-muted">{definition}</p>}
    </article>
  );
}

export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-subtle text-teal"><Inbox className="size-5" aria-hidden="true" /></span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-body">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm" />
        <Dialog.Content className={cn("fixed left-1/2 top-1/2 z-[90] max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-2xl focus:outline-none sm:p-6", className)}>
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label={`Close ${title}`}><X aria-hidden="true" /></Button></Dialog.Close>
          <div className="pr-10">
            <Dialog.Title className="text-xl font-semibold tracking-[-0.03em] text-ink">{title}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-body">{description}</Dialog.Description>
          </div>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AdminDefinitionList({ items }: { items: readonly { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid min-w-0 gap-x-5 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{item.label}</dt>
          <dd className="mt-1 min-w-0 break-words text-sm leading-6 text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
