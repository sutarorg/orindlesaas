"use client";

import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminBadge, AdminDefinitionList, AdminDialog, AdminEmptyState, AdminMetricCard, AdminNotice, AdminPageHeader, AdminPanel, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminWebsites, getAdminUser } from "@/lib/admin/fixtures";
import { formatDateTime, formatLabel, matchesAdminQuery, paginate } from "@/lib/admin/format";
import type { AdminWebsiteProject } from "@/lib/contracts/admin";

export function WebsitesWorkspace() {
  const [query, setQuery] = useState("");
  const [deployment, setDeployment] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedWebsite, setSelectedWebsite] = useState<AdminWebsiteProject | null>(null);
  const filtered = adminWebsites.filter((website) => (deployment === "all" || website.deploymentStatus === deployment) && matchesAdminQuery(query, website.id, website.name, website.domain, getAdminUser(website.userId)?.name, website.failureCode));
  const pagination = paginate(filtered, page, 6);
  function resetFilters() { setQuery(""); setDeployment("all"); setPage(1); }

  return (
    <>
      <AdminPageHeader eyebrow="AI operations" title="Website Projects" description="Review fictional customer project and deployment metadata. Generated source, files, secrets and unrestricted deployment identifiers are excluded." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><AdminMetricCard compact label="Deployed · demo" value={String(adminWebsites.filter((website) => website.deploymentStatus === "deployed").length)} detail="Safe metadata examples" /><AdminMetricCard compact label="Pending · demo" value={String(adminWebsites.filter((website) => website.deploymentStatus === "pending").length)} detail="No active deployment" /><AdminMetricCard compact label="Failed · demo" value={String(adminWebsites.filter((website) => website.deploymentStatus === "failed").length)} detail="Safe failure-code examples" /></div>
      <div className="mb-5"><AdminNotice title="Customer content boundary">This view contains only project owner, status, display domain, deployment state and safe timestamps/codes. It does not authorize or render customer code.</AdminNotice></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_220px_auto] sm:items-end"><div><label htmlFor="website-search" className="mb-1.5 block text-xs font-semibold text-ink">Search website projects</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="website-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Project, owner, domain or failure code" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div><div><label htmlFor="deployment-status" className="mb-1.5 block text-xs font-semibold text-ink">Deployment status</label><select id="deployment-status" value={deployment} onChange={(event) => { setDeployment(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All statuses</option><option value="deployed">Deployed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="not-deployed">Not deployed</option></select></div><Button type="button" variant="ghost" onClick={resetFilters} disabled={!query && deployment === "all"}><RotateCcw aria-hidden="true" />Reset</Button></div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminWebsites.length} noun="website projects" /></div>
        {pagination.totalItems ? <><AdminTable caption="Website project administration" minWidth={1120}><AdminTableHeader columns={[{ label: "Project" }, { label: "Owner" }, { label: "Status" }, { label: "Deployment" }, { label: "Domain" }, { label: "Last deployment" }, { label: "Failure" }, { label: "Action", align: "right" }]} /><tbody className="divide-y divide-line">{pagination.items.map((website) => <tr key={website.id}><td className="px-4 py-4"><p className="font-semibold text-ink">{website.name}</p><p className="mt-0.5 text-[11px] text-muted">{website.id}</p></td><td className="px-4 py-4 text-xs text-body">{getAdminUser(website.userId)?.name ?? website.userId}</td><td className="px-4 py-4"><AdminBadge label={website.status} tone={getAdminStatusTone(website.status)} /></td><td className="px-4 py-4"><AdminBadge label={formatLabel(website.deploymentStatus)} tone={getAdminStatusTone(website.deploymentStatus)} /></td><td className="px-4 py-4 text-xs text-body">{website.domain ?? "Not assigned"}</td><td className="px-4 py-4 text-xs text-body">{website.lastDeploymentAt ? formatDateTime(website.lastDeploymentAt) : "—"}</td><td className="max-w-44 break-words px-4 py-4 text-xs text-body">{website.failureCode ?? "—"}</td><td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedWebsite(website)} aria-label={`View ${website.name}`}>Details</Button></td></tr>)}</tbody></AdminTable><AdminPagination {...pagination} itemLabel="website projects" onPageChange={setPage} /></> : <AdminEmptyState title="No website projects match" description="Try another project, owner, domain or deployment status." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>
      <AdminDialog open={Boolean(selectedWebsite)} onOpenChange={(open) => { if (!open) setSelectedWebsite(null); }} title={selectedWebsite?.name ?? "Website project"} description="Safe fictional project metadata. No generated source, files or environment configuration is included.">
        {selectedWebsite && <AdminDefinitionList items={[{ label: "Project ID", value: selectedWebsite.id }, { label: "Owner", value: `${getAdminUser(selectedWebsite.userId)?.name ?? selectedWebsite.userId} · ${selectedWebsite.userId}` }, { label: "Project status", value: <AdminBadge label={selectedWebsite.status} tone={getAdminStatusTone(selectedWebsite.status)} /> }, { label: "Deployment status", value: <AdminBadge label={formatLabel(selectedWebsite.deploymentStatus)} tone={getAdminStatusTone(selectedWebsite.deploymentStatus)} /> }, { label: "Display domain", value: selectedWebsite.domain ?? "Not assigned" }, { label: "Last deployment", value: selectedWebsite.lastDeploymentAt ? formatDateTime(selectedWebsite.lastDeploymentAt) : "None" }, { label: "Safe failure code", value: selectedWebsite.failureCode ?? "None" }, { label: "Customer code access", value: "Not included or authorized by this view" }]} />}
      </AdminDialog>
    </>
  );
}
