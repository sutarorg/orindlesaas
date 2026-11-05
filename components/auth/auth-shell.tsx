import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Clapperboard, Info, MessagesSquare, PanelsTopLeft, WandSparkles } from "lucide-react";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/layout/logo";
import type { ProductId } from "@/lib/content/products";

const products: { key: ProductId; label: string; icon: typeof MessagesSquare }[] = [
  { key: "chat", label: "Orindle Chat", icon: MessagesSquare },
  { key: "image", label: "Image Studio", icon: WandSparkles },
  { key: "video", label: "Video Studio", icon: Clapperboard },
  { key: "websites", label: "Websites", icon: PanelsTopLeft },
];

export function AuthShell({ eyebrow, title, description, children, footer }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main id="main-content" className="py-8 sm:py-12 lg:py-16">
      <Container className="max-w-6xl">
        <div className="grid overflow-hidden rounded-[24px] border border-line bg-white shadow-soft lg:grid-cols-[0.88fr_1.12fr] lg:rounded-[28px]">
          <aside className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col xl:p-12" aria-label="Orindle platform">
            <div aria-hidden="true" className="absolute -right-24 top-28 size-64 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-10 top-42 size-36 rounded-full border border-mint/15" />
            <div className="relative flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white"><LogoMark className="size-8" /></span>
              <span className="font-display text-xl font-semibold tracking-[-0.03em]">Orindle</span>
            </div>
            <div className="relative mt-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-mint">One account. Four products.</p>
              <p className="mb-0 mt-4 max-w-sm font-display text-[32px] font-semibold leading-[1.16] tracking-[-0.035em]">A quieter place to begin your next idea.</p>
              <p className="mb-0 mt-4 max-w-sm text-sm leading-7 text-white/70">Bring conversation, images, motion and websites into one connected workspace.</p>
              <ul className="m-0 mt-8 list-none space-y-3 p-0">
                {products.map(({ key, label, icon: Icon }) => (
                  <li key={key} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/80">
                    <Icon aria-hidden="true" className="size-4 text-mint" />{label}
                  </li>
                ))}
              </ul>
            </div>
            <p className="relative mb-0 mt-auto pt-12 text-xs leading-5 text-white/60">Shared credits are the planned connected-account model. No credits are purchased or added here.</p>
          </aside>

          <div className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mx-auto w-full max-w-xl">
              <div className="flex items-center justify-between gap-4">
                <LogoMark className="size-9 lg:hidden" />
                <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-semibold text-muted no-underline outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-teal"><ArrowLeft aria-hidden="true" className="size-3.5" />Back to website</Link>
              </div>
              <div className="mt-7 sm:mt-9">
                <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-dark">{eyebrow}</p>
                <h1 className="mb-0 mt-3 font-display text-[clamp(2rem,4vw,2.6rem)] font-semibold leading-[1.14] tracking-[-0.035em] text-ink">{title}</h1>
                <p className="mb-0 mt-3 text-sm leading-6 text-muted">{description}</p>
              </div>
              <div className="mt-6 flex gap-3 rounded-xl bg-soft p-4 text-xs leading-5 text-body">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal" />
                <p className="m-0"><strong className="font-semibold text-ink">Frontend preview:</strong> local interactions only. No account, email, OAuth provider or session service is connected.</p>
              </div>
              <div className="mt-7">{children}</div>
              {footer && <div className="mt-7 border-t border-line pt-6">{footer}</div>}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
