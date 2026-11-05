import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { products } from "@/lib/content/products";

const groups = [
  {
    title: "Platform",
    links: [
      { href: "/features", label: "Features" },
      { href: "/models", label: "AI Models" },
      { href: "/pricing", label: "Pricing" },
      { href: "/credits-policy", label: "Credits Policy" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Guides & insights" },
      { href: "/faq", label: "FAQs" },
      { href: "/about", label: "About Orindle" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-soft">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Orindle home" className="inline-flex rounded-sm"><Logo /></Link>
            <p className="mt-5 max-w-xs font-display text-xl font-medium leading-7 tracking-[-0.03em] text-ink">Everything AI.<br />One Platform.</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">A connected workspace for conversations, images, video and websites.</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">Products</h2>
            <ul className="mt-5 space-y-3.5">
              {products.map((product) => <li key={product.id}><Link className="text-sm text-body underline-offset-4 hover:text-teal hover:underline" href={product.route}>{product.name}</Link></li>)}
            </ul>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">{group.title}</h2>
              <ul className="mt-5 space-y-3.5">
                {group.links.map((link) => <li key={link.href}><Link className="text-sm text-body underline-offset-4 hover:text-teal hover:underline" href={link.href}>{link.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-5 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">© {new Date().getFullYear()} Orindle. Thoughtful AI, connected.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="underline-offset-4 hover:text-teal hover:underline">Privacy</Link>
            <Link href="/terms" className="underline-offset-4 hover:text-teal hover:underline">Terms</Link>
            <Link href="/contact" className="inline-flex items-center gap-1 font-medium text-teal underline-offset-4 hover:underline">Talk to us <ArrowUpRight aria-hidden="true" className="size-3" /></Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
