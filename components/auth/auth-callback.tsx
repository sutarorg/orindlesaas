"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthStatePanel } from "@/components/auth/auth-state-panel";
import { Button } from "@/components/ui/button";
import { authenticationService } from "@/lib/auth/supabase-service";
import type { AuthStateContent } from "@/lib/auth/preview-states";

const processing: AuthStateContent = {
  tone: "info",
  title: "Verifying your secure sign-in link",
  body: "Wait while Orindle exchanges the one-time code. Do not close this page.",
};

export function AuthCallback({ code, nextPath, providerError }: { code?: string; nextPath: string; providerError: boolean }) {
  const [content, setContent] = useState<AuthStateContent>(processing);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    async function completeCallback() {
      if (providerError || !code) {
        setContent({ tone: "error", title: "This sign-in link could not be used", body: "The provider cancelled the request or the code is missing. Return to login and request a new link." });
        return;
      }
      try {
        const result = await authenticationService.completeEmailVerification({ code, next: nextPath });
        if (!active) return;
        if (result.status === "success") {
          setContent({ tone: "success", title: "Your sign-in is verified", body: "The secure session was created. Opening your workspace…" });
          setComplete(true);
          window.location.assign(nextPath);
        } else {
          setContent({ tone: "error", title: "error" in result && result.error.code === "unavailable" ? "Authentication is not configured" : "This link is invalid or expired", body: result.message });
        }
      } catch {
        if (active) setContent({ tone: "error", title: "Verification could not be completed", body: "No session change was confirmed. Return to login and try again." });
      }
    }
    void completeCallback();
    return () => { active = false; };
  }, [code, nextPath, providerError]);

  return (
    <AuthStatePanel content={content} icon={complete ? "check" : content.tone === "error" ? "alert" : "clock"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild><Link href="/login">Return to login</Link></Button>
        <Button asChild variant="secondary"><Link href="/">Back to website</Link></Button>
      </div>
    </AuthStatePanel>
  );
}
