"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  trigger,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  trigger: React.ReactNode;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    setOpen(false);
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-white p-6 shadow-2xl focus:outline-none">
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Close confirmation"><X aria-hidden="true" /></Button></Dialog.Close>
          <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-[#fff2f0] text-error"><AlertTriangle className="size-5" aria-hidden="true" /></span>
          <Dialog.Title className="text-xl font-semibold tracking-[-0.03em]">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-body">{description}</Dialog.Description>
          <p className="mt-3 rounded-xl bg-soft px-3 py-2 text-xs leading-5 text-muted">Demo safeguard: confirming validates the interaction only. Nothing will be deleted or saved.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Dialog.Close asChild><Button type="button" variant="secondary">Cancel</Button></Dialog.Close><Button type="button" variant="primary" onClick={() => void confirm()} disabled={busy} className="bg-error hover:bg-[#8f1d14]">{busy ? "Validating…" : confirmLabel}</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
