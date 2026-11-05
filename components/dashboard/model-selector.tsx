"use client";

import { ChevronDown, Cpu, Sparkles } from "lucide-react";
import type { ProductId } from "@/lib/contracts/dashboard";
import { getModel, modelsForProduct } from "@/lib/dashboard/models";
import { cn } from "@/lib/utils";

export function ModelSelector({
  id,
  product,
  value,
  onChange,
  allowAuto = false,
  disabled = false,
  className,
}: {
  id: string;
  product: ProductId;
  value: string;
  onChange: (modelId: string) => void;
  allowAuto?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const models = modelsForProduct(product);
  const selected = getModel(value);
  const isAuto = allowAuto && value === "auto";

  function handleChange(next: string) {
    if (allowAuto && next === "auto") {
      onChange("auto");
      return;
    }
    const model = getModel(next);
    if (model?.products.includes(product)) onChange(model.id);
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">Model</label>
      <div className="relative">
        {isAuto ? <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal" aria-hidden="true" /> : <Cpu className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal" aria-hidden="true" />}
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => handleChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-xl border border-line bg-white py-2 pl-10 pr-10 text-sm font-medium text-ink outline-none transition-colors hover:border-muted focus:border-teal focus:ring-2 focus:ring-teal/15 disabled:opacity-60"
        >
          {allowAuto && <option value="auto">Auto · choose a compatible model</option>}
          {models.map((model) => <option key={model.id} value={model.id}>{model.displayName} · {model.provider}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
      <div className="mt-3 rounded-xl bg-soft px-3.5 py-3 text-xs leading-5 text-body">
        {isAuto ? (
          <>
            <p className="font-semibold text-ink">Automatic selection preview</p>
            <p>Chooses from the compatible catalogue in a future backend. No routing or provider request happens here.</p>
          </>
        ) : selected ? (
          <>
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-ink">{selected.provider}</span>
              <code className="break-all rounded bg-white px-1.5 py-0.5 text-[11px] text-teal-dark">{selected.id}</code>
            </div>
            <p>{selected.contextDisplay ?? `${selected.inputModalities.join(", ")} → ${selected.outputModalities.join(", ")}`} · {selected.pricingDisplay}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.featureTags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-medium text-body">{tag}</span>)}
            </div>
          </>
        ) : <p>Select a compatible catalogue fixture.</p>}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted">Catalogue fixture only. Orindle provider access and availability are not connected.</p>
    </div>
  );
}

export function ModelInline({ modelId, className }: { modelId: string; className?: string }) {
  const model = getModel(modelId);
  return <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted", className)}><Cpu className="size-3.5" aria-hidden="true" />{model?.displayName ?? modelId}</span>;
}
