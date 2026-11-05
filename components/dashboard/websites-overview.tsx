import Link from "next/link";
import { ArrowUpRight, Globe2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel } from "@/components/dashboard/ui";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";

export function WebsitesOverview({ data }: { data: WorkspaceSnapshot }) {
  return <><PageHeader eyebrow="Create · Websites" title="Website projects" description="Your generated static websites, source validation state and deployment history." actions={<Button asChild><Link href="/app/websites/new"><Plus />New website</Link></Button>} />{data.projects.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.projects.map((project) => <Panel key={project.id} className="flex min-h-56 flex-col"><span className="mb-5 grid size-11 place-items-center rounded-2xl bg-blue-soft text-[#3c5f9d]"><Globe2 className="size-5" /></span><h2 className="text-lg font-semibold">{project.name}</h2><p className="mt-2 text-xs capitalize text-muted">{project.status.replaceAll("_", " ")} · {project.slug}</p><p className="mt-2 text-xs text-muted">Updated {new Date(project.updatedAt).toLocaleDateString()}</p><div className="mt-auto flex gap-2 pt-5"><Button asChild size="sm"><Link href={`/app/websites/${project.id}/editor`}>Open editor<ArrowUpRight /></Link></Button><Button asChild size="sm" variant="ghost"><Link href={`/app/websites/${project.id}/settings`}>Settings</Link></Button></div></Panel>)}</div> : <EmptyState title="No websites yet" description="Generate a static site from your brief. Source validation runs before it can be deployed." action={{ label: "Create your first website", href: "/app/websites/new" }} icon={<Globe2 />} />}</>;
}
