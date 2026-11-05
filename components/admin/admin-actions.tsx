"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNotice, AdminPanel, AdminPanelHeader } from "@/components/admin/ui";
import type { AdminPriceModel, AdminToggleControl, AdminUserControl } from "@/lib/server/admin/queries";

export function CreditAdjustmentPanel({ users }: { users: { id: string; email: string; balance: number }[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const key = useRef<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const idempotencyKey = key.current ?? crypto.randomUUID(); key.current = idempotencyKey;
    try {
      const response = await fetch("/api/v1/admin/credits/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, amountCredits: amount, reason, idempotencyKey }) });
      const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "Adjustment failed.");
      key.current = null; setRetrying(false); setMessage(`Adjustment ${body.data.adjustmentId} posted. New available balance: ${body.data.availableCredits}.`); setAmount(0); setReason(""); setConfirmed(false); router.refresh();
    } catch (reasonValue) { if (key.current) setRetrying(true); setError(reasonValue instanceof Error ? reasonValue.message : "Adjustment failed"); }
    finally { setBusy(false); }
  }
  return <AdminPanel className="mb-5"><AdminPanelHeader title="Post a credit adjustment" description="Requires credits:adjust and AAL2. A negative amount cannot overdraw the available wallet." /><AdminNotice title="High-impact operation" tone="warning">This changes the real wallet and writes an append-only ledger entry and audit event. Review the user, signed amount and reason carefully.</AdminNotice><form onSubmit={(event) => void submit(event)} className="mt-5 grid gap-4 lg:grid-cols-2"><div><label htmlFor="adjust-user" className="mb-2 block text-xs font-semibold">User</label><select id="adjust-user" value={userId} onChange={(event) => setUserId(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">{users.map((user) => <option key={user.id} value={user.id}>{user.email} · {user.balance} available</option>)}</select></div><div><label htmlFor="adjust-amount" className="mb-2 block text-xs font-semibold">Signed credits</label><input id="adjust-amount" type="number" min={-1000000} max={1000000} step={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /></div><div className="lg:col-span-2"><label htmlFor="adjust-reason" className="mb-2 block text-xs font-semibold">Substantive reason and reference</label><textarea id="adjust-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} rows={3} className="w-full rounded-xl border border-line px-3 py-2 text-sm" placeholder="Support case ORI-…; why this adjustment is required" /></div><label className="flex items-start gap-2 text-xs leading-5 lg:col-span-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-teal" />I reviewed the target and amount, and understand this writes financial and audit records.</label>{error && <p role="alert" className="text-sm text-error lg:col-span-2">{error}</p>}{message && <p role="status" className="text-sm text-teal-dark lg:col-span-2">{message}</p>}<div className="lg:col-span-2"><Button type="submit" disabled={busy || !userId || !Number.isInteger(amount) || amount === 0 || reason.trim().length < 10 || !confirmed}><ShieldCheck />{busy ? "Posting…" : retrying ? "Retry same adjustment" : "Post audited adjustment"}</Button></div></form></AdminPanel>;
}

async function postAdminMutation(payload: Record<string, unknown>) {
  const response = await fetch("/api/v1/admin/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? "The admin operation failed.");
  return body.data as { changed: boolean; duplicate: boolean };
}

function ToggleMutation({ control }: { control: AdminToggleControl }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const key = useRef<string | null>(null);
  async function submit() {
    setBusy(true); setError(""); setMessage("");
    key.current ??= crypto.randomUUID();
    const target = control.action === "set_provider_enabled" ? { providerId: control.targetId } : control.action === "set_model_enabled" ? { modelId: control.targetId } : { packId: control.targetId };
    try {
      const result = await postAdminMutation({ action: control.action, ...target, enabled: !control.enabled, expectedEnabled: control.enabled, reason, idempotencyKey: key.current });
      key.current = null; setMessage(result.changed ? "The audited state change was saved." : "The requested state was already current."); setReason(""); router.refresh();
    } catch (reasonValue) { setError(reasonValue instanceof Error ? reasonValue.message : "Operation failed"); }
    finally { setBusy(false); }
  }
  return <div className="rounded-xl border border-line p-4"><p className="m-0 text-sm font-semibold">{control.label}</p><p className="mb-3 mt-1 text-xs capitalize text-muted">Currently {control.enabled ? "enabled" : "disabled"}</p><label className="mb-2 block text-xs font-semibold" htmlFor={`reason-${control.action}-${control.targetId}`}>Reason and reference</label><input id={`reason-${control.action}-${control.targetId}`} value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm" /><Button type="button" size="sm" variant="secondary" className="mt-3" disabled={busy || reason.trim().length < 10} onClick={() => void submit()}>{busy ? "Saving…" : control.enabled ? "Disable with audit" : "Enable with audit"}</Button>{error && <p role="alert" className="mb-0 mt-2 text-xs text-error">{error}</p>}{message && <p role="status" className="mb-0 mt-2 text-xs text-teal-dark">{message}</p>}</div>;
}

function UserStatusMutation({ control }: { control: AdminUserControl }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef<string | null>(null);
  async function submit() {
    setBusy(true); setError(""); key.current ??= crypto.randomUUID();
    try {
      await postAdminMutation({ action: "set_user_status", userId: control.userId, status: control.status === "active" ? "suspended" : "active", expectedStatus: control.status, reason, idempotencyKey: key.current });
      key.current = null; setReason(""); router.refresh();
    } catch (reasonValue) { setError(reasonValue instanceof Error ? reasonValue.message : "Operation failed"); }
    finally { setBusy(false); }
  }
  return <div className="rounded-xl border border-line p-4"><p className="m-0 break-all text-sm font-semibold">{control.label}</p><p className="mb-3 mt-1 text-xs capitalize text-muted">Currently {control.status}</p><label className="mb-2 block text-xs font-semibold" htmlFor={`reason-user-${control.userId}`}>Reason and reference</label><input id={`reason-user-${control.userId}`} value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm" /><Button type="button" size="sm" variant="secondary" className="mt-3" disabled={busy || reason.trim().length < 10} onClick={() => void submit()}>{busy ? "Saving…" : control.status === "active" ? "Suspend with audit" : "Restore with audit"}</Button>{error && <p role="alert" className="mb-0 mt-2 text-xs text-error">{error}</p>}</div>;
}

function decimalToNano(value: string, multiplier: bigint) {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,9}))?$/.exec(value.trim());
  if (!match) return null;
  const fraction = (match[2] ?? "").padEnd(9, "0");
  const nano = (BigInt(match[1] ?? "0") * 1_000_000_000n + BigInt(fraction)) * multiplier / 1_000_000_000n;
  if ((BigInt(match[1] ?? "0") * 1_000_000_000n + BigInt(fraction)) * multiplier % 1_000_000_000n !== 0n) return null;
  return Number.isSafeInteger(Number(nano)) ? Number(nano) : null;
}

export function PriceVersionPanel({ models }: { models: AdminPriceModel[] }) {
  const router = useRouter();
  const [modelId, setModelId] = useState(models[0]?.modelId ?? "");
  const selected = models.find((model) => model.modelId === modelId) ?? models[0];
  const textModel = selected?.kind === "chat" || selected?.kind === "website";
  const [input, setInput] = useState(models[0]?.input == null ? "0" : String(models[0].input / 1000));
  const [output, setOutput] = useState(models[0]?.output == null ? "0" : String(models[0].output / 1000));
  const [operation, setOperation] = useState(models[0]?.operation == null ? "0" : String(models[0].operation / 1_000_000_000));
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const key = useRef<string | null>(null);
  function chooseModel(id: string) {
    const model = models.find((item) => item.modelId === id);
    setModelId(id); key.current = null; setError(""); setMessage("");
    setInput(model?.input === null || model?.input === undefined ? "0" : String(model.input / 1000));
    setOutput(model?.output === null || model?.output === undefined ? "0" : String(model.output / 1000));
    setOperation(model?.operation === null || model?.operation === undefined ? "0" : String(model.operation / 1_000_000_000));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(""); setMessage(""); key.current ??= crypto.randomUUID();
    const inputNano = textModel ? decimalToNano(input, 1000n) : null;
    const outputNano = textModel ? decimalToNano(output, 1000n) : null;
    const operationNano = textModel ? null : decimalToNano(operation, 1_000_000_000n);
    if ((textModel && (inputNano === null || outputNano === null)) || (!textModel && operationNano === null)) { setError("Use a non-negative decimal with precision that converts exactly to integer nanodollars."); setBusy(false); return; }
    try {
      await postAdminMutation({ action: "create_price_version", modelId: selected.modelId, expectedCurrentPriceId: selected.currentPriceId, inputNanoUsdPerToken: inputNano, outputNanoUsdPerToken: outputNano, operationNanoUsd: operationNano, reason, idempotencyKey: key.current });
      key.current = null; setMessage("A new audited price version is active. Historical versions were not changed."); setReason(""); setConfirmed(false); router.refresh();
    } catch (reasonValue) { setError(reasonValue instanceof Error ? reasonValue.message : "Price update failed"); }
    finally { setBusy(false); }
  }
  if (!selected) return null;
  return <AdminPanel className="mb-5"><AdminPanelHeader title="Create an immediate price version" description="Requires pricing:manage and AAL2. Values configure estimates only; actual charges still use Gateway metering." /><AdminNotice title="Exact integer conversion" tone="warning">Text prices are USD per one million tokens with at most three decimal places. Media prices are USD per operation and must convert exactly to nanodollars.</AdminNotice><form onSubmit={(event) => void submit(event)} className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="price-model" className="mb-2 block text-xs font-semibold">Model</label><select id="price-model" value={selected.modelId} onChange={(event) => chooseModel(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">{models.map((model) => <option key={model.modelId} value={model.modelId}>{model.label} · {model.kind}</option>)}</select></div>{textModel ? <><div><label htmlFor="price-input" className="mb-2 block text-xs font-semibold">Input USD / 1M tokens</label><input id="price-input" inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /></div><div><label htmlFor="price-output" className="mb-2 block text-xs font-semibold">Output USD / 1M tokens</label><input id="price-output" inputMode="decimal" value={output} onChange={(event) => setOutput(event.target.value)} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /></div></> : <div className="sm:col-span-2"><label htmlFor="price-operation" className="mb-2 block text-xs font-semibold">USD per operation</label><input id="price-operation" inputMode="decimal" value={operation} onChange={(event) => setOperation(event.target.value)} className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /></div>}<div className="sm:col-span-2"><label htmlFor="price-reason" className="mb-2 block text-xs font-semibold">Authoritative pricing evidence and reason</label><textarea id="price-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={500} rows={3} className="w-full rounded-xl border border-line px-3 py-2 text-sm" /></div><label className="flex items-start gap-2 text-xs leading-5 sm:col-span-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-teal" />I reviewed the exact unit price and understand this immediately closes the current estimate-price version.</label>{error && <p role="alert" className="m-0 text-sm text-error sm:col-span-2">{error}</p>}{message && <p role="status" className="m-0 text-sm text-teal-dark sm:col-span-2">{message}</p>}<div className="sm:col-span-2"><Button type="submit" disabled={busy || reason.trim().length < 10 || !confirmed}><ShieldCheck />{busy ? "Versioning…" : "Create audited price version"}</Button></div></form></AdminPanel>;
}

export function AdminMutationControls({ toggles = [], users = [] }: { toggles?: AdminToggleControl[]; users?: AdminUserControl[] }) {
  if (!toggles.length && !users.length) return null;
  return <AdminPanel className="mb-5"><AdminPanelHeader title="Audited configuration actions" description="Each action requires its manage permission, AAL2, an expected current state and a substantive reason." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{toggles.map((control) => <ToggleMutation key={`${control.action}-${control.targetId}`} control={control} />)}{users.map((control) => <UserStatusMutation key={control.userId} control={control} />)}</div></AdminPanel>;
}
