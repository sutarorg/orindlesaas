"use client";

import { ArrowRight, FolderKanban, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ActionFeedback, DemoBadge, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, DashboardProduct, ProjectFixture } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { productLabels, searchMatches } from "@/lib/dashboard/format";
import { getModel } from "@/lib/dashboard/models";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";

function generationHref(product: DashboardProduct, projectId: string | null) {
  if (product === "chat") return "/app/chat/conv-campaign";
  if (product === "image") return "/app/image-studio#results";
  if (product === "video") return "/app/video-studio#jobs";
  return projectId === "project-retreat" ? "/app/websites/site-stillwater/editor" : "/app/websites";
}

export function ProjectsWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<DashboardProduct | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialProjectId ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProduct, setNewProduct] = useState<DashboardProduct>("chat");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const projects = workspaceFixture.projects.filter((project) => (product === "all" || project.product === product) && searchMatches([project.name, project.description], query));
  const selectedProject = workspaceFixture.projects.find((project) => project.id === selectedId);
  const related = selectedProject ? workspaceFixture.generations.filter((generation) => generation.projectId === selectedProject.id) : [];

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (newName.trim().length < 2) {
      setValidationError("Enter a project name of at least 2 characters.");
      return;
    }
    setValidationError("");
    const response = await previewDashboardService.saveProject({ name: newName.trim(), product: newProduct });
    setResult({ ...response, message: `“${newName.trim()}” passed local validation. No project was created or added to this fixture list.` });
    setNewName("");
  }

  async function renameProject(event: FormEvent, project: ProjectFixture) {
    event.preventDefault();
    if (editingName.trim().length < 2) {
      setValidationError("Enter a project name of at least 2 characters.");
      return;
    }
    setValidationError("");
    const response = await previewDashboardService.saveProject({ projectId: project.id, name: editingName.trim(), product: project.product });
    setResult({ ...response, message: `The name “${editingName.trim()}” was validated locally. “${project.name}” remains unchanged and nothing was saved.` });
    setEditingId(null);
  }

  async function deleteProject(project: ProjectFixture) {
    const response = await previewDashboardService.deleteProject({ projectId: project.id });
    setResult({ ...response, message: `Delete for “${project.name}” was confirmed locally only. The project and its related generations remain unchanged.` });
  }

  return (
    <>
      <PageHeader eyebrow="Workspace · shared projects" title="Projects" description="Organize the thread across conversation, images, motion and websites. Create, rename and delete controls are validation previews; the fixture list never mutates." actions={<><DemoBadge /><Button type="button" onClick={() => setShowCreate((value) => !value)} aria-expanded={showCreate}><Plus aria-hidden="true" />New project</Button></>} />
      {showCreate && <Panel className="mb-5"><form onSubmit={(event) => void createProject(event)}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-[-0.025em]">New project preview</h2><Button type="button" variant="ghost" size="icon" onClick={() => setShowCreate(false)} aria-label="Close new project form"><X aria-hidden="true" /></Button></div><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end"><div><label htmlFor="new-project-name" className="mb-2 block text-sm font-semibold text-ink">Project name</label><input id="new-project-name" value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={80} className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" placeholder="e.g. Autumn campaign" /></div><div><label htmlFor="new-project-product" className="mb-2 block text-sm font-semibold text-ink">Starting product</label><select id="new-project-product" value={newProduct} onChange={(event) => setNewProduct(event.target.value as DashboardProduct)} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal">{(Object.keys(productLabels) as DashboardProduct[]).map((id) => <option key={id} value={id}>{productLabels[id]}</option>)}</select></div><Button type="submit" size="lg">Validate project</Button></div></form></Panel>}
      {validationError && <p role="alert" className="mb-4 rounded-2xl border border-error/20 bg-[#fff5f3] p-3 text-sm font-medium text-error">{validationError}</p>}
      <ActionFeedback result={result} />

      {selectedProject && <Panel className="mt-5 border-teal/20"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">Selected project fixture</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{selectedProject.name}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-body">{selectedProject.description}</p></div><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>Close details<X aria-hidden="true" /></Button></div><div className="mt-5 border-t border-line pt-4"><h3 className="mb-3 text-sm font-semibold">Related generations <span className="font-normal text-muted">({related.length})</span></h3>{related.length ? <ul className="grid gap-2 lg:grid-cols-2">{related.map((generation) => { const model = getModel(generation.modelId); return <li key={generation.id}><Link href={generationHref(generation.product, generation.projectId)} className="flex items-center gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-teal/25 hover:bg-soft"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{generation.title}</p><p className="mt-1 text-[11px] text-muted">{model?.displayName ?? generation.modelId} · {generation.createdLabel}</p></div><StatusBadge status={generation.status} /><ArrowRight className="size-4 shrink-0 text-muted" aria-hidden="true" /></Link></li>; })}</ul> : <p className="text-sm text-muted">No related generation fixtures.</p>}</div></Panel>}

      <div className="my-6 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><label htmlFor="project-search" className="sr-only">Search projects</label><input id="project-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project fixtures…" className="min-h-11 w-full rounded-xl bg-soft pl-10 pr-4 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/20" /></div><div><label htmlFor="project-product-filter" className="sr-only">Filter projects by product</label><select id="project-product-filter" value={product} onChange={(event) => setProduct(event.target.value as DashboardProduct | "all")} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal sm:w-auto"><option value="all">All products</option>{(Object.keys(productLabels) as DashboardProduct[]).map((id) => <option key={id} value={id}>{productLabels[id]}</option>)}</select></div></div>

      {projects.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{projects.map((project) => <article key={project.id} className="flex min-h-64 flex-col rounded-3xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(21,25,24,0.02)]"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#edf7f2] text-teal"><FolderKanban className="size-5" aria-hidden="true" /></span><span className="rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-semibold capitalize text-body">{project.status} fixture</span></div><p className="mb-1 mt-5 text-[11px] font-semibold text-teal">{productLabels[project.product]}</p>{editingId === project.id ? <form onSubmit={(event) => void renameProject(event, project)} className="space-y-2"><label htmlFor={`rename-${project.id}`} className="sr-only">Rename {project.name}</label><input id={`rename-${project.id}`} value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={80} className="min-h-11 w-full rounded-xl border border-teal px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-teal/15" autoFocus /><div className="flex gap-2"><Button type="submit" size="sm">Validate name</Button><Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button></div></form> : <h2 className="text-lg font-semibold tracking-[-0.025em]">{project.name}</h2>}<p className="mt-2 text-sm leading-6 text-body">{project.description}</p><p className="mt-2 text-[11px] text-muted">Updated {project.updatedLabel} · {project.generationIds.length} related fixtures</p><div className="mt-auto flex flex-wrap gap-1 border-t border-line pt-3"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(project.id)}>Details</Button><Button type="button" variant="ghost" size="sm" onClick={() => { setEditingId(project.id); setEditingName(project.name); }}><Pencil aria-hidden="true" />Rename</Button><ConfirmDialog title={`Delete ${project.name}?`} description="This previews the project deletion confirmation. Related fixture generations would need an explicit backend policy in a real product." confirmLabel="Validate delete" trigger={<Button type="button" variant="ghost" size="sm" className="text-error"><Trash2 aria-hidden="true" />Delete</Button>} onConfirm={() => deleteProject(project)} /></div></article>)}</div> : <><EmptyState title="No project fixtures match" description="Try a different search or product filter. The underlying fixture list has not been changed." /><div className="mt-4 text-center"><Button type="button" variant="secondary" onClick={() => { setQuery(""); setProduct("all"); }}>Clear filters</Button></div></>}
    </>
  );
}
