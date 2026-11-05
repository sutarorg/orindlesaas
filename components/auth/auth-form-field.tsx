import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AuthFieldControl = {
  id: string;
  required: true;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

type AuthFormFieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  labelAction?: ReactNode;
  className?: string;
  children: (control: AuthFieldControl) => ReactNode;
};

export function AuthFormField({ id, label, hint, error, labelAction, className, children }: AuthFormFieldProps) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-h-6 items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <div className="mt-2">{children({ id, required: true, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}</div>
      {hint && <div id={hintId ?? undefined} className="mt-2 text-xs leading-5 text-muted">{hint}</div>}
      {error && <p id={errorId ?? undefined} className="mb-0 mt-2 text-xs leading-5 text-error">{error}</p>}
    </div>
  );
}
