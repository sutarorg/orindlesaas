"use client";

import { Bell, ChevronRight, CircleUserRound, KeyRound, Link2, LockKeyhole, Save, Settings2, ShieldAlert, SlidersHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ActionFeedback, DemoBadge, InlineNotice, PageHeader, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, UpdateSettingsRequest } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { getModelsForProduct } from "@/lib/dashboard/models";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

type SettingsSection = "profile" | "security" | "preferences" | "notifications" | "connections" | "deletion";
const sections: { id: SettingsSection; label: string; icon: typeof Settings2 }[] = [
  { id: "profile", label: "Profile", icon: CircleUserRound },
  { id: "security", label: "Security", icon: LockKeyhole },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connections", label: "Connected accounts", icon: Link2 },
  { id: "deletion", label: "Deletion request", icon: ShieldAlert },
];

export function SettingsWorkspace() {
  const [section, setSection] = useState<SettingsSection>("profile");
  const [profile, setProfile] = useState({ name: workspaceFixture.profile.name, email: workspaceFixture.profile.email, workspaceName: workspaceFixture.profile.workspaceName });
  const [preferences, setPreferences] = useState({ defaultModel: "gpt-6.1-sol", language: "en", motion: "system", density: "comfortable" });
  const [notifications, setNotifications] = useState({ completions: true, failures: true, wallet: true, productNews: false });
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");

  async function saveSettings(settingsSection: UpdateSettingsRequest["section"], values: UpdateSettingsRequest["values"]) {
    setValidationError("");
    const response = await previewDashboardService.updateSettings({ section: settingsSection, values });
    setResult({ ...response, status: "unavailable", message: `${settingsSection.charAt(0).toUpperCase()}${settingsSection.slice(1)} settings were validated locally only. No account, preference, notification or connection changed and nothing was saved.` });
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (profile.name.trim().length < 2 || !profile.email.includes("@")) {
      setValidationError("Enter a name of at least 2 characters and a valid-looking email address for local validation.");
      return;
    }
    await saveSettings("profile", profile);
  }

  async function requestDeletion(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== "DELETE") {
      setValidationError("Type DELETE exactly to validate the deletion-request design.");
      return;
    }
    setValidationError("");
    const response = await previewDashboardService.requestAccountDeletion({ confirmation });
    setResult({ ...response, status: "unavailable", message: "Deletion-request validation only. No request was submitted, no account exists in this demo and no data was deleted." });
  }

  return (
    <>
      <PageHeader eyebrow="Account · local settings" title="Settings" description="Review profile, security, preferences and account controls. Values are local drafts; no account, session, connection or deletion backend exists in this demo." actions={<DemoBadge />} />
      <ActionFeedback result={result} />
      {validationError && <p role="alert" className="mt-4 rounded-2xl border border-error/20 bg-[#fff5f3] p-3 text-sm font-medium text-error">{validationError}</p>}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-line bg-white p-2.5 lg:sticky lg:top-32"><nav aria-label="Settings sections"><ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">{sections.map((item) => <li key={item.id} className={cn(item.id === "deletion" && "sm:col-span-1")}><button type="button" onClick={() => { setSection(item.id); setValidationError(""); }} aria-current={section === item.id ? "page" : undefined} className={cn("flex min-h-12 w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold transition-colors", section === item.id ? "bg-[#eaf6f0] text-teal-dark" : "text-body hover:bg-soft", item.id === "deletion" && section !== item.id && "text-error")}><item.icon className="size-4 shrink-0" aria-hidden="true" /><span className="flex-1">{item.label}</span><ChevronRight className="hidden size-3.5 lg:block" aria-hidden="true" /></button></li>)}</ul></nav></aside>
        <div className="min-w-0">
          {section === "profile" && <Panel><div className="mb-6"><h2 className="text-xl font-semibold tracking-[-0.03em]">Profile</h2><p className="mt-1 text-sm text-body">Fixture identity fields for the future customer profile.</p></div><form onSubmit={(event) => void saveProfile(event)} className="space-y-5"><div className="flex items-center gap-4 rounded-2xl bg-soft p-4"><span className="grid size-14 place-items-center rounded-2xl bg-mint/60 font-display text-lg font-semibold text-teal-dark">{workspaceFixture.profile.initials}</span><div><p className="text-sm font-semibold text-ink">Demo profile</p><p className="mt-1 text-xs text-muted">Not an authenticated user or verified email</p></div></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-ink">Name</label><input id="profile-name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} maxLength={80} className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><div><label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-ink">Email fixture</label><input id="profile-email" type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div></div><div><label htmlFor="profile-workspace" className="mb-2 block text-sm font-semibold text-ink">Workspace name</label><input id="profile-workspace" value={profile.workspaceName} onChange={(event) => setProfile((current) => ({ ...current, workspaceName: event.target.value }))} maxLength={100} className="min-h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15" /></div><Button type="submit"><Save aria-hidden="true" />Save profile preview</Button></form></Panel>}

          {section === "security" && <div className="space-y-6"><Panel><div className="mb-5 flex items-center gap-2"><KeyRound className="size-5 text-teal" aria-hidden="true" /><h2 className="text-xl font-semibold tracking-[-0.03em]">Sign-in & security</h2></div><InlineNotice title="No verified session exists" tone="warning">These controls demonstrate security UX only. They cannot change a password, revoke a session or enable two-factor authentication.</InlineNotice><div className="mt-5 space-y-3"><div className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-ink">Password recovery design</p><p className="mt-1 text-xs leading-5 text-muted">Opens the public auth preview. No recovery email will be sent.</p></div><Button asChild variant="secondary" size="sm"><Link href="/forgot-password">View recovery design</Link></Button></div><div className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-ink">Two-factor authentication</p><p className="mt-1 text-xs leading-5 text-muted">Planned security capability · currently unavailable</p></div><Button type="button" variant="secondary" size="sm" onClick={() => void saveSettings("security", { operation: "enable-2fa" })}>Preview 2FA setup</Button></div><div className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-ink">Sign out all sessions</p><p className="mt-1 text-xs leading-5 text-muted">No session fixtures will be revoked</p></div><Button type="button" variant="secondary" size="sm" onClick={() => void saveSettings("security", { operation: "sign-out-all" })}>Preview sign-out all</Button></div></div></Panel><Panel><h3 className="text-base font-semibold">Session fixture</h3><p className="mt-2 text-sm leading-6 text-body">This browser · Pune, Maharashtra · illustrative location</p><p className="mt-1 text-xs text-muted">Not based on IP, geolocation or a real session. No device was identified.</p></Panel></div>}

          {section === "preferences" && <Panel><div className="mb-6"><h2 className="text-xl font-semibold tracking-[-0.03em]">Workspace preferences</h2><p className="mt-1 text-sm text-body">Draft future defaults without applying them to a backend or other pages.</p></div><div className="space-y-5"><div><label htmlFor="preference-model" className="mb-2 block text-sm font-semibold text-ink">Default chat model</label><select id="preference-model" value={preferences.defaultModel} onChange={(event) => setPreferences((current) => ({ ...current, defaultModel: event.target.value }))} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal">{getModelsForProduct("chat").map((model) => <option key={model.id} value={model.id}>{model.displayName} · {model.provider}</option>)}</select></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="preference-language" className="mb-2 block text-sm font-semibold text-ink">Language</label><select id="preference-language" value={preferences.language} onChange={(event) => setPreferences((current) => ({ ...current, language: event.target.value }))} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="en">English</option></select></div><div><label htmlFor="preference-density" className="mb-2 block text-sm font-semibold text-ink">Density draft</label><select id="preference-density" value={preferences.density} onChange={(event) => setPreferences((current) => ({ ...current, density: event.target.value }))} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="comfortable">Comfortable</option><option value="compact">Compact · planned</option></select></div></div><div><label htmlFor="preference-motion" className="mb-2 block text-sm font-semibold text-ink">Motion preference draft</label><select id="preference-motion" value={preferences.motion} onChange={(event) => setPreferences((current) => ({ ...current, motion: event.target.value }))} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal"><option value="system">Use system preference</option><option value="reduced">Reduce motion · planned</option></select><p className="mt-2 text-xs text-muted">The current interface already respects your operating system’s reduced-motion setting.</p></div><Button type="button" onClick={() => void saveSettings("preferences", preferences)}><Save aria-hidden="true" />Save preferences preview</Button></div></Panel>}

          {section === "notifications" && <Panel><div className="mb-6"><h2 className="text-xl font-semibold tracking-[-0.03em]">Notification preferences</h2><p className="mt-1 text-sm text-body">Local checkbox drafts. No emails, pushes or notification records will be sent or saved.</p></div><div className="space-y-3">{([{ key: "completions", title: "Generation completions", detail: "Planned updates when a future real job completes" }, { key: "failures", title: "Failures and retries", detail: "Planned alerts when a job needs attention" }, { key: "wallet", title: "Wallet activity", detail: "Planned purchase and usage notifications" }, { key: "productNews", title: "Product news", detail: "Occasional product education and updates" }] as const).map((item) => <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 hover:bg-soft"><input type="checkbox" checked={notifications[item.key]} onChange={(event) => setNotifications((current) => ({ ...current, [item.key]: event.target.checked }))} className="mt-1 size-4 accent-teal" /><span><span className="block text-sm font-semibold text-ink">{item.title}</span><span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span></span></label>)}</div><Button type="button" className="mt-5" onClick={() => void saveSettings("notifications", notifications)}><Save aria-hidden="true" />Save notifications preview</Button></Panel>}

          {section === "connections" && <Panel><div className="mb-6"><h2 className="text-xl font-semibold tracking-[-0.03em]">Connected accounts</h2><p className="mt-1 text-sm text-body">Planned provider connections. No OAuth flow, account link or token exchange is available.</p></div><div className="space-y-3">{["Google", "GitHub"].map((provider) => <div key={provider} className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-subtle text-teal"><Link2 className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-ink">{provider}</p><p className="mt-1 text-xs text-muted">Not connected · planned integration</p></div></div><Button type="button" variant="secondary" size="sm" onClick={() => void saveSettings("connections", { provider, operation: "connect" })}>Preview connection</Button></div>)}</div><InlineNotice title="No provider access" >Orindle does not have access to your Google or GitHub account from this demo. These buttons only validate connection intent.</InlineNotice></Panel>}

          {section === "deletion" && <Panel className="border-error/20"><div className="mb-6"><h2 className="text-xl font-semibold tracking-[-0.03em]">Account deletion request</h2><p className="mt-1 text-sm text-body">Review a deliberate confirmation pattern without submitting a real request.</p></div><InlineNotice title="Demo safeguard" tone="warning">There is no real account or private dataset behind this workspace. Typing DELETE and submitting cannot delete anything.</InlineNotice><form onSubmit={(event) => void requestDeletion(event)} className="mt-6"><label htmlFor="delete-confirmation" className="mb-2 block text-sm font-semibold text-ink">Type <code className="rounded bg-subtle px-1.5 py-0.5">DELETE</code> to continue</label><input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="min-h-12 w-full max-w-sm rounded-xl border border-line px-4 text-[15px] text-ink outline-none focus:border-error focus:ring-2 focus:ring-error/15" /><p className="mt-2 text-xs leading-5 text-muted">A real backend would require verified identity, a clear scope and a trackable request.</p><Button type="submit" variant="secondary" className="mt-5 border-error/25 text-error hover:bg-[#fff5f3]"><Trash2 aria-hidden="true" />Validate deletion request</Button></form></Panel>}
        </div>
      </div>
    </>
  );
}
