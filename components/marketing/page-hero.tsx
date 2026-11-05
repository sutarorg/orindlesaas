import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs, type Breadcrumb } from "@/components/marketing/breadcrumbs";
import { cn } from "@/lib/utils";

export function PageHero({ eyebrow, title, description, children, actions, breadcrumbs, className }: { eyebrow: string; title: string; description: string; children?: ReactNode; actions?: ReactNode; breadcrumbs?: Breadcrumb[]; className?: string }) {
  return (
    <section className={cn("border-b border-line bg-soft py-12 sm:py-16 lg:py-20", className)}>
      <Container>
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className={cn("grid items-center gap-10", children && "lg:grid-cols-[0.9fr_1.1fr] lg:gap-16")}>
          <div className="max-w-3xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.17em] text-teal">{eyebrow}</p>
            <h1 className="mb-0 text-balance font-display text-[clamp(2.5rem,6vw,4.8rem)] font-semibold leading-[1.04] tracking-[-0.055em] text-ink">{title}</h1>
            <p className="mb-0 mt-6 max-w-2xl text-pretty text-base leading-7 text-body sm:text-lg sm:leading-8">{description}</p>
            {actions && <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">{actions}</div>}
          </div>
          {children && <div>{children}</div>}
        </div>
      </Container>
    </section>
  );
}
