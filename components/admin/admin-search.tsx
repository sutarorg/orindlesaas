"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminDemoBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getAdminSearchResults } from "@/lib/admin/search";

export function AdminSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = getAdminSearchResults(query);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="secondary" size="sm" className="px-3 xl:min-w-56 xl:justify-start" aria-label="Search admin fixtures">
          <Search aria-hidden="true" /><span className="hidden xl:inline">Search operations…</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[8dvh] z-[90] max-h-[84dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-2xl focus:outline-none sm:p-6">
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Close admin search"><X aria-hidden="true" /></Button></Dialog.Close>
          <div className="flex items-center gap-3 pr-10">
            <Dialog.Title className="text-xl font-semibold tracking-[-0.03em] text-ink">Search admin fixtures</Dialog.Title>
            <AdminDemoBadge label="Local only" />
          </div>
          <Dialog.Description className="mt-2 text-sm leading-6 text-body">Find navigation, fictional users, models, payment references or job IDs. No database or private account is searched.</Dialog.Description>
          <label htmlFor="admin-global-search" className="mt-5 block text-sm font-semibold text-ink">Search by name, ID or reference</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="admin-global-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Maya, GPT, pay_demo or job_demo"
              className="min-h-12 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
            />
          </div>
          <div className="mt-3 min-h-5" role="status" aria-live="polite">
            {query.trim().length >= 2 && <p className="text-xs text-muted">{results.length} local fixture {results.length === 1 ? "result" : "results"}{results.length === 8 ? " (first 8)" : ""}</p>}
          </div>
          {query.trim().length < 2 ? (
            <p className="rounded-xl bg-soft px-4 py-5 text-sm leading-6 text-body">Enter at least two characters. Results stay in this browser and are not an authorization result.</p>
          ) : results.length ? (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {results.map((result) => (
                <li key={`${result.category}-${result.id}`}>
                  <Link href={result.href} onClick={() => setOpen(false)} className="group flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-soft">
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-ink">{result.label}</span>
                      <span className="mt-0.5 block break-words text-xs leading-5 text-muted">{result.category} · {result.detail}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-teal" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-body">No fixtures match “{query.trim()}”. Try a user name, model ID or demo reference.</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
