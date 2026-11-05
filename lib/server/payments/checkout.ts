import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { creditPacks, payments, profiles, purchases } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { readServerEnvironment } from "@/lib/server/env";
import { createDodoClient } from "@/lib/server/payments/dodo-client";
import { getServerPack, packIdSchema, validateCheckoutUrl } from "@/lib/server/payments/pack-config";

export const checkoutRequestSchema = z.object({
  packId: packIdSchema,
  idempotencyKey: z.string().min(8).max(128).regex(/^[A-Za-z0-9:_-]+$/),
});

export async function createCheckout(userId: string, input: z.infer<typeof checkoutRequestSchema>) {
  const pack = getServerPack(input.packId);
  const db = getDb();
  const purchaseId = crypto.randomUUID();
  const purchase = await db.transaction(async (tx) => {
    const [activePack] = await tx.select().from(creditPacks).where(eq(creditPacks.id, pack.id)).for("share").limit(1);
    if (!activePack?.enabled) throw new AppError("conflict", 409, "This credit pack is not currently available.");
    if (activePack.credits !== pack.credits || activePack.subtotalUsdCents !== pack.priceUsdCents || activePack.currency !== "USD") throw new AppError("conflict", 409, "The server pack configuration needs reconciliation.");
    const [inserted] = await tx
      .insert(purchases)
      .values({
        id: purchaseId,
        userId,
        packId: pack.id,
        credits: pack.credits,
        subtotalUsdCents: pack.priceUsdCents,
        providerProductId: pack.providerProductId,
        idempotencyKey: input.idempotencyKey,
      })
      .onConflictDoNothing()
      .returning();
    const selected = inserted ?? (await tx
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.idempotencyKey, input.idempotencyKey)))
      .limit(1))[0];
    if (!selected) throw new AppError("conflict", 409, "The purchase request could not be recovered.");
    if (
      selected.packId !== pack.id ||
      selected.providerProductId !== pack.providerProductId ||
      selected.subtotalUsdCents !== pack.priceUsdCents ||
      selected.credits !== pack.credits
    ) {
      throw new AppError("conflict", 409, "This request key was already used for a different purchase.");
    }
    if (inserted) {
      await tx.insert(payments).values({
        purchaseId: selected.id,
        userId,
        subtotalUsdCents: pack.priceUsdCents,
      });
    }
    return selected;
  });

  if (purchase.status !== "pending") {
    throw new AppError("conflict", 409, "This purchase is no longer available for checkout.");
  }
  if (purchase.checkoutUrl && purchase.checkoutSessionId) {
    return { purchaseId: purchase.id, checkoutUrl: purchase.checkoutUrl, status: purchase.status, duplicate: true };
  }

  const [profile] = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!profile) throw new AppError("not_found", 404, "The customer profile was not found.");
  const env = readServerEnvironment();
  const returnUrl = new URL("/app/credits", env.NEXT_PUBLIC_SITE_URL);
  returnUrl.searchParams.set("purchase", purchase.id);
  let session;
  try {
    session = await createDodoClient().checkoutSessions.create(
      {
        product_cart: [{ product_id: pack.providerProductId, quantity: 1 }],
        customer: { email: profile.email },
        billing_currency: "USD",
        return_url: returnUrl.toString(),
        cancel_url: new URL("/pricing", env.NEXT_PUBLIC_SITE_URL).toString(),
        metadata: {
          schema_version: "1",
          purchase_id: purchase.id,
          user_id: userId,
          pack_id: pack.id,
        },
      },
      { idempotencyKey: `checkout:${purchase.id}` },
    );
  } catch (error) {
    throw new AppError(
      "integration_unavailable",
      502,
      "Checkout could not be confirmed. Retry with the same request key; no credits were added.",
      { cause: error },
    );
  }
  if (!session.checkout_url) throw new Error("Dodo checkout response did not include a hosted URL.");
  const checkoutUrl = validateCheckoutUrl(session.checkout_url);
  const [updated] = await db
    .update(purchases)
    .set({ checkoutSessionId: session.session_id, checkoutUrl, updatedAt: new Date() })
    .where(and(eq(purchases.id, purchase.id), eq(purchases.userId, userId)))
    .returning();
  if (!updated) throw new AppError("conflict", 409, "The purchase changed before checkout was saved.");
  await db
    .update(payments)
    .set({ providerCheckoutSessionId: session.session_id, updatedAt: new Date() })
    .where(eq(payments.purchaseId, purchase.id));
  return { purchaseId: purchase.id, checkoutUrl, status: updated.status, duplicate: false };
}
