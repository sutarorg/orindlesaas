import type { Metadata } from "next";
import { AuthPreview } from "@/components/marketing/auth-preview";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Login",
  description: "Orindle account access preview.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  return <AuthPreview mode="login" />;
}
