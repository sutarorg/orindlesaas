"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdminPreviewResult } from "@/lib/contracts/admin";

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  target,
  consequence,
  confirmLabel,
  onConfirm,
  onResult,
  reasonLabel = "Administrative reason",
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  target: string;
  consequence: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<AdminPreviewResult>;
  onResult: (result: AdminPreviewResult) => void;
  reasonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep("edit");
      setReason("");
      setError("");
      setBusy(false);
    }
  }

  function review() {
    if (reason.trim().length < 12) {
      setError("Enter at least 12 characters explaining the operational reason.");
      return;
    }
    setError("");
    setStep("review");
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await onConfirm(reason.trim());
      onResult(result);
      changeOpen(false);
    } catch {
      setError("The local preview could not be completed. No administrative operation ran.");
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-2xl focus:outline-none sm:p-6">
          <Dialog.Close asChild><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" aria-label={`Close ${title}`}><X aria-hidden="true" /></Button></Dialog.Close>
          <span className="mb-4 grid size-10 place-items-center rounded-xl bg-[#fff2f0] text-error"><AlertTriangle className="size-5" aria-hidden="true" /></span>
          <Dialog.Title className="pr-8 text-xl font-semibold tracking-[-0.03em] text-ink">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-body">{description}</Dialog.Description>

          {step === "edit" ? (
            <div className="mt-5">
              <dl className="rounded-xl border border-line bg-soft p-4 text-sm">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Target</dt>
                <dd className="mt-1 break-words font-medium text-ink">{target}</dd>
                <dt className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Requested consequence in production</dt>
                <dd className="mt-1 leading-6 text-body">{consequence}</dd>
              </dl>
              <label htmlFor={`reason-${title.replace(/\W/g, "-")}`} className="mt-5 block text-sm font-semibold text-ink">{reasonLabel}</label>
              <p id={`hint-${title.replace(/\W/g, "-")}`} className="mt-1 text-xs leading-5 text-muted">Required for the future audit record. This demo stores nothing.</p>
              <textarea
                id={`reason-${title.replace(/\W/g, "-")}`}
                value={reason}
                onChange={(event) => { setReason(event.target.value); setError(""); }}
                aria-describedby={`hint-${title.replace(/\W/g, "-")}`}
                aria-invalid={Boolean(error)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
                placeholder="Explain the support, reconciliation or operational reason"
              />
              {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild><Button type="button" variant="secondary">Cancel</Button></Dialog.Close>
                <Button type="button" onClick={review}>Continue to review</Button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4">
                <p className="text-sm font-semibold text-ink">Review the preview intent</p>
                <dl className="mt-3 space-y-3 text-sm leading-6">
                  <div><dt className="text-xs text-muted">Target</dt><dd className="break-words font-medium text-ink">{target}</dd></div>
                  <div><dt className="text-xs text-muted">Requested consequence</dt><dd className="text-body">{consequence}</dd></div>
                  <div><dt className="text-xs text-muted">Reason</dt><dd className="break-words text-body">{reason.trim()}</dd></div>
                </dl>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">Confirming demonstrates the UI only. No real mutation or audit write will occur.</p>
              {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setStep("edit")} disabled={busy}><ArrowLeft aria-hidden="true" />Back</Button>
                <Button type="button" onClick={() => void confirm()} disabled={busy} className="bg-error hover:bg-[#8f1d14]">{busy ? "Validating preview…" : confirmLabel}</Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
