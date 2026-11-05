import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { creditPacks } from "@/lib/content/pricing";
import { formatNumber, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {creditPacks.map((pack) => (
        <article key={pack.id} id={pack.id} className={cn("relative flex flex-col rounded-2xl border bg-white p-6 sm:p-7", pack.featured ? "border-teal shadow-[0_12px_40px_rgba(8,127,106,0.08)]" : "border-line")}>
          {pack.featured && <span className="absolute right-5 top-5 rounded-full bg-mint px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-dark">Most flexible</span>}
          <h3 className="m-0 text-sm font-semibold text-ink">{pack.name}</h3>
          <p className="mb-0 mt-2 text-xs text-muted">{pack.fit}</p>
          <div className="mt-7 flex items-end gap-2">
            <span className="font-display text-5xl font-semibold tracking-[-0.055em] text-ink">${pack.priceUsd}</span>
            <span className="pb-1.5 text-xs text-muted">one-time</span>
          </div>
          <p className="mb-0 mt-3 text-sm font-semibold text-teal">{formatNumber(pack.credits)} credits</p>
          {!compact && <p className="mb-0 mt-5 text-sm leading-6 text-body">{pack.description}</p>}
          <ul className="my-7 space-y-3 border-t border-line pt-6 text-sm text-body">
            {["No recurring subscription", "Shared across all four products", "One connected usage history"].map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal" />{benefit}</li>
            ))}
          </ul>
          <Button asChild variant={pack.featured ? "teal" : "secondary"} className="mt-auto w-full">
            <Link href={`/signup?pack=${pack.id}`}>Choose {pack.name} <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </article>
      ))}
    </div>
  );
}
