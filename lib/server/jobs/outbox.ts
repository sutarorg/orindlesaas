import { and, eq, lte } from "drizzle-orm";
import { Inngest } from "inngest";
import { readServerEnvironment } from "@/lib/server/env";
import { integrationUnavailable } from "@/lib/server/errors";
import { getDb } from "@/lib/server/db/client";
import { outboxEvents } from "@/lib/server/db/schema";

export const inngest = new Inngest({ id: "orindle" });

export function assertOutboxConfigured() {
  const env = readServerEnvironment();
  if (!env.INNGEST_EVENT_KEY) throw integrationUnavailable("Inngest event delivery");
}

export async function dispatchOutboxEvent(eventKey: string) {
  assertOutboxConfigured();
  const [event] = await getDb().select().from(outboxEvents).where(eq(outboxEvents.eventKey, eventKey)).limit(1);
  if (!event || event.status === "published") return { dispatched: false, alreadyPublished: true };
  await getDb().update(outboxEvents).set({ status: "processing", attempts: event.attempts + 1, updatedAt: new Date() }).where(eq(outboxEvents.id, event.id));
  try {
    await inngest.send({ id: event.eventKey, name: event.eventName, data: event.payload });
    await getDb().update(outboxEvents).set({ status: "published", publishedAt: new Date(), lastError: null, updatedAt: new Date() }).where(eq(outboxEvents.id, event.id));
    return { dispatched: true, alreadyPublished: false };
  } catch (error) {
    await getDb().update(outboxEvents).set({ status: "pending", lastError: error instanceof Error ? error.name : "DispatchError", availableAt: new Date(Date.now() + 30_000), updatedAt: new Date() }).where(eq(outboxEvents.id, event.id));
    return { dispatched: false, alreadyPublished: false };
  }
}

export async function dispatchPendingOutbox(limit = 20) {
  const events = await getDb().select({ eventKey: outboxEvents.eventKey }).from(outboxEvents).where(
    and(eq(outboxEvents.status, "pending"), lte(outboxEvents.availableAt, new Date())),
  ).limit(limit);
  const results = [];
  for (const event of events) results.push(await dispatchOutboxEvent(event.eventKey));
  return results;
}
