import { closeDb, getDb } from "../lib/server/db/client";
import { creditPacks as creditPackTable } from "../lib/server/db/schema";
import { creditPacks } from "../lib/content/pricing";

try {
  await getDb().transaction(async (tx) => {
    for (const pack of creditPacks) {
      await tx.insert(creditPackTable).values({
        id: pack.id,
        name: pack.name,
        credits: pack.credits,
        subtotalUsdCents: pack.priceUsd * 100,
        enabled: true,
      }).onConflictDoNothing();
    }
  });
  console.log("Exact one-time credit packs seed-checked. Existing rows were not overwritten.");
} finally {
  await closeDb();
}
