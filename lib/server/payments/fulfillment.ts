import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { emailOutbox, outboxEvents, payments, profiles, purchases, webhookEvents } from "@/lib/server/db/schema";
import { AppError } from "@/lib/server/errors";
import { grantPurchasedCredits } from "@/lib/server/credits/ledger";
import { paymentEventStatusIssues, paymentIdentityIssues, paymentValidationIssues, type VerifiedPaymentEvent } from "@/lib/server/payments/payment-validation";

export async function fulfillDodoPayment(input: {
  event: VerifiedPaymentEvent;
  eventId: string;
  payloadSha256: string;
  requestId: string;
}) {
  const { event, eventId, payloadSha256, requestId } = input;
  return getDb().transaction(async (tx) => {
    const [claimed] = await tx
      .insert(webhookEvents)
      .values({
        provider: "dodo",
        eventId,
        eventType: event.type,
        payloadSha256,
      })
      .onConflictDoNothing()
      .returning();
    if (!claimed) {
      const [existing] = await tx
        .select()
        .from(webhookEvents)
        .where(and(eq(webhookEvents.provider, "dodo"), eq(webhookEvents.eventId, eventId)))
        .limit(1);
      if (!existing || existing.payloadSha256 !== payloadSha256) {
        throw new AppError("conflict", 409, "The webhook ID was already used for a different payload.");
      }
      return { status: "duplicate" as const, creditsGranted: 0 };
    }

    const purchaseId = event.data.metadata.purchase_id;
    const [purchase] = purchaseId
      ? await tx.select().from(purchases).where(eq(purchases.id, purchaseId)).for("update").limit(1)
      : [];
    if (!purchase) {
      await tx.update(webhookEvents).set({ processedAt: new Date(), processingError: "purchase_not_found" }).where(eq(webhookEvents.id, claimed.id));
      return { status: "reconciliation_required" as const, reason: "purchase_not_found", creditsGranted: 0 };
    }

    const [payment] = await tx.select().from(payments).where(eq(payments.purchaseId, purchase.id)).for("update").limit(1);
    if (!payment) throw new Error("A purchase is missing its payment record.");
    if (payment.fulfilledAt) {
      if (payment.providerPaymentId !== event.data.payment_id) {
        throw new AppError("conflict", 409, "The fulfilled purchase does not match this provider payment.");
      }
      await tx.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.id, claimed.id));
      return { status: "duplicate" as const, purchaseId: purchase.id, creditsGranted: 0 };
    }

    if (event.type !== "payment.succeeded") {
      // A verified signature authenticates Dodo, not the purchase metadata.
      // Never let a non-success event mutate a purchase it does not fully match.
      const issues = [...paymentIdentityIssues(event, purchase), ...paymentEventStatusIssues(event)];
      if (issues.length > 0) {
        const reason = issues.join(",");
        await tx.update(webhookEvents).set({ processedAt: new Date(), processingError: reason }).where(eq(webhookEvents.id, claimed.id));
        return { status: "reconciliation_required" as const, purchaseId: purchase.id, reason, creditsGranted: 0 };
      }
      const status = event.type === "payment.failed" ? "failed" : event.type === "payment.cancelled" ? "cancelled" : "pending";
      await tx.update(purchases).set({ status, updatedAt: new Date() }).where(eq(purchases.id, purchase.id));
      await tx.update(payments).set({ status, providerPaymentId: event.data.payment_id, rawEventType: event.type, updatedAt: new Date() }).where(eq(payments.id, payment.id));
      await tx.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.id, claimed.id));
      return { status, purchaseId: purchase.id, creditsGranted: 0 };
    }

    const issues = paymentValidationIssues(event, purchase);
    if (issues.length > 0) {
      const reason = issues.join(",");
      await tx.update(purchases).set({ status: "reconciliation_required", reconciliationReason: reason, updatedAt: new Date() }).where(eq(purchases.id, purchase.id));
      await tx.update(payments).set({
        status: "reconciliation_required",
        providerPaymentId: event.data.payment_id,
        taxUsdCents: event.data.tax ?? 0,
        totalUsdCents: event.data.total_amount,
        currency: event.data.currency.toUpperCase(),
        rawEventType: event.type,
        reconciliationReason: reason,
        updatedAt: new Date(),
      }).where(eq(payments.id, payment.id));
      await tx.update(webhookEvents).set({ processedAt: new Date(), processingError: reason }).where(eq(webhookEvents.id, claimed.id));
      return { status: "reconciliation_required" as const, purchaseId: purchase.id, reason, creditsGranted: 0 };
    }

    await tx.update(payments).set({
      providerPaymentId: event.data.payment_id,
      providerCheckoutSessionId: event.data.checkout_session_id,
      taxUsdCents: event.data.tax ?? 0,
      totalUsdCents: event.data.total_amount,
      currency: "USD",
      rawEventType: event.type,
      updatedAt: new Date(),
    }).where(eq(payments.id, payment.id));
    await grantPurchasedCredits(tx, {
      userId: purchase.userId,
      purchaseId: purchase.id,
      credits: purchase.credits,
      correlationId: requestId,
    });
    await tx.update(purchases).set({ status: "succeeded", updatedAt: new Date() }).where(eq(purchases.id, purchase.id));
    await tx.update(payments).set({ status: "succeeded", fulfilledAt: new Date(), updatedAt: new Date() }).where(eq(payments.id, payment.id));
    const [profile] = await tx.select({ email: profiles.email }).from(profiles).where(eq(profiles.id, purchase.userId)).limit(1);
    if (!profile) throw new Error("The fulfilled purchase has no customer email.");
    const emailId = crypto.randomUUID();
    await tx.insert(emailOutbox).values({
      id: emailId,
      template: "credit-purchase-receipt-v1",
      recipient: profile.email,
      payload: { purchaseId: purchase.id, packId: purchase.packId, credits: purchase.credits },
      idempotencyKey: `purchase-receipt:${purchase.id}`,
    });
    await tx.insert(outboxEvents).values({ eventKey: `purchase-receipt:${purchase.id}`, eventName: "orindle/email.delivery.requested", payload: { emailId, purchaseId: purchase.id } });
    await tx.update(webhookEvents).set({ processedAt: new Date() }).where(eq(webhookEvents.id, claimed.id));
    return { status: "fulfilled" as const, purchaseId: purchase.id, creditsGranted: purchase.credits };
  });
}
