import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Reset your password",
  description: "Request an Orindle password reset. Frontend authentication preview.",
  path: "/forgot-password",
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Let’s get you back in."
      description="Enter your email to preview the reset-request flow. The connected service will respond generically without revealing whether an account exists."
      footer={<Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal"><ArrowLeft aria-hidden="true" className="size-4" />Back to login</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
