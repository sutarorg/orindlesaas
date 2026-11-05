"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { products } from "@/lib/content/products";

const links = [
  { href: "/features", label: "Features" },
  { href: "/models", label: "AI Models" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation" className="lg:hidden">
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,100vw)] flex-col overflow-y-auto border-l border-line bg-white p-6 shadow-2xl outline-none sm:p-8" aria-describedby="mobile-nav-description">
          <div className="flex items-center justify-between">
            <Dialog.Title asChild><Link href="/" onClick={close} aria-label="Orindle home"><Logo /></Link></Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation"><X aria-hidden="true" className="size-5" /></Button>
            </Dialog.Close>
          </div>
          <Dialog.Description id="mobile-nav-description" className="sr-only">Navigate Orindle products and public pages.</Dialog.Description>

          <nav aria-label="Mobile navigation" className="mt-10 flex-1">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Products</p>
            <div className="grid grid-cols-2 gap-2">
              {products.map((product) => (
                <Link key={product.id} href={product.route} onClick={close} className="flex min-h-20 flex-col justify-between rounded-xl border border-line bg-soft p-3 text-sm font-semibold text-ink transition-colors hover:border-teal/40">
                  {product.shortName}
                  <ArrowUpRight aria-hidden="true" className="size-4 self-end text-teal" />
                </Link>
              ))}
            </div>
            <div className="my-7 h-px bg-line" />
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={close} className="flex min-h-12 items-center justify-between rounded-lg px-2 font-display text-xl font-medium tracking-[-0.03em] text-ink hover:bg-soft">
                    {link.label}<ArrowUpRight aria-hidden="true" className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-6">
            <Button asChild variant="secondary"><Link href="/login" onClick={close}>Login</Link></Button>
            <Button asChild><Link href="/signup" onClick={close}>Get Started</Link></Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
