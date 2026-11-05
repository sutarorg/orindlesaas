import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MotionReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const style = { "--motion-reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <div className={cn("motion-reveal", className)} data-motion-reveal style={style}>
      {children}
    </div>
  );
}
