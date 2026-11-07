import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { accountDeletionRequests, assets, conversations, creditPacks, creditReservations, generationJobs, profiles, walletLedger, wallets, websiteProjects } from "@/lib/server/db/schema";
import { listEnabledCatalog } from "@/lib/server/ai/models";
import { AppError } from "@/lib/server/errors";

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
  const wallet = walletRows[0];
  if (!profile || !wallet) throw new AppError("forbidden", 403, "The workspace has not been initialized.");
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
