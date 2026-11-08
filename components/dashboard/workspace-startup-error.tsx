import { AlertCircle, RotateCcw, ShieldAlert, UserX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type WorkspaceStartupReason = "uninitialized" | "inactive" | "unavailable";

const content: Record<WorkspaceStartupReason, { title: string; body: string; action: "retry" | "support" | "none" }> = {
  uninitialized: {
    title: "Your workspace isn’t set up yet",
    body: "Your account exists but its workspace records are missing, so nothing can be shown yet. Contact support and we’ll finish setting it up.",
    action: "support",
  },
  inactive: {
    title: "This account can’t open the workspace",
    body: "The account is signed in but is not currently active, so the workspace stays closed. If you believe this is a mistake, contact support.",
    action: "support",
  },
  unavailable: {
    title: "Your workspace couldn’t load",
    body: "We couldn’t load your workspace. This is usually temporary — retry in a moment. No credits were deducted.",
    action: "retry",
  },
};

const icons = { uninitialized: UserX, inactive: ShieldAlert, unavailable: AlertCircle } as const;

/**
 * Rendered in place of the dashboard shell when the workspace cannot be built at all.
 * Layout errors are not caught by app/app/error.tsx, so this is the only place the user
 * can be given an actionable message instead of the framework's global error page.
 */
export function WorkspaceStartupError({ reason }: { reason: WorkspaceStartupReason }) {
  const { title, body, action } = content[reason];
  const Icon = icons[reason];
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 py-16 text-center">
      <div className="max-w-md">
        <Icon className="mx-auto mb-5 size-10 text-error" aria-hidden="true" />
        <h1 className="mb-3 text-2xl font-semibold tracking-[-0.035em]">{title}</h1>
        <p className="mb-6 text-sm leading-6 text-body">{body}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {action === "retry" && (
            <Button asChild>
              <Link href="/app">
                <RotateCcw aria-hidden="true" />
                Try again
              </Link>
            </Button>
          )}
          {action === "support" && (
            <Button asChild>
              <Link href="/support">Contact support</Link>
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link href="/">Back to website</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
