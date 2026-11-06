import Link from "next/link";
import { ArrowUpRight, ChevronDown, Image, MessageSquareText, PanelsTopLeft, Video } from "lucide-react";
import { products } from "@/lib/content/products";

const icons = { chat: MessageSquareText, image: Image, video: Video, websites: PanelsTopLeft };

export function ProductsMenu() {
  return (
    <>
      <button
        className="group inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-teal"
        type="button"
        popoverTarget="products-navigation"
        aria-controls="products-navigation"
      >
        Products
        <ChevronDown aria-hidden="true" className="size-3.5 text-muted transition-transform group-aria-expanded:rotate-180" />
      </button>
      <nav
        id="products-navigation"
        popover="auto"
        aria-label="Orindle products"
        className="fixed left-1/2 top-[68px] z-50 m-0 w-[min(390px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-line bg-white p-2 text-body shadow-[0_20px_60px_rgba(21,25,24,0.12)]"
      >
        <div className="flex items-center justify-between px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          <span>One connected workspace</span>
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </div>
        {products.map((product) => {
          const Icon = icons[product.id];
          return (
            <Link key={product.id} href={product.route} className="group/item flex cursor-pointer items-start gap-3 rounded-xl p-3 outline-none transition-colors hover:bg-soft focus-visible:bg-soft">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-teal">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{product.name}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{product.description.split(".")[0]}.</span>
              </span>
            </Link>
          );
        })}
        <div className="mx-3 my-2 border-t border-line" />
        <Link href="/features" className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-teal outline-none hover:bg-soft focus-visible:bg-soft">
          Explore the whole platform
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </nav>
    </>
  );
}
