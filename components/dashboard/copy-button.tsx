"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
  }
  const currentLabel = state === "copied" ? "Copied" : state === "error" ? "Copy failed" : label;
  return (
    <Button type="button" variant="ghost" size="sm" onClick={copy} className={cn("min-h-9 px-2.5 text-xs", className)} aria-label={currentLabel}>
      {state === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{currentLabel}</span>
    </Button>
  );
}
