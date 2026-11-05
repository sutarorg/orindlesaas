import type { Metadata } from "next";
import { ProjectsWorkspace } from "@/components/dashboard/projects-workspace";
import { requireUser } from "@/lib/server/auth/guards";
import { getWorkspaceSnapshot } from "@/lib/server/workspace/queries";
export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";
export default async function ProjectsPage() { const identity = await requireUser(); return <ProjectsWorkspace data={await getWorkspaceSnapshot(identity.userId)} />; }
