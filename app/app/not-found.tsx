import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceNotFound() {
  return (
    <div className="grid min-h-[55vh] place-items-center rounded-3xl border border-line bg-white px-6 py-16 text-center">
      <div className="max-w-md">
        <SearchX className="mx-auto mb-5 size-10 text-teal" aria-hidden="true" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal">Demo workspace</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-[-0.035em]">This fixture isn’t available</h1>
        <p className="mb-6 text-sm leading-6 text-body">The route or fixture ID does not match this demo workspace. Nothing was looked up in a private account.</p>
        <Button asChild><Link href="/app">Return to overview</Link></Button>
      </div>
    </div>
  );
}
