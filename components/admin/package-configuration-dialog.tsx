"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AdminDefinitionList, AdminDialog } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/admin/format";
import type { AdminCreditPackage, AdminPreviewResult } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function PackageConfigurationDialog({ creditPackage, onClose, onResult }: { creditPackage: AdminCreditPackage; onClose: () => void; onResult: (result: AdminPreviewResult) => void }) {
  const [price, setPrice] = useState((creditPackage.priceCents / 100).toFixed(2));
  const [credits, setCredits] = useState(String(creditPackage.credits));
  const [enabled, setEnabled] = useState(creditPackage.enabled);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const creditsNumber = Number(credits);
  const priceCents = Math.round(Number(price) * 100);

  function review() {
    if (!/^\d+(\.\d{1,2})?$/.test(price) || !Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a positive USD price with no more than two decimal places.");
      return;
    }
    if (!Number.isInteger(creditsNumber) || creditsNumber <= 0) {
      setError("Credits must be a positive integer.");
      return;
    }
    if (reason.trim().length < 12) {
      setError("Enter at least 12 characters explaining the package-change reason.");
      return;
    }
    setError("");
    setStep("review");
  }

  async function confirm() {
    setBusy(true);
    try {
      const result = await mockAdminService.updateCreditPackage({ packageId: creditPackage.id, priceCents, credits: creditsNumber, enabled, reason: reason.trim(), confirmed: true });
      onResult(result);
      onClose();
    } catch {
      setError("The local preview could not be completed. No credit package changed.");
      setBusy(false);
    }
  }

  return (
    <AdminDialog open onOpenChange={(open) => { if (!open) onClose(); }} title={`Configure ${creditPackage.name}`} description="Prepare a fictional credit-package version. The displayed fixture and any future checkout remain unchanged.">
      {step === "edit" ? <div className="space-y-5">
        <div className="rounded-xl border border-line bg-soft p-4 text-sm text-body">Initial demo values: <span className="font-semibold text-ink">{creditPackage.name} · {formatMoney(creditPackage.priceCents)} · {creditPackage.credits.toLocaleString("en-US")} credits</span>.</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="package-price" className="block text-sm font-semibold text-ink">One-time price · USD</label><input id="package-price" type="number" min="0.01" step="0.01" value={price} onChange={(event) => { setPrice(event.target.value); setError(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
          <div><label htmlFor="package-credits" className="block text-sm font-semibold text-ink">Credits</label><input id="package-credits" type="number" min="1" step="1" value={credits} onChange={(event) => { setCredits(event.target.value); setError(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 accent-[#067a67]" />Enabled in this package preview</label>
        <div><label htmlFor="package-reason" className="block text-sm font-semibold text-ink">Package change reason</label><textarea id="package-reason" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows={3} className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="Explain the pricing or catalogue reason" /></div>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={review}>Continue to review</Button></div>
      </div> : <div>
        <div className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4"><p className="text-sm font-semibold text-ink">Review package preview</p><div className="mt-4"><AdminDefinitionList items={[{ label: "Package", value: creditPackage.name }, { label: "Requested price", value: formatMoney(priceCents) }, { label: "Requested credits", value: `${creditsNumber.toLocaleString("en-US")} credits` }, { label: "Customer usage value", value: `${formatMoney(creditsNumber)} · not received revenue` }, { label: "Requested state", value: enabled ? "Enabled · preview" : "Disabled · preview" }, { label: "Reason", value: reason.trim() }]} /></div></div>
        <p className="mt-3 text-xs leading-5 text-muted">No price version, active package, checkout or customer wallet will change.</p>
        {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setStep("edit")} disabled={busy}><ArrowLeft aria-hidden="true" />Back</Button><Button type="button" onClick={() => void confirm()} disabled={busy}>{busy ? "Validating preview…" : "Confirm package preview"}</Button></div>
      </div>}
    </AdminDialog>
  );
}
