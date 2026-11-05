import type { Metadata } from "next";
import { ProjectsWorkspace } from "@/components/dashboard/projects-workspace";
import { workspaceFixture } from "@/lib/dashboard/fixtures";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ project?: string | string[] }> }) {
  const { project: value } = await searchParams;
  const projectId = Array.isArray(value) ? value[0] : value;
  const validProjectId = workspaceFixture.projects.some((project) => project.id === projectId) ? projectId : undefined;
  return <ProjectsWorkspace initialProjectId={validProjectId} />;
}
