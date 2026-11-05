import type { Metadata } from "next";
import Link from "next/link";
import { AuthDivider, OAuthButtons } from "@/components/auth/oauth-buttons";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { createMetadata } from "@/lib/site";
import { safeNextPath } from "@/lib/server/auth/safe-redirect";

export const metadata: Metadata = createMetadata({
  title: "Log in",
  description: "Log in securely to your Orindle workspace.",
  path: "/login",
  noindex: true,
});

type LoginPageProps = { searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const initialState = query.reason === "configuration"
    ? { tone: "info" as const, title: "Authentication is not configured", body: "This environment has no Supabase connection. No login or account change can be completed yet." }
    : null;
  const nextPath = safeNextPath(typeof query.next === "string" ? query.next : null);

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
      <LoginForm initialState={initialState} nextPath={nextPath} />
    </AuthShell>
  );
}
