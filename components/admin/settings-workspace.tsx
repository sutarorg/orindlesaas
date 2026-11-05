"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AdminBadge, AdminNotice, AdminPageHeader, AdminPanel, AdminPanelHeader, AdminPreviewFeedback } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminRangeLabels } from "@/lib/admin/metrics";
import { proposedAdminRoles } from "@/lib/admin/permissions";
import type { AdminPreviewResult, AdminRange } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function SettingsWorkspace() {
  const [defaultRange, setDefaultRange] = useState<AdminRange>("30d");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [notifications, setNotifications] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminPreviewResult | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const nextResult = await mockAdminService.updatePreferences({ defaultRange, density, notifications, reason: "Local display preference preview only", confirmed: true });
    setResult(nextResult);
    setBusy(false);
  }

  return (
    <>
      <AdminPageHeader eyebrow="System" title="Admin Settings" description="Review local display preferences and the proposed authorization contract. No role, organization policy, secret or notification setting is persisted." />
      <div className="grid min-w-0 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <AdminPanel>
            <AdminPanelHeader title="Display preference preview" description="These controls change only the current form state until the non-persistent preview is confirmed." />
            <form onSubmit={(event) => void submit(event)} className="space-y-5">
              <div><label htmlFor="settings-range" className="block text-sm font-semibold text-ink">Default fixture range</label><select id="settings-range" value={defaultRange} onChange={(event) => setDefaultRange(event.target.value as AdminRange)} className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15">{Object.entries(adminRangeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <fieldset><legend className="text-sm font-semibold text-ink">Table density</legend><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3 text-sm text-ink"><input type="radio" name="density" value="comfortable" checked={density === "comfortable"} onChange={() => setDensity("comfortable")} className="size-4 accent-[#067a67]" />Comfortable</label><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line px-3 text-sm text-ink"><input type="radio" name="density" value="compact" checked={density === "compact"} onChange={() => setDensity("compact")} className="size-4 accent-[#067a67]" />Compact</label></div></fieldset>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink"><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} className="size-4 accent-[#067a67]" />Show fixture notification examples</label>
              <div className="rounded-xl border border-line bg-soft p-3 text-xs leading-5 text-muted">This form has no account or organization backend. Submitting cannot save a preference, send a notification or assign a role.</div>
              <Button type="submit" disabled={busy}>{busy ? "Validating preview…" : "Preview preference validation"}</Button>
            </form>
          </AdminPanel>
          <AdminPreviewFeedback result={result} />
          <AdminNotice title="No security settings in this phase">Role assignment, API keys, organization policies and step-up configuration are intentionally absent. The cards here are a read-only proposal for Prompt 5.</AdminNotice>
        </div>
        <AdminPanel>
          <AdminPanelHeader title="Proposed access model" description="Permission bundles for backend review—not active roles or an authorization decision." />
          <div className="space-y-3">
            {proposedAdminRoles.map((role) => <article key={role.name} className="rounded-xl border border-line p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf8f2] text-teal"><ShieldCheck className="size-4" aria-hidden="true" /></span><div><h3 className="text-sm font-semibold text-ink">{role.name}</h3><p className="mt-1 text-xs leading-5 text-body">{role.summary}</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{role.permissions.map((permission) => <AdminBadge key={permission} label={permission} />)}</div><p className="mt-3 text-xs leading-5 text-muted"><span className="font-semibold text-ink">Excluded:</span> {role.excluded}</p></article>)}
          </div>
          <div className="mt-5 rounded-xl border border-[#eadfca] bg-[#fffaf0] p-4"><h3 className="text-sm font-semibold text-ink">Required before real administration</h3><ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-5 text-body"><li>Verified server identity and current admin membership on every request.</li><li>Deny-by-default route, action, object and field permissions.</li><li>Step-up authentication, idempotency and current-state checks for high-impact actions.</li><li>Transactional append-only audit with actor, target, reason, correlation and outcome.</li><li>Direct-endpoint, wrong-role, replay, concurrency and redaction tests.</li></ul></div>
        </AdminPanel>
      </div>
    </>
  );
}
