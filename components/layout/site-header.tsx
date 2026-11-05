import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ProductsMenu } from "@/components/layout/products-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/features", label: "Features" },
  { href: "/models", label: "AI Models" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white">
      <Container className="flex h-[72px] items-center justify-between gap-3">
        <Link href="/" aria-label="Orindle home" className="shrink-0 rounded-sm"><Logo /></Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-0.5 lg:flex">
          <ProductsMenu />
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-ink transition-colors hover:bg-soft">{item.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>
          <Button asChild size="sm"><Link href="/signup">Get Started <ArrowUpRight aria-hidden="true" /></Link></Button>
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}
