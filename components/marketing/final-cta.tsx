import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function FinalCta({ title = "Your next idea deserves one connected workspace.", description = "Explore a clearer way to move from first thought to finished creative work." }: { title?: string; description?: string }) {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[26px] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
          <div aria-hidden="true" className="absolute -right-16 -top-24 size-72 rounded-full border-[54px] border-mint/10" />
          <div aria-hidden="true" className="absolute bottom-0 right-24 h-24 w-px rotate-45 bg-mint/30" />
          <div className="relative max-w-3xl">
            <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-mint"><Sparkles aria-hidden="true" className="size-4" /> Start with an idea</p>
            <h2 className="mb-0 text-balance font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-white">{title}</h2>
            <p className="mb-0 mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">{description}</p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
              <Button asChild variant="mint" size="lg"><Link href="/signup">Get Started <ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild variant="secondary" size="lg" className="border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/10"><Link href="/features">Explore Products</Link></Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
