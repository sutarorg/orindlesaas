import type { Metadata } from "next";
import { ProvidersWorkspace } from "@/components/admin/providers-workspace";

export const metadata: Metadata = { title: "Providers" };

export default function AdminProvidersPage() {
  return <ProvidersWorkspace />;
}
