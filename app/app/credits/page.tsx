import type { Metadata } from "next";
import { CreditsWorkspace } from "@/components/dashboard/credits-workspace";

export const metadata: Metadata = { title: "Credits & Wallet" };

export default function CreditsPage() {
  return <CreditsWorkspace />;
}
