import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <path d="M3 14V8a5 5 0 0 1 5-5h6v11H3Z" fill="#151918" />
      <path d="M18 3h6a5 5 0 0 1 5 5v6H18V3Z" fill="#087f6a" />
      <path d="M3 18h11v11H8a5 5 0 0 1-5-5v-6Z" fill="#76dfae" />
      <path d="M18 18h11v6a5 5 0 0 1-5 5h-6V18Z" fill="#151918" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="font-display text-[21px] font-semibold tracking-[-0.045em] text-ink">orindle</span>}
    </span>
  );
}
