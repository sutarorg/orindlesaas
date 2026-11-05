import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";

export function LegalPage({ title, summary, updated, path, children }: { title: string; summary: string; updated: string; path: string; children: ReactNode }) {
  return (
    <main id="main-content" className="py-12 sm:py-16 lg:py-20">
      <Container>
        <Breadcrumbs items={[{ name: title, href: path }]} />
        <header className="max-w-3xl border-b border-line pb-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.17em] text-teal">Orindle policy</p>
          <h1 className="mb-0 text-balance font-display text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.055em]">{title}</h1>
          <p className="mb-0 mt-6 text-lg leading-8 text-body">{summary}</p>
          <p className="mb-0 mt-5 text-xs text-muted">Last updated: {updated}</p>
        </header>
        <div className="mt-8 max-w-3xl rounded-xl border border-line bg-soft p-5 text-xs leading-6 text-muted">
          This is a transparent frontend-stage policy draft. Business entity details, configured service providers and jurisdiction-specific terms require qualified review before a commercial launch.
        </div>
        <article className="mt-4 max-w-3xl">{children}</article>
      </Container>
    </main>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-b border-line py-9 last:border-0 [&_a]:font-medium [&_a]:text-teal [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_li]:text-sm [&_li]:leading-7 [&_li]:text-body [&_p]:text-sm [&_p]:leading-7 [&_p]:text-body [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      <h2 className="mb-4 font-display text-2xl font-semibold tracking-[-0.035em]">{title}</h2>
      {children}
    </section>
  );
}
