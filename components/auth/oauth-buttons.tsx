"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { GitHubIcon, GoogleIcon } from "@/components/brand/provider-icons";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/auth-alert";
import type { OAuthProvider } from "@/lib/contracts/authentication";
import { authenticationService } from "@/lib/auth/supabase-service";

export function OAuthButtons({ intent }: { intent: "login" | "signup" }) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleOAuth(provider: OAuthProvider) {
    setPending(provider);
    setResult(null);
    try {
      const response = await authenticationService.beginOAuth({ provider, intent });
      setResult(response.message);
      if (response.status === "redirect") window.location.assign(response.url);
    } catch {
      setResult("The provider could not be opened. No account was accessed.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="secondary" className="w-full" onClick={() => void handleOAuth("google")} disabled={pending !== null} aria-busy={pending === "google"}>
          {pending === "google" ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <GoogleIcon />}
          {pending === "google" ? "Checking Google…" : "Continue with Google"}
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void handleOAuth("github")} disabled={pending !== null} aria-busy={pending === "github"}>
          {pending === "github" ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <GitHubIcon />}
          {pending === "github" ? "Checking GitHub…" : "Continue with GitHub"}
        </Button>
      </div>
      <p className="mb-0 mt-3 text-center text-[11px] leading-5 text-muted">A provider opens only after you choose it. Availability depends on the configured Supabase providers.</p>
      {result && <AuthAlert tone="info" title="OAuth status" body={result} className="mt-4" />}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-medium text-muted">or continue with email</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
