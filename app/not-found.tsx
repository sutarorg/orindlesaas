import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SiteHeader />
      <main id="main-content" className="bg-soft py-20 sm:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-teal">404 · Page not found</p>
            <h1 className="mb-0 mt-5 text-balance font-display text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.05] tracking-[-0.055em]">This idea took a different direction.</h1>
            <p className="mb-0 mt-6 text-base leading-7 text-body">The page may have moved, or the link may be incomplete. Return home or explore the four Orindle products.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row"><Button asChild><Link href="/"><ArrowLeft aria-hidden="true" /> Back home</Link></Button><Button asChild variant="secondary"><Link href="/features">Explore Products <ArrowRight aria-hidden="true" /></Link></Button></div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
