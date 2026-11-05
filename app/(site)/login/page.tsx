import type { Metadata } from "next";
import Link from "next/link";
import { AuthDivider, OAuthButtons } from "@/components/auth/oauth-buttons";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getLoginPreviewState } from "@/lib/auth/preview-states";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Log in",
  description: "Log in to your Orindle workspace. Frontend authentication preview.",
  path: "/login",
  noindex: true,
});

type LoginPageProps = { searchParams: Promise<{ state?: string | string[]; provider?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const initialState = getLoginPreviewState(query.state, query.provider);

  return (
    <AuthShell
      eyebrow="Your Orindle workspace"
      title="Welcome back."
      description="Log in to continue your creative work across Chat, Image Studio, Video Studio and Websites."
      footer={
        <div className="text-center">
          <p className="m-0 text-sm text-muted">Don’t have an account? <Link href="/signup" className="font-semibold text-teal-dark no-underline hover:text-ink focus-visible:ring-2 focus-visible:ring-teal">Sign up</Link></p>
          <p className="mb-0 mt-4 text-[11px] leading-5 text-muted">By continuing, you agree to Orindle’s <Link href="/terms" className="font-semibold text-ink no-underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-ink no-underline">Privacy Policy</Link>.</p>
        </div>
      }
    >
      <OAuthButtons intent="login" />
      <AuthDivider />
      <LoginForm initialState={initialState} />
    </AuthShell>
  );
}
