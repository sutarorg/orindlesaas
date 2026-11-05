import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthStatePanel } from "@/components/auth/auth-state-panel";
import { VerificationForm } from "@/components/auth/verification-form";
import { Button } from "@/components/ui/button";
import { getVerificationPreviewState } from "@/lib/auth/preview-states";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Verify your email",
  description: "Verify your Orindle account email. Frontend authentication preview.",
  path: "/verify-email",
  noindex: true,
});

type VerifyPageProps = { searchParams: Promise<{ state?: string | string[] }> };

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const query = await searchParams;
  const view = query.state === "success" ? "success" : query.state === "expired" ? "expired" : "required";
  const content = getVerificationPreviewState(view === "required" ? undefined : view);

  return (
    <AuthShell
      eyebrow="Email confirmation"
      title={view === "success" ? "You’re ready to continue." : view === "expired" ? "A fresh link can help." : "Check your inbox."}
      description="Email verification helps confirm account ownership in the connected product. This page demonstrates the interface only."
      footer={<p className="m-0 text-center text-sm text-muted">Want to choose another method? <Link href="/login" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Back to login</Link></p>}
    >
      <AuthStatePanel content={content} icon={view === "success" ? "check" : view === "expired" ? "alert" : "mail"}>
        {view === "success" && <Button asChild><Link href="/login">Continue to login</Link></Button>}
      </AuthStatePanel>
      {view !== "success" && <VerificationForm />}
    </AuthShell>
  );
}
