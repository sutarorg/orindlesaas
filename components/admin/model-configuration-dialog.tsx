"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { AdminBadge, AdminDefinitionList, AdminDialog } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import type { AdminModel, AdminPreviewResult } from "@/lib/contracts/admin";
import type { DashboardProduct } from "@/lib/contracts/dashboard";
import { mockAdminService } from "@/lib/mocks/admin-preview";

const products: readonly { id: DashboardProduct; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "image", label: "Image Studio" },
  { id: "video", label: "Video Studio" },
  { id: "website", label: "Websites" },
];

export function ModelConfigurationDialog({ model, onClose, onResult }: { model: AdminModel; onClose: () => void; onResult: (result: AdminPreviewResult) => void }) {
  const [enabled, setEnabled] = useState(model.enabled);
  const [selectedProducts, setSelectedProducts] = useState<readonly DashboardProduct[]>(model.products);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function review() {
    if (enabled && selectedProducts.length === 0) {
      setError("Select at least one product or mark the model as disabled in this preview.");
      return;
    }
    if (reason.trim().length < 12) {
      setError("Enter at least 12 characters explaining the configuration reason.");
      return;
    }
    setError("");
    setStep("review");
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await mockAdminService.configureModel({ modelId: model.id, enabled, products: selectedProducts, reason: reason.trim(), confirmed: true });
      onResult(result);
      onClose();
    } catch {
      setError("The local preview could not be completed. No model configuration changed.");
      setBusy(false);
    }
  }

  return (
    <AdminDialog open onOpenChange={(open) => { if (!open) onClose(); }} title={`Configure ${model.displayName}`} description="Edit a fictional availability intent. Existing model capabilities remain read-only and no provider configuration is changed.">
      {step === "edit" ? (
        <div className="space-y-5">
          <AdminDefinitionList items={[
            { label: "Model identifier", value: model.id },
            { label: "Provider", value: model.provider },
            { label: "Input modalities", value: model.inputModalities.join(", ") },
            { label: "Output modalities", value: model.outputModalities.join(", ") },
          ]} />
          <div className="rounded-xl border border-line bg-soft p-4">
            <p className="text-xs font-semibold text-ink">Documented model capabilities</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{model.capabilities.map((capability) => <AdminBadge key={capability} label={capability} />)}</div>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="size-4 accent-[#067a67]" />Enabled in this configuration preview</label>
          <fieldset>
            <legend className="text-sm font-semibold text-ink">Product availability</legend>
            <p className="mt-1 text-xs leading-5 text-muted">Select only products supported by the intended future configuration. This does not add model capabilities.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {products.map((product) => (
                <label key={product.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(event) => setSelectedProducts((current) => event.target.checked ? [...current, product.id] : current.filter((item) => item !== product.id))}
                    className="size-4 accent-[#067a67]"
                  />
                  {product.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="model-config-reason" className="block text-sm font-semibold text-ink">Configuration reason</label>
            <textarea id="model-config-reason" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows={3} className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="Explain the catalogue or operational reason" />
          </div>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={review}>Continue to review</Button></div>
        </div>
      ) : (
        <div>
          <div className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4">
            <p className="text-sm font-semibold text-ink">Review model availability preview</p>
            <AdminDefinitionList items={[
              { label: "Model", value: `${model.displayName} · ${model.id}` },
              { label: "Requested state", value: enabled ? "Enabled · preview" : "Disabled · preview" },
              { label: "Products", value: selectedProducts.length ? selectedProducts.join(", ") : "None" },
              { label: "Reason", value: reason.trim() },
            ]} />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">Confirming will not save this availability, contact a provider or affect a customer product.</p>
          {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setStep("edit")} disabled={busy}><ArrowLeft aria-hidden="true" />Back</Button><Button type="button" onClick={() => void confirm()} disabled={busy}>{busy ? "Validating preview…" : "Confirm model preview"}</Button></div>
        </div>
      )}
    </AdminDialog>
  );
}
