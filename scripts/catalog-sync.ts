import { syncGatewayCatalog } from "../lib/server/ai/catalog-sync";
import { closeDb } from "../lib/server/db/client";

try {
  const result = await syncGatewayCatalog();
  console.log(`Gateway catalog synchronized: ${result.models} supported model mappings, ${result.priceVersions} price versions, ${result.skipped.length} entries skipped.`);
  console.log("New records remain disabled. Media operation prices are not invented and must be configured from authoritative provider evidence before enablement.");
} finally {
  await closeDb();
}
