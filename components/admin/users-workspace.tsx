"use client";

import { RotateCcw, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminBadge, AdminDefinitionList, AdminDialog, AdminEmptyState, AdminMetricCard, AdminPageHeader, AdminPanel, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminPayments, adminUsageEvents, adminUsers, getAdminPackage } from "@/lib/admin/fixtures";
import { formatCredits, formatDate, formatDateTime, formatMoney, matchesAdminQuery, paginate } from "@/lib/admin/format";
import type { AdminPreviewResult, AdminUser, AdminUserStatus } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function UsersWorkspace({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<AdminUserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  const filtered = adminUsers.filter((user) => (status === "all" || user.status === status) && matchesAdminQuery(query, user.name, user.email, user.id));
  const pagination = paginate(filtered, page, 6);

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setPage(1);
  }

  function handleActionResult(nextResult: AdminPreviewResult) {
    setResult(nextResult);
    setSelectedUser(null);
  }

  const purchases = selectedUser ? adminPayments.filter((payment) => payment.userId === selectedUser.id) : [];
  const usage = selectedUser ? adminUsageEvents.filter((event) => event.userId === selectedUser.id) : [];
  const nextStatus: AdminUserStatus = selectedUser?.status === "suspended" ? "active" : "suspended";

  return (
    <>
      <AdminPageHeader eyebrow="Customer operations" title="User management" description="Find fictional accounts, inspect safe purchase and usage references, and review account-action intents without changing a user or session." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AdminMetricCard compact label="Fixture users" value={String(adminUsers.length)} detail="Fictional account records" />
        <AdminMetricCard compact label="Active" value={String(adminUsers.filter((user) => user.status === "active").length)} detail="Demo account status only" />
        <AdminMetricCard compact label="Needs review" value={String(adminUsers.filter((user) => user.status !== "active").length)} detail="Review or suspended demo accounts" />
      </div>
      <div className="mb-4"><AdminPreviewFeedback result={result} /></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto] lg:items-end">
          <div>
            <label htmlFor="user-search" className="mb-1.5 block text-xs font-semibold text-ink">Search users</label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="user-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Name, email or user ID" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
          </div>
          <div>
            <label htmlFor="user-status" className="mb-1.5 block text-xs font-semibold text-ink">Account status</label>
            <select id="user-status" value={status} onChange={(event) => { setStatus(event.target.value as AdminUserStatus | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All statuses</option><option value="active">Active</option><option value="review">Review</option><option value="suspended">Suspended</option></select>
          </div>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={!query && status === "all"}><RotateCcw aria-hidden="true" />Reset filters</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminUsers.length} noun="users" /></div>
        {pagination.totalItems ? (
          <>
            <AdminTable caption="User management" minWidth={900}>
              <AdminTableHeader columns={[{ label: "User" }, { label: "Status" }, { label: "Credit balance", align: "right" }, { label: "Created" }, { label: "Last activity" }, { label: "Action", align: "right" }]} />
              <tbody className="divide-y divide-line">
                {pagination.items.map((user) => (
                  <tr key={user.id} className="hover:bg-soft/60">
                    <td className="px-4 py-4"><p className="font-semibold text-ink">{user.name}</p><p className="mt-0.5 text-xs text-body">{user.email}</p><p className="mt-1 text-[11px] text-muted">{user.id}</p></td>
                    <td className="px-4 py-4"><AdminBadge label={user.status} tone={getAdminStatusTone(user.status)} /></td>
                    <td className="px-4 py-4 text-right tabular-nums font-medium text-ink">{formatCredits(user.creditBalance)}</td>
                    <td className="px-4 py-4 text-xs text-body">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4 text-xs text-body">{formatDate(user.lastActiveAt)}</td>
                    <td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedUser(user)} aria-label={`View ${user.name}`}><UserRound aria-hidden="true" />View</Button></td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
            <AdminPagination {...pagination} itemLabel="users" onPageChange={setPage} />
          </>
        ) : <AdminEmptyState title="No users match these filters" description="Try another name, email, user ID or account status." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>

      <AdminDialog open={Boolean(selectedUser)} onOpenChange={(open) => { if (!open) setSelectedUser(null); }} title={selectedUser?.name ?? "User details"} description="Fictional account operations view. No credentials, private files or real customer record are available.">
        {selectedUser && (
          <div className="space-y-6">
            <AdminDefinitionList items={[
              { label: "User ID", value: selectedUser.id },
              { label: "Email · fictional", value: selectedUser.email },
              { label: "Account status", value: <AdminBadge label={selectedUser.status} tone={getAdminStatusTone(selectedUser.status)} /> },
              { label: "Credit balance · demo", value: `${formatCredits(selectedUser.creditBalance)} credits` },
              { label: "Created", value: formatDateTime(selectedUser.createdAt) },
              { label: "Last fixture activity", value: formatDateTime(selectedUser.lastActiveAt) },
            ]} />
            <section>
              <h3 className="text-sm font-semibold text-ink">Purchase history · demo</h3>
              {purchases.length ? <ul className="mt-3 divide-y divide-line rounded-xl border border-line">{purchases.map((payment) => <li key={payment.id} className="flex flex-col gap-2 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-ink">{getAdminPackage(payment.packageId)?.name} · {formatMoney(payment.amountCents)}</p><p className="mt-0.5 break-words text-muted">{payment.providerPaymentId} · {formatDate(payment.createdAt)}</p></div><AdminBadge label={payment.status} tone={getAdminStatusTone(payment.status)} /></li>)}</ul> : <p className="mt-2 text-sm text-body">No purchase fixtures for this user.</p>}
            </section>
            <section>
              <h3 className="text-sm font-semibold text-ink">Usage history · demo</h3>
              {usage.length ? <ul className="mt-3 divide-y divide-line rounded-xl border border-line">{usage.map((event) => <li key={event.id} className="p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-ink">{event.product} · {event.creditsDeducted} credits</p><AdminBadge label={event.reconciliationStatus} tone={getAdminStatusTone(event.reconciliationStatus)} /></div><p className="mt-1 break-words text-muted">{event.jobId} · {event.modelId} · {formatDate(event.occurredAt)}</p></li>)}</ul> : <p className="mt-2 text-sm text-body">No usage fixtures for this user.</p>}
            </section>
            <section className="rounded-xl border border-line bg-soft p-4">
              <h3 className="text-sm font-semibold text-ink">Account-related action previews</h3>
              <p className="mt-1 text-xs leading-5 text-muted">Each intent requires a reason and review. No account, status or session changes in this phase.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ConfirmActionDialog
                  trigger={<Button type="button" variant="secondary">{nextStatus === "suspended" ? "Preview suspension" : "Preview restoration"}</Button>}
                  title={nextStatus === "suspended" ? "Preview account suspension" : "Preview account restoration"}
                  description="Review the future account-status workflow with a fictional user."
                  target={`${selectedUser.name} · ${selectedUser.id}`}
                  consequence={`Set the demo account status to ${nextStatus} in a future authorized backend.`}
                  confirmLabel="Confirm status preview"
                  onConfirm={(reason) => mockAdminService.updateUserStatus({ userId: selectedUser.id, status: nextStatus, reason, confirmed: true })}
                  onResult={handleActionResult}
                />
                <ConfirmActionDialog
                  trigger={<Button type="button" variant="secondary">Preview session invalidation</Button>}
                  title="Preview session invalidation"
                  description="Review the future security workflow without accessing or revoking a real session."
                  target={`${selectedUser.name} · ${selectedUser.id}`}
                  consequence="Invalidate eligible active sessions after verified server authorization and step-up checks."
                  confirmLabel="Confirm session preview"
                  onConfirm={(reason) => mockAdminService.invalidateUserSessions({ userId: selectedUser.id, reason, confirmed: true })}
                  onResult={handleActionResult}
                />
              </div>
            </section>
          </div>
        )}
      </AdminDialog>
    </>
  );
}
