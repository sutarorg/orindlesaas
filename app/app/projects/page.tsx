import type { Metadata } from "next";
import { ProjectsWorkspace } from "@/components/dashboard/projects-workspace";
import { getRequestWorkspace } from "@/lib/server/workspace/request-cache";
export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";
export default async function ProjectsPage() { const data = await getRequestWorkspace(); return <ProjectsWorkspace data={data} />; }
