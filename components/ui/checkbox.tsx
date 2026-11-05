import * as React from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line accent-teal outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}
