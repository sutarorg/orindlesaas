import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { accountDeletionRequests, assets, conversations, creditPacks, creditReservations, generationJobs, profiles, walletLedger, wallets, websiteProjects } from "@/lib/server/db/schema";
import { listEnabledCatalog } from "@/lib/server/ai/models";
import { AppError } from "@/lib/server/errors";

/**
 * A workspace needs exactly one wallet row per profile. The `on_orindle_auth_user_created` trigger
 * normally creates both when the auth user appears, but a database that predates the trigger (or an
 * account created while it was missing) can leave a profile with no wallet. Nothing recovered from
 * that: getWorkspaceSnapshot threw "The workspace has not been initialized", so the account was
 * locked out of /app permanently and every login looked like a hang.
 *
 * Creating the row is idempotent and derives from the profile's own id, so it cannot be used to
 * grant credits — a new wallet starts at zero, which is exactly what signup provisions. Failures
 * are swallowed so the caller still raises the normal 403 instead of a 500.
 */
async function ensureWallet(userId: string) {
  try {
    await getDb().insert(wallets).values({ userId }).onConflictDoNothing({ target: wallets.userId });
  } catch (error) {
    console.error("[workspace] Could not provision the missing wallet row.", error);
  }
}

/**
 * The model catalogue is discovery data owned by the Gateway sync, not workspace state. A database
 * that has not had the catalogue migrations applied yet (or is waiting on a first sync) must still
 * render the workspace, so a failure here degrades the catalogue to empty instead of failing the
 * whole snapshot. `modelsLoaded` lets the UI distinguish "nothing enabled" from "not readable".
 */
async function loadEnabledCatalogSafely() {
  try {
    return { models: await listEnabledCatalog(), modelsLoaded: true };
  } catch (error) {
    console.error("[workspace] Model catalogue unavailable; rendering workspace without it.", error);
    return { models: [] as Awaited<ReturnType<typeof listEnabledCatalog>>, modelsLoaded: false };
  }
}

export async function getWorkspaceSnapshot(userId: string) {
  const db = getDb();
  const [profileRows, walletRows, jobs, assetRows, projects, conversationRows, packs, ledger, catalog] = await Promise.all([
    db.select({ id: profiles.id, email: profiles.email, fullName: profiles.displayName, avatarUrl: profiles.avatarUrl, createdAt: profiles.createdAt }).from(profiles).where(eq(profiles.id, userId)).limit(1),
    db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1),
    db.select({ id: generationJobs.id, kind: generationJobs.kind, modelId: generationJobs.modelId, status: generationJobs.status, result: generationJobs.result, errorCode: generationJobs.errorCode, createdAt: generationJobs.createdAt, updatedAt: generationJobs.updatedAt, estimatedCredits: creditReservations.estimatedCredits, actualCredits: creditReservations.actualCredits }).from(generationJobs).leftJoin(creditReservations, eq(generationJobs.reservationId, creditReservations.id)).where(eq(generationJobs.userId, userId)).orderBy(desc(generationJobs.createdAt)).limit(50),
    db.select({ id: assets.id, kind: assets.kind, mimeType: assets.mimeType, sizeBytes: assets.sizeBytes, fileName: assets.fileName, createdAt: assets.createdAt }).from(assets).where(and(eq(assets.userId, userId), eq(assets.status, "ready"))).orderBy(desc(assets.createdAt)).limit(50),
    db.select({ id: websiteProjects.id, name: websiteProjects.name, slug: websiteProjects.slug, status: websiteProjects.status, sourceAssetId: websiteProjects.sourceAssetId, generationJobId: websiteProjects.generationJobId, createdAt: websiteProjects.createdAt, updatedAt: websiteProjects.updatedAt }).from(websiteProjects).where(eq(websiteProjects.userId, userId)).orderBy(desc(websiteProjects.updatedAt)).limit(50),
    db.select({ id: conversations.id, title: conversations.title, updatedAt: conversations.updatedAt }).from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)).limit(50),
    db.select().from(creditPacks).where(eq(creditPacks.enabled, true)).orderBy(creditPacks.subtotalUsdCents),
    db.select({ id: walletLedger.id, entryType: walletLedger.kind, amountCredits: walletLedger.availableDeltaCredits, balanceAfterCredits: walletLedger.availableAfterCredits, description: walletLedger.description, createdAt: walletLedger.createdAt }).from(walletLedger).where(eq(walletLedger.userId, userId)).orderBy(desc(walletLedger.createdAt)).limit(50),
    loadEnabledCatalogSafely(),
  ]);
  const profile = profileRows[0];
  if (!profile) throw new AppError("forbidden", 403, "The workspace has not been initialized.");
  // A profile without a wallet is a provisioning gap, not an uninitialised workspace: repair it and
  // carry on rather than locking the account out of /app forever.
  let wallet = walletRows[0];
  if (!wallet) {
    await ensureWallet(userId);
    const [repaired] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (!repaired) throw new AppError("forbidden", 403, "The workspace has not been initialized.");
    wallet = repaired;
  }
  const deletion = await db.select({ id: accountDeletionRequests.id, status: accountDeletionRequests.status, createdAt: accountDeletionRequests.createdAt }).from(accountDeletionRequests).where(eq(accountDeletionRequests.userId, userId)).orderBy(desc(accountDeletionRequests.createdAt)).limit(1);
  return {
    profile,
    deletionRequest: deletion[0] ?? null,
    wallet,
    jobs,
    assets: assetRows.map((asset) => ({ ...asset, downloadPath: `/api/v1/assets/${asset.id}/download` })),
    projects,
    conversations: conversationRows,
    packs: packs.map((pack) => ({ id: pack.id, name: pack.name, credits: pack.credits, priceCents: pack.subtotalUsdCents, currency: pack.currency })),
    ledger,
    models: catalog.models,
    modelsLoaded: catalog.modelsLoaded,
  };
}

export type WorkspaceSnapshot = Awaited<ReturnType<typeof getWorkspaceSnapshot>>;
