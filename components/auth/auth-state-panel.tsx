import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Clock3, Info, MailCheck } from "lucide-react";
import type { AuthStateContent } from "@/lib/auth/preview-states";
import { cn } from "@/lib/utils";

type PanelIcon = "mail" | "clock" | "check" | "alert" | "info";
const icons = { mail: MailCheck, clock: Clock3, check: CircleCheck, alert: CircleAlert, info: Info };

export function AuthStatePanel({ content, icon = "info", children }: { content: AuthStateContent; icon?: PanelIcon; children?: ReactNode }) {
  const Icon = icons[icon];
  return (
    <div className="rounded-2xl border border-line bg-soft p-6 text-center sm:p-8">
      <div className={cn(
        "mx-auto flex size-12 items-center justify-center rounded-2xl border bg-white",
        content.tone === "error" ? "border-[#efd0cb] text-error" : "border-teal/15 text-teal",
      )}>
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h2 className={cn("mb-0 mt-5 font-display text-xl font-semibold tracking-[-0.025em]", content.tone === "error" ? "text-error" : "text-ink")}>{content.title}</h2>
      <p className="mx-auto mb-0 mt-3 max-w-md text-sm leading-6 text-body">{content.body}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
