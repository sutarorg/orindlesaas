import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { AuthStateTone } from "@/lib/auth/preview-states";
import { cn } from "@/lib/utils";

const styles: Record<AuthStateTone, string> = {
  info: "border-line bg-soft text-body",
  error: "border-[#efd0cb] bg-[#fff8f7] text-body",
  success: "border-teal/20 bg-[#f1f9f5] text-body",
};

export function AuthAlert({ tone, title, body, className }: { tone: AuthStateTone; title: string; body: string; className?: string }) {
  const Icon = tone === "error" ? CircleAlert : tone === "success" ? CircleCheck : Info;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4", styles[tone], className)} role={tone === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4.5 shrink-0", tone === "error" ? "text-error" : "text-teal")} />
      <div>
        <p className={cn("m-0 text-sm font-semibold", tone === "error" ? "text-error" : "text-ink")}>{title}</p>
        <p className="mb-0 mt-1 text-xs leading-5">{body}</p>
      </div>
    </div>
  );
}
