"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export function AdminTable({ caption, children, minWidth = 760 }: { caption: string; children: React.ReactNode; minWidth?: number }) {
  return (
    <div role="region" aria-label={`${caption}, scrollable table`} tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-line focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        <caption className="sr-only">{caption}. All records are fictional demo fixtures.</caption>
        {children}
      </table>
    </div>
  );
}

export function AdminTableHeader({ columns }: { columns: readonly { label: string; align?: "left" | "right" }[] }) {
  return (
    <thead className="bg-soft">
      <tr className="border-b border-line">
        {columns.map((column) => (
          <th key={column.label} scope="col" className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted", column.align === "right" && "text-right")}>
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function AdminResultCount({ filtered, total, noun }: { filtered: number; total: number; noun: string }) {
  return (
    <p role="status" aria-live="polite" className="text-xs leading-5 text-muted">
      Showing <span className="font-semibold text-ink">{formatNumber(filtered)}</span> of {formatNumber(total)} demo {noun}
    </p>
  );
}

export function AdminPagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <nav aria-label={`${itemLabel} pagination`} className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-5 text-muted" aria-live="polite">
        {start}–{end} of {formatNumber(totalItems)} demo {itemLabel} · Page {page} of {pageCount}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label={`Previous ${itemLabel} page`}>
          <ChevronLeft aria-hidden="true" />Previous
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Go to ${itemLabel} page ${pageNumber}`}
              aria-current={pageNumber === page ? "page" : undefined}
              className={cn(
                "min-h-10 min-w-10 cursor-pointer rounded-lg px-2 text-xs font-semibold transition-colors",
                pageNumber === page ? "bg-ink text-white" : "text-body hover:bg-soft hover:text-ink",
              )}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label={`Next ${itemLabel} page`}>
          Next<ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
