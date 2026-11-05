import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";

export type Breadcrumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  const allItems = [{ name: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {allItems.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight aria-hidden="true" className="size-3" />}
            {index === allItems.length - 1 ? (
              <span aria-current="page" className="text-body">{item.name}</span>
            ) : (
              <Link href={item.href} className="rounded-sm underline-offset-4 hover:text-teal hover:underline">{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: allItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.href),
        })),
      }} />
    </nav>
  );
}
