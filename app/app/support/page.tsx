import type { Metadata } from "next";
import { SupportWorkspace } from "@/components/dashboard/support-workspace";

export const metadata: Metadata = { title: "Help & Support" };

export default function SupportPage() {
  return <SupportWorkspace />;
}
