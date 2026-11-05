import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Choose a new password",
  description: "Choose a new password for your Orindle account.",
  path: "/reset-password",
  noindex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Secure account recovery"
      title="Choose a new password."
      description="Use a memorable passphrase you do not use elsewhere. Password managers and paste are welcome. A verified recovery session is required."
      footer={<p className="m-0 text-center text-sm text-muted">Remembered your password? <Link href="/login" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Back to login</Link></p>}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
