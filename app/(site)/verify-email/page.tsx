import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthStatePanel } from "@/components/auth/auth-state-panel";
import { VerificationForm } from "@/components/auth/verification-form";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Verify your email",
  description: "Verify your Orindle account email.",
  path: "/verify-email",
  noindex: true,
});

export default function VerifyEmailPage() {
  return (
    <AuthShell
      eyebrow="Email confirmation"
      title="Check your inbox."
      description="Use the secure link in your confirmation email to verify account ownership. A verified callback is required before this flow can report success."
      footer={<p className="m-0 text-center text-sm text-muted">Want to choose another method? <Link href="/login" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Back to login</Link></p>}
    >
      <AuthStatePanel content={{ tone: "info", title: "Confirm your email", body: "Open the link in your confirmation email. If it has expired or is unavailable, request a new verification email below." }} icon="mail" />
      <VerificationForm />
    </AuthShell>
  );
}
