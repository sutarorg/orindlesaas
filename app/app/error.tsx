"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[55vh] place-items-center rounded-3xl border border-line bg-white px-6 py-16 text-center">
      <div className="max-w-md">
        <AlertCircle className="mx-auto mb-5 size-10 text-error" aria-hidden="true" />
        <h1 className="mb-3 text-2xl font-semibold tracking-[-0.035em]">This workspace view couldn’t load</h1>
        <p className="mb-6 text-sm leading-6 text-body">The workspace could not be loaded. Retry; no operation should be resubmitted solely because this page failed to render.</p>
        <div className="flex flex-wrap justify-center gap-3"><Button type="button" onClick={reset}><RotateCcw aria-hidden="true" />Try again</Button><Button asChild variant="secondary"><Link href="/app">Back to overview</Link></Button></div>
      </div>
    </div>
  );
}
