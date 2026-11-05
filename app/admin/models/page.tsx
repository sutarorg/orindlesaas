import type { Metadata } from "next";
import { ModelsWorkspace } from "@/components/admin/models-workspace";

export const metadata: Metadata = { title: "AI Models" };

export default async function AdminModelsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  return <ModelsWorkspace initialQuery={typeof params.q === "string" ? params.q : ""} />;
}
