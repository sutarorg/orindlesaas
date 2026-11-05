import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthStatePanel } from "@/components/auth/auth-state-panel";
import { Button } from "@/components/ui/button";
import { getCallbackPreviewState } from "@/lib/auth/preview-states";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Authentication callback",
  description: "Orindle authentication callback presentation. No code exchange or session handling is connected.",
  path: "/auth/callback",
  noindex: true,
});

type CallbackPageProps = { searchParams: Promise<{ state?: string | string[] }> };

export default async function AuthCallbackPage({ searchParams }: CallbackPageProps) {
  const query = await searchParams;
  const content = getCallbackPreviewState(query.state);
  const isError = query.state === "error";
  const isCancelled = query.state === "cancelled";

  return (
    <AuthShell
      eyebrow="Authentication callback"
      title="A secure handoff, by design."
      description="This reserved route demonstrates callback processing, cancellation and error layouts. Real server code exchange belongs to Prompt 5."
    >
      <AuthStatePanel content={content} icon={isError ? "alert" : isCancelled ? "info" : "clock"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild><Link href="/login">Return to login</Link></Button>
          <Button asChild variant="secondary"><Link href="/">Back to website</Link></Button>
        </div>
      </AuthStatePanel>
    </AuthShell>
  );
}
