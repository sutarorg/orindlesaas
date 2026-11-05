import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthCallback } from "@/components/auth/auth-callback";
import { safeNextPath } from "@/lib/server/auth/safe-redirect";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Authentication callback",
  description: "Complete a secure Orindle authentication code exchange.",
  path: "/auth/callback",
  noindex: true,
});

type CallbackPageProps = {
  searchParams: Promise<{ code?: string | string[]; next?: string | string[]; error?: string | string[] }>;
};

export default async function AuthCallbackPage({ searchParams }: CallbackPageProps) {
  const query = await searchParams;
  return (
    <AuthShell
      eyebrow="Authentication callback"
      title="A secure handoff, by design."
      description="Orindle verifies the one-time callback code before creating a session. Callback URLs never grant credits or assign account privileges."
    >
      <AuthCallback
        code={typeof query.code === "string" ? query.code : undefined}
        nextPath={safeNextPath(typeof query.next === "string" ? query.next : null)}
        providerError={typeof query.error === "string"}
      />
    </AuthShell>
  );
}
