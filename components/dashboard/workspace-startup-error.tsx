import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Rendered in place of the dashboard shell when the workspace cannot be built at all.
 * Layout errors are not caught by app/app/error.tsx, so this is the only place the user
 * can be given an actionable message instead of the framework's global error page.
 */
export function WorkspaceStartupError({ uninitialized }: { uninitialized: boolean }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 py-16 text-center">
      <div className="max-w-md">
        <AlertCircle className="mx-auto mb-5 size-10 text-error" aria-hidden="true" />
        <h1 className="mb-3 text-2xl font-semibold tracking-[-0.035em]">
          {uninitialized ? "Your workspace isn’t set up yet" : "Your workspace couldn’t load"}
        </h1>
        <p className="mb-6 text-sm leading-6 text-body">
          {uninitialized
            ? "Your account exists but its workspace records are missing, so nothing can be shown yet. Contact support and we’ll finish setting it up."
            : "We couldn’t load your workspace. This is usually temporary — retry in a moment. No credits were deducted."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/app">
              <RotateCcw aria-hidden="true" />
              Try again
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
