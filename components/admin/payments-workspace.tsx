"use client";

import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminPagination, AdminResultCount, AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminBadge, AdminDefinitionList, AdminDialog, AdminEmptyState, AdminMetricCard, AdminPageHeader, AdminPanel, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminPayments, adminTransactions, getAdminPackage, getAdminUser } from "@/lib/admin/fixtures";
import { formatCredits, formatDateTime, formatLabel, formatMoney, matchesAdminQuery, paginate } from "@/lib/admin/format";
import type { AdminPayment, AdminPaymentStatus, AdminPreviewResult, AdminTransaction } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function PaymentsWorkspace({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<AdminPaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  const filtered = adminPayments.filter((payment) => {
    const user = getAdminUser(payment.userId);
    const creditPackage = getAdminPackage(payment.packageId);
    return (status === "all" || payment.status === status) && matchesAdminQuery(query, payment.id, payment.providerPaymentId, payment.reference, user?.name, user?.email, creditPackage?.name, payment.status, payment.fulfillmentStatus);
  });
  const pagination = paginate(filtered, page, 6);

  function resetFilters() { setQuery(""); setStatus("all"); setPage(1); }
  function handleResult(nextResult: AdminPreviewResult) { setResult(nextResult); setSelectedPayment(null); }

  return (
    <>
      <AdminPageHeader eyebrow="Revenue operations" title="Payments" description="Inspect fictional provider payment, webhook and credit-fulfillment states. No payment record, webhook or wallet is connected or mutated." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><AdminMetricCard compact label="Successful · demo" value={String(adminPayments.filter((payment) => payment.status === "succeeded").length)} detail="Fixture payment records" /><AdminMetricCard compact label="Needs review" value={String(adminPayments.filter((payment) => payment.status === "pending" || payment.fulfillmentStatus === "pending").length)} detail="Pending payment or fulfillment examples" /><AdminMetricCard compact label="Failed · demo" value={String(adminPayments.filter((payment) => payment.status === "failed").length)} detail="No real payment failure occurred" /></div>
      <div className="mb-4"><AdminPreviewFeedback result={result} /></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto] lg:items-end">
          <div><label htmlFor="payment-search" className="mb-1.5 block text-xs font-semibold text-ink">Search payments</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="payment-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Payment ID, reference, customer or status" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div>
          <div><label htmlFor="payment-status" className="mb-1.5 block text-xs font-semibold text-ink">Payment status</label><select id="payment-status" value={status} onChange={(event) => { setStatus(event.target.value as AdminPaymentStatus | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All statuses</option><option value="succeeded">Succeeded</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option><option value="disputed">Disputed</option></select></div>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={!query && status === "all"}><RotateCcw aria-hidden="true" />Reset filters</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminPayments.length} noun="payments" /></div>
        {pagination.totalItems ? <>
          <AdminTable caption="Payment administration" minWidth={1220}>
            <AdminTableHeader columns={[{ label: "Provider payment ID" }, { label: "Customer" }, { label: "Package" }, { label: "Amount", align: "right" }, { label: "Payment" }, { label: "Webhook" }, { label: "Credit fulfillment" }, { label: "Action", align: "right" }]} />
            <tbody className="divide-y divide-line">{pagination.items.map((payment) => { const user = getAdminUser(payment.userId); const creditPackage = getAdminPackage(payment.packageId); return <tr key={payment.id}><td className="max-w-56 px-4 py-4"><p className="break-words font-medium text-ink">{payment.providerPaymentId}</p><p className="mt-1 text-[11px] text-muted">{formatDateTime(payment.createdAt)}</p></td><td className="px-4 py-4"><p className="font-medium text-ink">{user?.name ?? payment.userId}</p><p className="mt-0.5 text-xs text-muted">{payment.userId}</p></td><td className="px-4 py-4 text-xs text-body">{creditPackage?.name ?? payment.packageId}</td><td className="px-4 py-4 text-right tabular-nums font-medium text-ink">{formatMoney(payment.amountCents)} <span className="text-[11px] text-muted">{payment.currency}</span></td><td className="px-4 py-4"><AdminBadge label={payment.status} tone={getAdminStatusTone(payment.status)} /></td><td className="px-4 py-4"><AdminBadge label={payment.webhookStatus} tone={getAdminStatusTone(payment.webhookStatus)} /></td><td className="px-4 py-4"><AdminBadge label={formatLabel(payment.fulfillmentStatus)} tone={getAdminStatusTone(payment.fulfillmentStatus)} /></td><td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)} aria-label={`Review ${payment.providerPaymentId}`}>Review</Button></td></tr>; })}</tbody>
          </AdminTable>
          <AdminPagination {...pagination} itemLabel="payments" onPageChange={setPage} />
        </> : <AdminEmptyState title="No payments match these filters" description="Try another provider ID, customer, reference or payment status." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>

      <AdminDialog open={Boolean(selectedPayment)} onOpenChange={(open) => { if (!open) setSelectedPayment(null); }} title={selectedPayment?.providerPaymentId ?? "Payment details"} description="Fictional payment operations detail. Raw webhooks, payment instruments and provider credentials are never included.">
        {selectedPayment && <div className="space-y-6">
          <AdminDefinitionList items={[
            { label: "Internal demo ID", value: selectedPayment.id },
            { label: "Provider payment ID", value: selectedPayment.providerPaymentId },
            { label: "Customer", value: `${getAdminUser(selectedPayment.userId)?.name ?? selectedPayment.userId} · ${selectedPayment.userId}` },
            { label: "Package", value: getAdminPackage(selectedPayment.packageId)?.name ?? selectedPayment.packageId },
            { label: "Amount / currency", value: `${formatMoney(selectedPayment.amountCents)} ${selectedPayment.currency}` },
            { label: "Created", value: formatDateTime(selectedPayment.createdAt) },
            { label: "Payment status", value: <AdminBadge label={selectedPayment.status} tone={getAdminStatusTone(selectedPayment.status)} /> },
            { label: "Webhook status · demo", value: <AdminBadge label={selectedPayment.webhookStatus} tone={getAdminStatusTone(selectedPayment.webhookStatus)} /> },
            { label: "Credit fulfillment", value: <AdminBadge label={formatLabel(selectedPayment.fulfillmentStatus)} tone={getAdminStatusTone(selectedPayment.fulfillmentStatus)} /> },
            { label: "Safe transaction reference", value: selectedPayment.reference },
          ]} />
          <section><h3 className="text-sm font-semibold text-ink">Related transaction references</h3><ul className="mt-3 divide-y divide-line rounded-xl border border-line">{adminTransactions.filter((transaction) => transaction.relatedId === selectedPayment.id).map((transaction) => <li key={transaction.id} className="p-3 text-xs"><p className="break-words font-medium text-ink">{transaction.id}</p><p className="mt-1 text-muted">{transaction.reference} · {formatCredits(transaction.credits)} credits</p></li>)}</ul></section>
          <section className="rounded-xl border border-line bg-soft p-4"><h3 className="text-sm font-semibold text-ink">Reconciliation preview</h3><p className="mt-1 text-xs leading-5 text-muted">A real operation would re-read verified provider/webhook records. It would never accept a browser-selected payment or fulfillment status.</p><div className="mt-4"><ConfirmActionDialog trigger={<Button type="button" variant="secondary">Review reconciliation intent</Button>} title="Preview payment reconciliation" description="Validate a reasoned reconciliation workflow without touching payment or credits." target={selectedPayment.providerPaymentId} consequence="Reconcile the authorized server payment, webhook and fulfillment records idempotently." confirmLabel="Confirm reconciliation preview" onConfirm={(reason) => mockAdminService.reconcilePayment({ paymentId: selectedPayment.id, reason, confirmed: true })} onResult={handleResult} /></div></section>
        </div>}
      </AdminDialog>
    </>
  );
}

export function TransactionsWorkspace() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AdminTransaction["type"] | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<AdminTransaction | null>(null);
  const filtered = adminTransactions.filter((transaction) => {
    const user = getAdminUser(transaction.userId);
    return (type === "all" || transaction.type === type) && matchesAdminQuery(query, transaction.id, transaction.reference, transaction.relatedId, transaction.modelId, user?.name, user?.email, transaction.status);
  });
  const pagination = paginate(filtered, page, 8);
  function resetFilters() { setQuery(""); setType("all"); setPage(1); }

  return (
    <>
      <AdminPageHeader eyebrow="Revenue operations" title="Transactions" description="Search fictional purchase, usage, adjustment and dispute references. This operational view is not an authoritative append-only wallet ledger." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3"><AdminMetricCard compact label="Purchase references" value={String(adminTransactions.filter((transaction) => transaction.type === "purchase").length)} detail="Demo payment-linked entries" /><AdminMetricCard compact label="Usage references" value={String(adminTransactions.filter((transaction) => transaction.type === "usage").length)} detail="Demo generation-linked entries" /><AdminMetricCard compact label="Manual review references" value={String(adminTransactions.filter((transaction) => transaction.type === "adjustment" || transaction.type === "dispute").length)} detail="Non-persistent audit examples" /></div>
      <AdminPanel>
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto] lg:items-end">
          <div><label htmlFor="transaction-search" className="mb-1.5 block text-xs font-semibold text-ink">Search transactions</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" /><input id="transaction-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Transaction, reference, related ID or customer" className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div>
          <div><label htmlFor="transaction-type" className="mb-1.5 block text-xs font-semibold text-ink">Transaction type</label><select id="transaction-type" value={type} onChange={(event) => { setType(event.target.value as AdminTransaction["type"] | "all"); setPage(1); }} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"><option value="all">All types</option><option value="purchase">Purchase</option><option value="usage">Usage</option><option value="adjustment">Adjustment</option><option value="refund">Refund</option><option value="dispute">Dispute</option></select></div>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={!query && type === "all"}><RotateCcw aria-hidden="true" />Reset filters</Button>
        </div>
        <div className="mb-3"><AdminResultCount filtered={filtered.length} total={adminTransactions.length} noun="transactions" /></div>
        {pagination.totalItems ? <>
          <AdminTable caption="Transaction references" minWidth={1160}>
            <AdminTableHeader columns={[{ label: "Transaction / reference" }, { label: "Type" }, { label: "Customer" }, { label: "Related ID" }, { label: "Credits", align: "right" }, { label: "Amount", align: "right" }, { label: "Status" }, { label: "Action", align: "right" }]} />
            <tbody className="divide-y divide-line">{pagination.items.map((transaction) => <tr key={transaction.id}><td className="max-w-64 px-4 py-4"><p className="break-words font-medium text-ink">{transaction.id}</p><p className="mt-1 break-words text-[11px] text-muted">{transaction.reference} · {formatDateTime(transaction.createdAt)}</p></td><td className="px-4 py-4"><AdminBadge label={transaction.type} /></td><td className="px-4 py-4 text-xs text-body">{getAdminUser(transaction.userId)?.name ?? transaction.userId}</td><td className="max-w-48 px-4 py-4 break-words text-xs text-body">{transaction.relatedId ?? "—"}</td><td className="px-4 py-4 text-right tabular-nums font-medium text-ink">{transaction.credits > 0 ? "+" : ""}{formatCredits(transaction.credits)}</td><td className="px-4 py-4 text-right tabular-nums text-ink">{transaction.amountCents === null ? "—" : `${formatMoney(transaction.amountCents)} ${transaction.currency}`}</td><td className="px-4 py-4"><AdminBadge label={formatLabel(transaction.status)} tone={getAdminStatusTone(transaction.status)} /></td><td className="px-4 py-4 text-right"><Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTransaction(transaction)} aria-label={`View ${transaction.id}`}>Details</Button></td></tr>)}</tbody>
          </AdminTable>
          <AdminPagination {...pagination} itemLabel="transactions" onPageChange={setPage} />
        </> : <AdminEmptyState title="No transactions match these filters" description="Try another reference, customer, related ID or transaction type." action={<Button type="button" variant="secondary" onClick={resetFilters}>Reset filters</Button>} />}
      </AdminPanel>
      <AdminDialog open={Boolean(selectedTransaction)} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); }} title={selectedTransaction?.id ?? "Transaction details"} description="Fictional transaction reference. No real wallet or payment ledger is being read.">
        {selectedTransaction && <AdminDefinitionList items={[{ label: "Safe reference", value: selectedTransaction.reference }, { label: "Type", value: selectedTransaction.type }, { label: "Customer", value: `${getAdminUser(selectedTransaction.userId)?.name ?? selectedTransaction.userId} · ${selectedTransaction.userId}` }, { label: "Related ID", value: selectedTransaction.relatedId ?? "None" }, { label: "Model ID", value: selectedTransaction.modelId ?? "Not applicable" }, { label: "Signed credits · demo", value: `${selectedTransaction.credits > 0 ? "+" : ""}${formatCredits(selectedTransaction.credits)}` }, { label: "Amount", value: selectedTransaction.amountCents === null ? "Not applicable" : `${formatMoney(selectedTransaction.amountCents)} ${selectedTransaction.currency}` }, { label: "Status", value: formatLabel(selectedTransaction.status) }, { label: "Created", value: formatDateTime(selectedTransaction.createdAt) }]} />}
      </AdminDialog>
    </>
  );
}
