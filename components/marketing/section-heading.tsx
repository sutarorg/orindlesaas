import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, align = "left", className }: { eyebrow: string; title: string; description?: string; align?: "left" | "center"; className?: string }) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-teal before:h-px before:w-6 before:bg-teal after:content-none">
        <span className={cn(align === "center" && "mx-auto")}>{eyebrow}</span>
      </p>
      <h2 className="mb-0 text-balance font-display text-[clamp(1.9rem,4vw,3.15rem)] font-semibold leading-[1.1] tracking-[-0.045em] text-ink">{title}</h2>
      {description && <p className="mb-0 mt-5 max-w-2xl text-pretty text-base leading-7 text-body sm:text-lg sm:leading-8">{description}</p>}
    </div>
  );
}
