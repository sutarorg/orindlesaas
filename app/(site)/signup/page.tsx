import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthDivider, OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignupForm } from "@/components/auth/signup-form";
import { getSignupPreviewState, parsePackId } from "@/lib/auth/preview-states";
import { getCreditPack } from "@/lib/content/pricing";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Create your account",
  description: "Create one Orindle account for Chat, Image Studio, Video Studio and Websites. Frontend authentication preview.",
  path: "/signup",
  noindex: true,
});

type SignupPageProps = { searchParams: Promise<{ state?: string | string[]; pack?: string | string[] }> };

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const query = await searchParams;
  const packId = parsePackId(query.pack);
  const pack = packId ? getCreditPack(packId) : undefined;

  return (
    <AuthShell
      eyebrow="One account. Every product."
      title="Start with your next idea."
      description="Set up your details for a connected creative workspace. You can explore the product before choosing a credit pack."
      footer={<p className="m-0 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Log in</Link></p>}
    >
      <OAuthButtons intent="signup" />
      <AuthDivider />
      <SignupForm initialState={getSignupPreviewState(query.state)} pack={pack} />
    </AuthShell>
  );
}
