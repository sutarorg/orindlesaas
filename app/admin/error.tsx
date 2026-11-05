"use client";

import { AdminNotice } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink">This admin view couldn’t be displayed</h1>
      <p className="mt-3 text-sm leading-6 text-body">The fixture workspace hit a local rendering error. No administrative operation was performed.</p>
      <div className="mt-5"><AdminNotice title="Safe retry" tone="warning">Retry only rerenders the local view. It does not resubmit a payment, provider or credit mutation.</AdminNotice></div>
      <Button type="button" className="mt-5" onClick={reset}>Retry this view</Button>
    </div>
  );
}
