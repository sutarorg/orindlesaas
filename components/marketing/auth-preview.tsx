import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, LockKeyhole } from "lucide-react";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { getCreditPack } from "@/lib/content/pricing";
import { formatNumber } from "@/lib/utils";

export function AuthPreview({ mode, packId }: { mode: "login" | "signup"; packId?: string }) {
  const pack = packId ? getCreditPack(packId) : undefined;
  const isLogin = mode === "login";

  return (
    <main id="main-content" className="bg-soft py-12 sm:py-20">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[26px] border border-line bg-white lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-[520px] overflow-hidden bg-ink p-10 text-white lg:block">
            <LogoMark className="size-10" />
            <div className="absolute -bottom-28 -right-24 size-80 rounded-full border-[64px] border-mint/10" />
            <div className="relative mt-28">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mint">One account. Four products.</p>
              <h2 className="mb-0 mt-5 font-display text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-white">A place for the whole idea, not just one output.</h2>
              <p className="mb-0 mt-5 text-sm leading-7 text-white/60">The authenticated workspace will connect projects, assets, usage and credits in the next implementation stage.</p>
            </div>
          </div>
          <div className="p-6 sm:p-10 lg:p-12">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-teal"><ArrowLeft aria-hidden="true" className="size-3.5" /> Back to Orindle</Link>
            <div className="mt-12 flex size-11 items-center justify-center rounded-xl bg-subtle text-teal"><LockKeyhole aria-hidden="true" className="size-5" /></div>
            <p className="mb-0 mt-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-teal">Account preview</p>
            <h1 className="mb-0 mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">{isLogin ? "Account access is being connected." : "Your workspace starts here—soon."}</h1>
            <p className="mb-0 mt-5 text-sm leading-7 text-body">{isLogin ? "This public frontend does not yet connect to Supabase Auth, so there is no sign-in form to submit. No login attempt is made on this page." : "This public frontend does not create accounts or process payments yet. The authentication and checkout services will be connected in their dedicated implementation stages."}</p>

            {pack && (
              <div className="mt-7 rounded-2xl border border-teal/25 bg-[#f1f9f5] p-5">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal">Your selected pack</p>
                <div className="mt-3 flex items-end justify-between gap-4"><div><h2 className="mb-0 font-display text-xl font-semibold">{pack.name}</h2><p className="mb-0 mt-1 text-xs text-muted">{formatNumber(pack.credits)} shared credits</p></div><p className="m-0 font-display text-2xl font-semibold text-ink">${pack.priceUsd}</p></div>
                <p className="mb-0 mt-4 flex gap-2 border-t border-teal/15 pt-4 text-xs leading-5 text-body"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal" /> No checkout has started, no payment has been taken and no credits have been added.</p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
              <Button asChild><Link href="/features">Explore Products <ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild variant="secondary"><Link href={isLogin ? "/signup" : "/login"}>{isLogin ? "Get Started" : "I already have an account"}</Link></Button>
            </div>
            <p className="mb-0 mt-6 text-xs leading-5 text-muted">Have a question first? <Link href="/contact" className="font-medium text-teal underline underline-offset-4">Visit the contact preview</Link> or <Link href="/pricing" className="font-medium text-teal underline underline-offset-4">review one-time pricing</Link>.</p>
          </div>
        </div>
      </Container>
    </main>
  );
}
