"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminBadge, AdminDefinitionList, AdminDialog, AdminMetricCard, AdminNotice, AdminPageHeader, AdminPanel, AdminPanelHeader, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminAuditEvents, adminDisputes, adminUsers, getAdminUser } from "@/lib/admin/fixtures";
import { formatCredits, formatDateTime, formatLabel, formatMoney } from "@/lib/admin/format";
import type { AdminAuditPreview, AdminPreviewResult, CreditAdjustmentIntent } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function AdjustmentsWorkspace() {
  const [userId, setUserId] = useState(adminUsers[0]?.id ?? "");
  const [credits, setCredits] = useState("100");
  const [category, setCategory] = useState<CreditAdjustmentIntent["category"]>("correction");
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  const [auditPreviews, setAuditPreviews] = useState<readonly AdminAuditPreview[]>([]);
  const creditsNumber = Number(credits);
  const selectedUser = getAdminUser(userId);

  function reviewAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) { setError("Select a valid fixture user."); return; }
    if (!Number.isInteger(creditsNumber) || creditsNumber === 0 || Math.abs(creditsNumber) > 100_000) { setError("Enter a non-zero integer between -100,000 and 100,000 credits."); return; }
    if (reference.trim().length < 4) { setError("Enter a support ticket or change reference (at least 4 characters)."); return; }
    if (reason.trim().length < 12) { setError("Enter at least 12 characters explaining the adjustment reason."); return; }
    setError("");
    setReviewOpen(true);
  }

  async function confirmAdjustment() {
    if (!selectedUser) return;
    setBusy(true);
    setError("");
    try {
      const nextResult = await mockAdminService.adjustCredits({ userId: selectedUser.id, credits: creditsNumber, category, reference: reference.trim(), reason: reason.trim(), confirmed: true });
      setResult(nextResult);
      if (nextResult.auditPreview) setAuditPreviews((current) => [nextResult.auditPreview as AdminAuditPreview, ...current]);
      setReviewOpen(false);
    } catch {
      setError("The local preview could not be completed. No credits or audit record changed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader eyebrow="Revenue operations" title="Adjustments & Disputes" description="Prepare reasoned credit-adjustment and dispute-review intents. Every value is fictional; no balance, payment, dispute or audit store is changed." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><AdminMetricCard compact label="Open dispute fixtures" value={String(adminDisputes.filter((dispute) => dispute.status !== "resolved-fixture").length)} detail="Fictional review queue" /><AdminMetricCard compact label="Credits changed" value="0" detail="Hard-coded no-operation adapter result" /><AdminMetricCard compact label="Audit records persisted" value="0" detail="Previews are ephemeral only" /></div>
      <div className="mb-5 space-y-4"><AdminNotice title="Production safeguard contract" tone="warning">Real credit adjustments require verified `credits:adjust` permission, step-up authentication, substantive reason/reference, bounded integer validation, idempotency, and a transactional append-only ledger plus audit event. This frontend deliberately implements none of those backend operations.</AdminNotice><AdminPreviewFeedback result={result} /></div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminPanel>
          <AdminPanelHeader title="Credit adjustment preview" description="Complete the intent, then review the exact target and signed amount in a confirmation dialog." />
          <form onSubmit={reviewAdjustment} className="space-y-4">
            <div><label htmlFor="adjustment-user" className="block text-sm font-semibold text-ink">Fixture user</label><select id="adjustment-user" value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15">{adminUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.id}</option>)}</select></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="adjustment-credits" className="block text-sm font-semibold text-ink">Signed credits</label><input id="adjustment-credits" type="number" step="1" min="-100000" max="100000" value={credits} onChange={(event) => { setCredits(event.target.value); setError(""); }} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" aria-describedby="adjustment-credits-hint" /><p id="adjustment-credits-hint" className="mt-1 text-xs text-muted">Positive to propose a grant; negative to propose a deduction.</p></div><div><label htmlFor="adjustment-category" className="block text-sm font-semibold text-ink">Category</label><select id="adjustment-category" value={category} onChange={(event) => setCategory(event.target.value as CreditAdjustmentIntent["category"])} className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="correction">Correction</option><option value="goodwill">Goodwill</option><option value="dispute">Dispute</option></select></div></div>
            <div><label htmlFor="adjustment-reference" className="block text-sm font-semibold text-ink">Support ticket or change reference</label><input id="adjustment-reference" type="text" value={reference} onChange={(event) => { setReference(event.target.value); setError(""); }} placeholder="e.g. SUP-DEMO-1043" className="mt-2 min-h-11 w-full rounded-xl border border-line px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
            <div><label htmlFor="adjustment-reason" className="block text-sm font-semibold text-ink">Substantive administrative reason</label><textarea id="adjustment-reason" value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} rows={4} placeholder="Explain the evidence and why this adjustment is necessary" className="mt-2 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div>
            {error && <p role="alert" className="rounded-xl border border-error/20 bg-[#fff5f3] px-3 py-2 text-sm text-error">{error}</p>}
            <Button type="submit">Review adjustment preview</Button>
          </form>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title="Audit record previews" description="New previews exist only in this component’s memory. Existing examples are fictional and none proves a real operation." />
          {auditPreviews.length > 0 && <section className="mb-5"><h3 className="text-sm font-semibold text-ink">This session · not persisted</h3><ul className="mt-3 space-y-3">{auditPreviews.map((event) => <li key={event.id} className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-words text-sm font-semibold text-ink">{event.action}</p><AdminBadge label="Not persisted" tone="warning" /></div><p className="mt-2 text-sm font-medium text-ink">{event.summary}</p><p className="mt-1 break-words text-xs leading-5 text-body">{event.targetType} · {event.targetId} · {event.reference}</p><p className="mt-2 text-xs leading-5 text-body">{event.reason}</p><p className="mt-2 text-[11px] text-muted">{event.actorLabel} · {formatDateTime(event.createdAt)}</p></li>)}</ul></section>}
          <section><h3 className="text-sm font-semibold text-ink">Fictional audit examples</h3><ul className="mt-3 space-y-3">{adminAuditEvents.map((event) => <li key={event.id} className="rounded-xl border border-line p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-words text-sm font-semibold text-ink">{event.action}</p><AdminBadge label="Demo fixture" /></div><p className="mt-2 text-sm font-medium text-ink">{event.summary}</p><p className="mt-1 break-words text-xs leading-5 text-body">{event.targetType} · {event.targetId} · {event.reference}</p><p className="mt-2 text-xs leading-5 text-body">{event.reason}</p><p className="mt-2 text-[11px] text-muted">{event.actorLabel} · {formatDateTime(event.createdAt)} · not persisted</p></li>)}</ul></section>
        </AdminPanel>
      </div>

      <AdminPanel className="mt-5">
        <AdminPanelHeader title="Dispute review" description="Payment-dispute fixtures only. No refund, chargeback, evidence or ledger operation is available." />
        <AdminTable caption="Adjustments and disputes" minWidth={1080}>
          <AdminTableHeader columns={[{ label: "Dispute / payment" }, { label: "Customer" }, { label: "Amount", align: "right" }, { label: "Category" }, { label: "Status" }, { label: "Updated" }, { label: "Action", align: "right" }]} />
          <tbody className="divide-y divide-line">{adminDisputes.map((dispute) => { const nextStatus = dispute.status === "under-review" ? "resolved-fixture" : "under-review"; return <tr key={dispute.id}><td className="px-4 py-4"><p className="font-medium text-ink">{dispute.id}</p><p className="mt-1 text-[11px] text-muted">{dispute.paymentId}</p></td><td className="px-4 py-4 text-xs text-body">{getAdminUser(dispute.userId)?.name ?? dispute.userId}</td><td className="px-4 py-4 text-right tabular-nums text-ink">{formatMoney(dispute.amountCents)} {dispute.currency}</td><td className="px-4 py-4 text-xs text-body">{formatLabel(dispute.category)}</td><td className="px-4 py-4"><AdminBadge label={formatLabel(dispute.status)} tone={getAdminStatusTone(dispute.status)} /></td><td className="px-4 py-4 text-xs text-body">{formatDateTime(dispute.updatedAt)}</td><td className="px-4 py-4 text-right"><ConfirmActionDialog trigger={<Button type="button" variant="ghost" size="sm" aria-label={`Review ${dispute.id}`}><ShieldAlert aria-hidden="true" />Review</Button>} title={`Review ${dispute.id}`} description="Prepare a fictional dispute-state intent without changing payment, evidence or credits." target={`${dispute.id} · ${dispute.paymentId}`} consequence={`Move the dispute to ${formatLabel(nextStatus)} after an authorized evidence and provider review.`} confirmLabel="Confirm dispute preview" onConfirm={(reason) => mockAdminService.reviewDispute({ disputeId: dispute.id, status: nextStatus, reason, confirmed: true })} onResult={setResult} /></td></tr>; })}</tbody>
        </AdminTable>
      </AdminPanel>

      <AdminDialog open={reviewOpen} onOpenChange={setReviewOpen} title="Confirm credit adjustment preview" description="Review the exact fictional intent. Confirmation cannot change a wallet or create a real audit record.">
        <div className="rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4"><AdminDefinitionList items={[{ label: "Target user", value: `${selectedUser?.name ?? userId} · ${userId}` }, { label: "Signed adjustment", value: `${creditsNumber > 0 ? "+" : ""}${formatCredits(creditsNumber)} credits` }, { label: "Category", value: formatLabel(category) }, { label: "Ticket / reference", value: reference.trim() }, { label: "Reason", value: reason.trim() }, { label: "Actual result", value: "0 credits changed · no audit persisted" }]} /></div>
        <p className="mt-3 text-xs leading-5 text-muted">A real operation would require step-up and an atomic server ledger/audit transaction. This is only an interface demonstration.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setReviewOpen(false)} disabled={busy}><ArrowLeft aria-hidden="true" />Back to edit</Button><Button type="button" onClick={() => void confirmAdjustment()} disabled={busy} className="bg-error hover:bg-[#8f1d14]">{busy ? "Validating preview…" : "Confirm adjustment preview"}</Button></div>
      </AdminDialog>
    </>
  );
}
