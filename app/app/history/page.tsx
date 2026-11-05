import type { Metadata } from "next";
import { HistoryWorkspace } from "@/components/dashboard/history-workspace";
import { workspaceFixture } from "@/lib/dashboard/fixtures";

export const metadata: Metadata = { title: "Generation History" };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ project?: string | string[] }> }) {
  const { project: value } = await searchParams;
  const projectId = Array.isArray(value) ? value[0] : value;
  const validProjectId = workspaceFixture.projects.some((project) => project.id === projectId) ? projectId : undefined;
  return <HistoryWorkspace initialProjectId={validProjectId} />;
}
