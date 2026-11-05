import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthStatePanel } from "@/components/auth/auth-state-panel";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { getResetPreviewState } from "@/lib/auth/preview-states";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Choose a new password",
  description: "Choose a new Orindle account password. Frontend authentication preview.",
  path: "/reset-password",
  noindex: true,
});

type ResetPageProps = { searchParams: Promise<{ state?: string | string[] }> };

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  const query = await searchParams;
  const expired = getResetPreviewState(query.state);

  return (
    <AuthShell
      eyebrow="Secure account recovery"
      title={expired ? "Reset link unavailable." : "Choose a new password."}
      description={expired ? "Request a fresh link to continue the recovery flow." : "Use a memorable passphrase you do not use elsewhere. Password managers and paste are welcome."}
      footer={<p className="m-0 text-center text-sm text-muted">Remembered your password? <Link href="/login" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Back to login</Link></p>}
    >
      {expired ? (
        <AuthStatePanel content={expired} icon="alert">
          <Button asChild><Link href="/forgot-password">Request a new reset link</Link></Button>
        </AuthStatePanel>
      ) : <ResetPasswordForm />}
    </AuthShell>
  );
}
