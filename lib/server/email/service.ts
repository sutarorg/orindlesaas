import { createHash } from "node:crypto";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/server/db/client";
import { AppError } from "@/lib/server/errors";
import { contactMessages, emailOutbox, outboxEvents } from "@/lib/server/db/schema";
import { readServerEnvironment, requireEnvironment } from "@/lib/server/env";

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(320),
  topic: z.enum(["general", "product", "credits", "accessibility", "privacy"]),
  message: z.string().trim().min(20).max(5000),
  idempotencyKey: z.string().min(12).max(128).regex(/^[A-Za-z0-9:_-]+$/),
}).strict();

export function assertEmailConfigured() {
  requireEnvironment(["RESEND_API_KEY", "RESEND_FROM_EMAIL", "SUPPORT_EMAIL"], "Resend support delivery");
}

export async function queueContactMessage(rawInput: unknown) {
  assertEmailConfigured();
  const input = contactRequestSchema.parse(rawInput);
  const normalized = { ...input, email: input.email.toLowerCase() };
  // The stable client key identifies one logical submission; message content is compared on conflict.
  const requestSha256 = createHash("sha256").update(`contact:${input.idempotencyKey}`).digest("hex");
  const contactId = crypto.randomUUID();
  const emailId = crypto.randomUUID();
  const env = readServerEnvironment();
  return getDb().transaction(async (tx) => {
    const [inserted] = await tx.insert(contactMessages).values({ id: contactId, email: normalized.email, name: normalized.name, topic: normalized.topic, message: normalized.message, requestSha256 }).onConflictDoNothing().returning();
    if (!inserted) {
      const [existing] = await tx.select().from(contactMessages).where(eq(contactMessages.requestSha256, requestSha256)).limit(1);
      if (!existing) throw new AppError("conflict", 409, "The contact submission could not be reconciled. Retry with a new message key.");
      if (existing.email !== normalized.email || existing.name !== normalized.name || existing.topic !== normalized.topic || existing.message !== normalized.message) {
        throw new AppError("conflict", 409, "This message key was already used for different content.");
      }
      return { contactId: existing.id, status: existing.status, duplicate: true };
    }
    await tx.insert(emailOutbox).values({
      id: emailId,
      template: "support-contact-v1",
      recipient: env.SUPPORT_EMAIL!,
      idempotencyKey: `contact-email:${contactId}`,
      payload: { contactId, replyTo: normalized.email, name: normalized.name, topic: normalized.topic, message: normalized.message },
    });
    await tx.insert(outboxEvents).values({ eventKey: `contact-email:${contactId}`, eventName: "orindle/email.delivery.requested", payload: { emailId, contactId } });
    return { contactId, status: "pending" as const, duplicate: false };
  });
}

export async function markEmailFailed(emailId: string, code: string) {
  const [email] = await getDb().select({ payload: emailOutbox.payload }).from(emailOutbox).where(eq(emailOutbox.id, emailId)).limit(1);
  await getDb().transaction(async (tx) => {
    await tx.update(emailOutbox).set({ status: "failed", lastError: code.slice(0, 100), updatedAt: new Date() }).where(eq(emailOutbox.id, emailId));
    if (typeof email?.payload.contactId === "string") await tx.update(contactMessages).set({ status: "failed", updatedAt: new Date() }).where(eq(contactMessages.id, email.payload.contactId));
  });
}

export async function deliverEmail(emailId: string) {
  const [email] = await getDb().select().from(emailOutbox).where(eq(emailOutbox.id, emailId)).limit(1);
  if (!email || email.status === "sent") return { status: email?.status ?? "missing" };
  const env = readServerEnvironment();
  requireEnvironment(["RESEND_API_KEY", "RESEND_FROM_EMAIL"], "Resend delivery");
  let message: { subject: string; text: string; replyTo?: string };
  if (email.template === "support-contact-v1") {
    message = {
      subject: `Orindle support · ${String(email.payload.topic ?? "general")}`,
      text: `From: ${String(email.payload.name ?? "Customer")} <${String(email.payload.replyTo ?? "unknown")}>\nTopic: ${String(email.payload.topic ?? "general")}\n\n${String(email.payload.message ?? "")}`,
      replyTo: typeof email.payload.replyTo === "string" ? email.payload.replyTo : undefined,
    };
  } else if (email.template === "credit-purchase-receipt-v1") {
    const credits = z.number().int().positive().safeParse(email.payload.credits);
    const packId = z.enum(["creator", "pro", "studio"]).safeParse(email.payload.packId);
    if (!credits.success || !packId.success || typeof email.payload.purchaseId !== "string") {
      await markEmailFailed(emailId, "invalid_receipt_payload");
      return { status: "failed" as const };
    }
    message = {
      subject: "Orindle purchase confirmed",
      text: `Your one-time ${packId.data} credit pack purchase is confirmed. ${credits.data} credits have been added to your Orindle wallet.\n\nPurchase reference: ${email.payload.purchaseId}\n\nThis is a purchase receipt, not a subscription renewal.`,
    };
  } else {
    await markEmailFailed(emailId, "unsupported_email_template");
    return { status: "failed" as const };
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL!,
    to: email.recipient,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
  }, { idempotencyKey: email.idempotencyKey });
  if (error || !data?.id) {
    await markEmailFailed(emailId, error?.name ?? "missing_provider_message_id");
    return { status: "failed" as const };
  }
  await getDb().transaction(async (tx) => {
    await tx.update(emailOutbox).set({ status: "sent", providerMessageId: data.id, lastError: null, updatedAt: new Date() }).where(eq(emailOutbox.id, emailId));
    if (typeof email.payload.contactId === "string") await tx.update(contactMessages).set({ status: "sent", updatedAt: new Date() }).where(eq(contactMessages.id, email.payload.contactId));
  });
  return { status: "sent" as const, providerMessageId: data.id };
}
