"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AdminDefinitionList, AdminDialog } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getAdminModel } from "@/lib/admin/fixtures";
import { formatDate, formatMoney } from "@/lib/admin/format";
import type { AdminModelPrice, AdminPreviewResult } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function PricingConfigurationDialog({ price, onClose, onResult }: { price: AdminModelPrice; onClose: () => void; onResult: (result: AdminPreviewResult) => void }) {
  const model = getAdminModel(price.modelId);
  const [providerCost, setProviderCost] = useState(String(price.providerCostCentsPerUnit));
  const [customerCredits, setCustomerCredits] = useState(String(price.customerCreditsPerUnit));
  const [effectiveAt, setEffectiveAt] = useState(price.effectiveAt.slice(0, 10));
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const providerCostNumber = Number(providerCost);
  const customerCreditsNumber = Number(customerCredits);

  function review() {
    if (!Number.isInteger(providerCostNumber) || providerCostNumber < 0) {
      setError("Provider cost must be a non-negative integer number of USD cents.");
      return;
    }
    if (!Number.isInteger(customerCreditsNumber) || customerCreditsNumber <= 0) {
      setError("Customer credits must be a positive integer.");
      return;
    }
    if (!effectiveAt || Number.isNaN(new Date(`${effectiveAt}T00:00:00Z`).getTime())) {
      setError("Choose a valid effective date.");
      return;
    }
    if (reason.trim().length < 12) {
      setError("Enter at least 12 characters explaining the pricing reason.");
      return;
    }
    setError("");
    setStep("review");
  }

  async function confirm() {
    setBusy(true);
    try {
      const result = await mockAdminService.updateModelPricing({ modelId: price.modelId, providerCostCentsPerUnit: providerCostNumber, customerCreditsPerUnit: customerCreditsNumber, effectiveAt: `${effectiveAt}T00:00:00.000Z`, reason: reason.trim(), confirmed: true });
      onResult(result);
      onClose();
    } catch {
      setError("The local preview could not be completed. No price version changed.");
      setBusy(false);
    }
  }

  return (
    <AdminDialog open onOpenChange={(open) => { if (!open) onClose(); }} title={`Edit pricing · ${model?.displayName ?? price.modelId}`} description="Prepare a fictional price-version intent. Internal provider cost is restricted demo data; no price is saved or used for a charge.">
      {step === "edit" ? (
        <div className="space-y-5">
          <AdminDefinitionList items={[{ label: "Model identifier", value: price.modelId }, { label: "Demo meter", value: price.unitLabel }, { label: "Current demo version", value: price.version }, { label: "Current effective date", value: formatDate(price.effectiveAt) }]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="provider-cost-cents" className="block text-sm font-semibold text-ink">Provider cost · USD cents</label><p className="mt-1 text-xs text-muted">Integer cost per demo unit</p><input id="provider-cost-cents" type="number" min="0" step="1" value={providerCost} onChange={(event) => { setProviderCost(event.target.value); setError(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
            <div><label htmlFor="customer-credits" className="block text-sm font-semibold text-ink">Customer credits</label><p className="mt-1 text-xs text-muted">Positive integer per demo unit</p><input id="customer-credits" type="number" min="1" step="1" value={customerCredits} onChange={(event) => { setCustomerCredits(event.target.value); setError(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
          </div>
          <div><label htmlFor="price-effective-date" className="block text-sm font-semibold text-ink">Requested effective date · UTC</label><input id="price-effective-date" type="date" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
          <div><label htmlFor="pricing-reason" className="block text-sm font-semibold text-ink">Pricing change reason</label><textarea id="pricing-reason" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows={3} className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="Explain the cost, pricing or reconciliation reason" /></div>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={review}>Continue to review</Button></div>
        </div>
      ) : (
        <div>
          <div className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4"><p className="text-sm font-semibold text-ink">Review price-version preview</p><div className="mt-4"><AdminDefinitionList items={[{ label: "Model / meter", value: `${price.modelId} · ${price.unitLabel}` }, { label: "Provider cost", value: `${formatMoney(providerCostNumber)} per demo unit` }, { label: "Customer price", value: `${customerCreditsNumber} credits (${formatMoney(customerCreditsNumber)} usage value)` }, { label: "Effective date", value: `${effectiveAt} · UTC` }, { label: "Reason", value: reason.trim() }]} /></div></div>
          <p className="mt-3 text-xs leading-5 text-muted">No immutable version, effective configuration or historical usage record will be created or changed.</p>
          {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setStep("edit")} disabled={busy}><ArrowLeft aria-hidden="true" />Back</Button><Button type="button" onClick={() => void confirm()} disabled={busy}>{busy ? "Validating preview…" : "Confirm pricing preview"}</Button></div>
        </div>
      )}
    </AdminDialog>
  );
}
