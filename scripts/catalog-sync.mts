import { syncOpenRouterCatalog } from "../lib/server/ai/catalog-sync";
import { closeDb } from "../lib/server/db/client";

try {
  const result = await syncOpenRouterCatalog({ trigger: "manual", mode: "full" });
  console.log(`Gateway catalog synchronized: ${result.models} accepted mappings, ${result.changed} changed, ${result.missing} missing historically, ${result.invalid} quarantined.`);
  console.log(`Run ${result.runId} finished ${result.status}; response SHA-256 ${result.responseHash}. New records remain disabled and unquotable/unsupported records stay unavailable.`);
} finally {
  await closeDb();
}
