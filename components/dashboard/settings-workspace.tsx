"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound, Save, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineNotice, PageHeader, Panel } from "@/components/dashboard/ui";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";

export function SettingsWorkspace({ data }: { data: WorkspaceSnapshot }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(data.profile.fullName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [deletion, setDeletion] = useState(data.deletionRequest);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName }) });
      const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "Profile update failed.");
      setMessage("Your display name has been updated."); router.refresh();
    } catch (reasonValue) { setError(reasonValue instanceof Error ? reasonValue.message : "Profile update failed"); }
    finally { setBusy(false); }
  }

  async function requestDeletion(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/v1/account/deletion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation, reason: reason || undefined }) });
      const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message ?? "Deletion request failed.");
      setDeletion({ id: body.data.id, status: body.data.status, createdAt: new Date() }); setMessage(body.data.duplicate ? "An active deletion review already exists." : "Your deletion request was recorded for review. Nothing was deleted by this submission."); setConfirmation("");
    } catch (reasonValue) { setError(reasonValue instanceof Error ? reasonValue.message : "Deletion request failed"); }
    finally { setBusy(false); }
  }

  return <><PageHeader eyebrow="Account · Settings" title="Settings" description="Manage your persisted profile, use Supabase account-security flows, and submit a trackable deletion review request." />
    {message && <div className="mb-4"><InlineNotice title="Account update">{message}</InlineNotice></div>}{error && <p role="alert" className="mb-4 rounded-xl bg-[#fff5f3] p-3 text-sm text-error">{error}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-2"><Panel><h2 className="text-xl font-semibold">Profile</h2><p className="mt-1 text-sm text-body">Your email is managed by Supabase Auth and cannot be edited as a display field.</p><form onSubmit={(event) => void saveProfile(event)} className="mt-6 space-y-5"><div><label htmlFor="profile-name" className="mb-2 block text-sm font-semibold">Display name</label><input id="profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} className="min-h-12 w-full rounded-xl border border-line px-4 text-sm" /></div><div><label htmlFor="profile-email" className="mb-2 block text-sm font-semibold">Verified account email</label><input id="profile-email" type="email" value={data.profile.email} readOnly className="min-h-12 w-full rounded-xl border border-line bg-subtle px-4 text-sm text-muted" /></div><Button type="submit" disabled={busy || displayName.trim().length < 2}><Save />{busy ? "Saving…" : "Save profile"}</Button></form></Panel>
      <Panel><div className="flex items-center gap-2"><KeyRound className="size-5 text-teal" /><h2 className="text-xl font-semibold">Sign-in & security</h2></div><p className="mt-2 text-sm leading-6 text-body">Password updates use your verified Supabase session. Sign out from the profile menu; active admin operations may require AAL2.</p><div className="mt-5 space-y-3"><div className="flex items-center justify-between gap-3 rounded-xl border border-line p-4"><div><p className="text-sm font-semibold">Password update</p><p className="mt-1 text-xs text-muted">Uses the real authenticated account flow.</p></div><Button asChild variant="secondary" size="sm"><Link href="/reset-password">Update password</Link></Button></div><div className="flex items-center justify-between gap-3 rounded-xl border border-line p-4"><div><p className="text-sm font-semibold">Password recovery</p><p className="mt-1 text-xs text-muted">Request a Supabase recovery email.</p></div><Button asChild variant="secondary" size="sm"><Link href="/forgot-password">Recover</Link></Button></div></div></Panel></div>
    <Panel className="mt-6 border-error/20"><div className="flex items-center gap-2"><ShieldAlert className="size-5 text-error" /><h2 className="text-xl font-semibold">Account deletion review</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-body">This creates a review request; it does not immediately delete your auth identity, wallet, assets or financial records. Required financial and audit records may be retained under policy.</p>{deletion && ["requested", "review"].includes(deletion.status) ? <div className="mt-5"><InlineNotice title={`Deletion request ${deletion.status}`} tone="warning">Request {deletion.id} is active. No further request is needed.</InlineNotice></div> : <form onSubmit={(event) => void requestDeletion(event)} className="mt-6"><label htmlFor="deletion-reason" className="mb-2 block text-sm font-semibold">Reason (optional)</label><textarea id="deletion-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-xl border border-line px-3 py-2 text-sm" /><label htmlFor="delete-confirmation" className="mb-2 mt-5 block text-sm font-semibold">Type <code>DELETE</code> to continue</label><input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="min-h-12 w-full max-w-sm rounded-xl border border-line px-4 text-sm" /><Button type="submit" variant="secondary" className="mt-5 border-error/25 text-error" disabled={busy || confirmation !== "DELETE"}><Trash2 />Submit deletion review</Button></form>}</Panel>
  </>;
}
