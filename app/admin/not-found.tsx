import Link from "next/link";
import { AdminNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">Admin demo · 404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-ink">Admin destination not found</h1>
      <p className="mt-3 text-sm leading-6 text-body">This destination is not part of the fictional administration workspace. No protected data was requested.</p>
      <div className="mt-5"><AdminNotice title="Use a known workspace">Return to the overview or choose one of the 13 documented admin destinations.</AdminNotice></div>
      <Button asChild className="mt-5"><Link href="/admin">Return to admin overview</Link></Button>
    </div>
  );
}
