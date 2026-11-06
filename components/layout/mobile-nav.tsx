"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { products } from "@/lib/content/products";
import { cn } from "@/lib/utils";

const links = [
  { href: "/features", label: "Features" },
  { href: "/models", label: "AI Models" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = () => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
        aria-label="Open navigation"
        aria-haspopup="dialog"
        aria-controls="mobile-navigation"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label="Site navigation"
        aria-describedby="mobile-nav-description"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 left-auto right-0 z-50 m-0 h-full max-h-none w-[min(420px,100vw)] max-w-full overflow-y-auto border-l border-line bg-white p-0 text-body shadow-2xl outline-none backdrop:bg-ink/25"
      >
        <div className="flex min-h-full flex-col p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={close} aria-label="Orindle home"><Logo /></Link>
            <Button type="button" variant="ghost" size="icon" aria-label="Close navigation" onClick={close}><X aria-hidden="true" className="size-5" /></Button>
          </div>
          <p id="mobile-nav-description" className="sr-only">Navigate Orindle products and public pages.</p>

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
        </div>
      </dialog>
    </>
  );
}
