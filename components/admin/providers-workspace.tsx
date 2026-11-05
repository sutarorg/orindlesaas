"use client";

import { CloudCog } from "lucide-react";
import { useState } from "react";
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog";
import { AdminTable, AdminTableHeader } from "@/components/admin/data-table";
import { AdminBadge, AdminNotice, AdminPageHeader, AdminPanel, AdminPreviewFeedback, getAdminStatusTone } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { adminModels, adminProviders } from "@/lib/admin/fixtures";
import { formatDateTime, formatLabel } from "@/lib/admin/format";
import type { AdminPreviewResult } from "@/lib/contracts/admin";
import { mockAdminService } from "@/lib/mocks/admin-preview";

export function ProvidersWorkspace() {
  const [result, setResult] = useState<AdminPreviewResult | null>(null);
  return (
    <>
      <AdminPageHeader eyebrow="AI operations" title="Providers" description="Review fictional integration, enabled and health-check states. These examples do not describe a live Orindle provider connection or incident." />
      <div className="mb-4 space-y-4"><AdminNotice title="Health-check boundary">“Last check” values are labelled demo timestamps. No provider was contacted, no credentials exist and no live availability is inferred.</AdminNotice><AdminPreviewFeedback result={result} /></div>
      <AdminPanel>
        <AdminTable caption="AI provider operations" minWidth={980}>
          <AdminTableHeader columns={[{ label: "Provider" }, { label: "Integration" }, { label: "Enabled" }, { label: "Last demo health check" }, { label: "Safe error state" }, { label: "Models", align: "right" }, { label: "Action", align: "right" }]} />
          <tbody className="divide-y divide-line">
            {adminProviders.map((provider) => {
              const modelCount = adminModels.filter((model) => model.provider === provider.name).length;
              return (
                <tr key={provider.id}>
                  <td className="px-4 py-4"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-lg bg-soft text-teal"><CloudCog className="size-4" aria-hidden="true" /></span><div><p className="font-semibold text-ink">{provider.name}</p><p className="mt-0.5 text-[11px] text-muted">{provider.id}</p></div></div><p className="mt-2 max-w-64 text-xs leading-5 text-body">{provider.healthMessage}</p></td>
                  <td className="px-4 py-4"><AdminBadge label={formatLabel(provider.integrationStatus)} tone={getAdminStatusTone(provider.integrationStatus)} /></td>
                  <td className="px-4 py-4"><AdminBadge label={provider.enabled ? "Enabled · demo" : "Disabled · demo"} tone={provider.enabled ? "success" : "neutral"} /></td>
                  <td className="px-4 py-4 text-xs text-body">{provider.lastHealthCheckAt ? formatDateTime(provider.lastHealthCheckAt) : "No demo check"}</td>
                  <td className="px-4 py-4 text-xs text-body">{provider.errorState ?? "None in fixture"}</td>
                  <td className="px-4 py-4 text-right tabular-nums font-semibold text-ink">{modelCount}</td>
                  <td className="px-4 py-4 text-right">
                    <ConfirmActionDialog
                      trigger={<Button type="button" variant="ghost" size="sm" aria-label={`Configure ${provider.name}`}>Configure</Button>}
                      title={`Configure ${provider.name}`}
                      description="Review a provider enabled-state intent. No integration or secret configuration is available."
                      target={`${provider.name} · ${provider.id}`}
                      consequence={`${provider.enabled ? "Disable" : "Enable"} this provider in a future versioned, authorized server configuration.`}
                      confirmLabel="Confirm provider preview"
                      onConfirm={(reason) => mockAdminService.configureProvider({ providerId: provider.id, enabled: !provider.enabled, reason, confirmed: true })}
                      onResult={setResult}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      </AdminPanel>
    </>
  );
}
