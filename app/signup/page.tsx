import type { Metadata } from "next";
import { AuthPreview } from "@/components/marketing/auth-preview";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Get Started",
  description: "Orindle account and credit-pack selection preview.",
  path: "/signup",
  noindex: true,
});

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ pack?: string | string[] }> }) {
  const { pack } = await searchParams;
  const packId = typeof pack === "string" ? pack : undefined;
  return <AuthPreview mode="signup" packId={packId} />;
}
