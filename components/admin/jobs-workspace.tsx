"use client";

import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminBadge, AdminDefinitionList, AdminDialog, AdminEmptyState, AdminMetricCard, AdminNotice, AdminPageHeader, AdminPanel, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminJobs, getAdminUser } from "@/lib/admin/fixtures";
import { formatDateTime, formatDuration, formatLabel, matchesAdminQuery, paginate } from "@/lib/admin/format";
import type { AdminJob, AdminJobStatus, AdminPreviewResult } from "@/lib/contracts/admin";
import type { DashboardProduct } from "@/lib/contracts/dashboard";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function JobsWorkspace({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<AdminJobStatus | "all">("all");
  const [product, setProduct] = useState<DashboardProduct | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  const filtered = adminJobs.filter((job) => (status === "all" || job.status === status) && (product === "all" || job.product === product) && matchesAdminQuery(query, job.id, job.modelId, job.provider, job.errorCode, getAdminUser(job.userId)?.name));
  const pagination = paginate(filtered, page, 6);
  function resetFilters() { setQuery(""); setStatus("all"); setProduct("all"); setPage(1); }
  function handleResult(nextResult: AdminPreviewResult) { setResult(nextResult); setSelectedJob(null); }

  return (
    <>
      <AdminPageHeader eyebrow="AI operations" title="Generation Jobs" description="Inspect fictional chat, image, video and website jobs with safe diagnostic metadata. No queue is live and no prompt, customer file or generated code is exposed." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><AdminMetricCard compact label="Queued · demo" value={String(adminJobs.filter((job) => job.status === "queued").length)} detail="Static queue examples" /><AdminMetricCard compact label="Running · demo" value={String(adminJobs.filter((job) => job.status === "running").length)} detail="No active provider job" /><AdminMetricCard compact label="Failed · demo" value={String(adminJobs.filter((job) => job.status === "failed").length)} detail="Safe failure examples" /></div>
      <div className="mb-4 space-y-4"><AdminNotice title="Redacted diagnostics">Error codes and summaries are safe fixture labels. Logs never contain prompts, customer content, signed media URLs, raw provider responses, secrets or stack traces.</AdminNotice><AdminPreviewFeedback result={result} /></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto] lg:items-end">
          <div><label htmlFor="job-search" className="mb-1.5 block text-xs font-semibold text-ink">Search jobs</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="job-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Job ID, model, customer or error code" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div>
          <div><label htmlFor="job-status" className="mb-1.5 block text-xs font-semibold text-ink">Status</label><select id="job-status" value={status} onChange={(event) => { setStatus(event.target.value as AdminJobStatus | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All statuses</option><option value="queued">Queued</option><option value="running">Running</option><option value="completed">Completed</option><option value="failed">Failed</option></select></div>
          <div><label htmlFor="job-product" className="mb-1.5 block text-xs font-semibold text-ink">Product</label><select id="job-product" value={product} onChange={(event) => { setProduct(event.target.value as DashboardProduct | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All products</option><option value="chat">Chat</option><option value="image">Image Studio</option><option value="video">Video Studio</option><option value="website">Websites</option></select></div>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={!query && status === "all" && product === "all"}><RotateCcw aria-hidden="true" />Reset</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminJobs.length} noun="jobs" /></div>
        {pagination.totalItems ? <><AdminTable caption="Generation job monitoring" minWidth={1120}><AdminTableHeader columns={[{ label: "Job identifier" }, { label: "Product" }, { label: "Status" }, { label: "Retries", align: "right" }, { label: "Provider / model" }, { label: "Duration", align: "right" }, { label: "Error" }, { label: "Action", align: "right" }]} /><tbody className="divide-y divide-line">{pagination.items.map((job) => <tr key={job.id}><td className="px-4 py-4"><p className="font-medium text-ink">{job.id}</p><p className="mt-1 text-[11px] text-muted">{formatDateTime(job.createdAt)}</p></td><td className="px-4 py-4"><AdminBadge label={formatLabel(job.product)} /></td><td className="px-4 py-4"><AdminBadge label={job.status} tone={getAdminStatusTone(job.status)} /></td><td className="px-4 py-4 text-right tabular-nums text-ink">{job.retryCount}</td><td className="max-w-56 px-4 py-4 text-xs text-body"><p>{job.provider}</p><p className="mt-1 break-words text-muted">{job.modelId}</p></td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatDuration(job.durationMs)}</td><td className="max-w-44 break-words px-4 py-4 text-xs text-body">{job.errorCode ?? "—"}</td><td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedJob(job)} aria-label={`Inspect ${job.id}`}>Inspect</Button></td></tr>)}</tbody></AdminTable><AdminPagination {...pagination} itemLabel="jobs" onPageChange={setPage} /></> : <AdminEmptyState title="No jobs match these filters" description="Try another product, status, model, customer or error code." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>
      <AdminDialog open={Boolean(selectedJob)} onOpenChange={(open) => { if (!open) setSelectedJob(null); }} title={selectedJob?.id ?? "Job details"} description="Redacted fictional diagnostic view. No customer payload or live provider response is available.">
        {selectedJob && <div className="space-y-6"><AdminDefinitionList items={[{ label: "Product", value: formatLabel(selectedJob.product) }, { label: "Status", value: <AdminBadge label={selectedJob.status} tone={getAdminStatusTone(selectedJob.status)} /> }, { label: "Customer reference", value: `${getAdminUser(selectedJob.userId)?.name ?? selectedJob.userId} · ${selectedJob.userId}` }, { label: "Provider / model", value: `${selectedJob.provider} · ${selectedJob.modelId}` }, { label: "Created", value: formatDateTime(selectedJob.createdAt) }, { label: "Processing duration", value: formatDuration(selectedJob.durationMs) }, { label: "Retry count", value: selectedJob.retryCount }, { label: "Safe error code", value: selectedJob.errorCode ?? "None" }]} /><section className="rounded-xl border border-line bg-soft p-4"><h3 className="text-sm font-semibold text-ink">Redacted diagnostic summary</h3><p className="mt-2 text-sm leading-6 text-body">{selectedJob.diagnosticSummary}</p></section>{selectedJob.status === "failed" && <section><h3 className="text-sm font-semibold text-ink">Retry workflow preview</h3><p className="mt-1 text-xs leading-5 text-muted">A real retry requires scope/state/budget checks and provider idempotency. This preview cannot queue work or deduct credits.</p><div className="mt-4"><ConfirmActionDialog trigger={<Button type="button" variant="secondary">Review retry intent</Button>} title="Preview generation retry" description="Validate a safe retry intent for a fictional failed job." target={selectedJob.id} consequence="Request one authorized, idempotent server retry after budget and current-state checks." confirmLabel="Confirm retry preview" onConfirm={(reason) => mockAdminService.retryJob({ jobId: selectedJob.id, reason, confirmed: true })} onResult={handleResult} /></div></section>}</div>}
      </AdminDialog>
    </>
  );
}
