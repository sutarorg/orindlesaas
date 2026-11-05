import { AlertCircle, ArrowRight, FlaskConical, Inbox } from "lucide-react";
import Link from "next/link";
import type { DashboardPreviewResult, FixtureGeneration } from "@/lib/contracts/dashboard";
import { statusLabels } from "@/lib/dashboard/format";
import { cn } from "@/lib/utils";

export function DemoBadge({ label = "Demo fixture", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border border-teal/15 bg-[#eff9f4] px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-teal-dark", className)}>
      <FlaskConical className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-5 sm:mb-9 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal">{eyebrow}</p>}
        <h1 className="mb-3 text-[clamp(1.8rem,4vw,2.65rem)] font-semibold leading-[1.12] tracking-[-0.045em] text-ink">{title}</h1>
        <p className="max-w-2xl text-[15px] leading-7 text-body">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

export function StatusBadge({ status }: { status: FixtureGeneration["status"] }) {
  const styles: Record<FixtureGeneration["status"], string> = {
    queued: "border-[#d9cda8] bg-[#fff9e9] text-[#725511]",
    processing: "border-[#b9dce5] bg-[#edf8fb] text-[#17677a]",
    completed: "border-teal/15 bg-[#edf8f2] text-teal-dark",
    failed: "border-error/15 bg-[#fff2f0] text-error",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", styles[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

export function ActionFeedback({ result, id }: { result: DashboardPreviewResult | null; id?: string }) {
  return (
    <div id={id} aria-live="polite" aria-atomic="true">
      {result && (
        <div className={cn(
          "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6",
          result.status === "unavailable" ? "border-[#eadfca] bg-[#fffaf0] text-[#6f5525]" : "border-teal/20 bg-[#f1faf6] text-teal-dark",
        )}>
          {result.status === "unavailable" ? <AlertCircle className="mt-1 size-4 shrink-0" aria-hidden="true" /> : <FlaskConical className="mt-1 size-4 shrink-0" aria-hidden="true" />}
          <div>
            <p className="font-semibold text-ink">{result.status === "unavailable" ? "Preview only" : "Local preview updated"}</p>
            <p>{result.message}</p>
            <p className="mt-1 text-xs font-medium">Nothing persisted · 0 credits changed</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-subtle text-teal">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <h2 className="mb-2 text-lg font-semibold tracking-[-0.025em]">{title}</h2>
      <p className="mb-6 max-w-md text-sm leading-6 text-body">{description}</p>
      {action && (
        <Link href={action.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark">
          {action.label}<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function InlineNotice({ title, children, tone = "neutral" }: { title: string; children: React.ReactNode; tone?: "neutral" | "error" | "warning" }) {
  return (
    <div className={cn(
      "rounded-2xl border px-4 py-3.5 text-sm leading-6",
      tone === "error" && "border-error/20 bg-[#fff5f3] text-error",
      tone === "warning" && "border-[#eadfca] bg-[#fffaf0] text-[#6f5525]",
      tone === "neutral" && "border-line bg-soft text-body",
    )}>
      <p className="font-semibold text-ink">{title}</p>
      <div>{children}</div>
    </div>
  );
}

export function Panel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={cn("min-w-0 rounded-3xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(21,25,24,0.02)] sm:p-6", className)}>{children}</section>;
}
