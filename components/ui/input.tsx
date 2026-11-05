import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none transition-colors placeholder:text-muted hover:border-muted focus:border-teal focus:ring-2 focus:ring-teal/15 aria-invalid:border-error aria-invalid:focus:border-error aria-invalid:focus:ring-error/15",
        className,
      )}
      {...props}
    />
  );
}
