import { and, eq, lte } from "drizzle-orm";
import { getDb } from "@/lib/server/db/client";
import { outboxEvents } from "@/lib/server/db/schema";
import { runOutboxEvent } from "@/lib/server/jobs/runner";

/** Backoff for an event whose handler failed; the recovery drain retries it once this passes. */
const RETRY_DELAY_MS = 30_000;
/**
 * An event claimed by a crashed request would otherwise sit in `processing` forever, so a drain may
 * steal any claim older than this. Chosen to exceed the slowest inline handler budget.
 */
const CLAIM_LEASE_MS = 5 * 60_000;

/**
 * The outbox no longer forwards events to a hosted queue. Each row's payload describes the work, so
 * it is executed in-process by `runOutboxEvent`. The table is kept because it still provides what the
 * queue used to: durable, idempotent, retryable event delivery that survives a restart.
 */
export async function dispatchOutboxEvent(eventKey: string, options: { inline?: boolean } = {}) {
  const db = getDb();
  const [event] = await db.select().from(outboxEvents).where(eq(outboxEvents.eventKey, eventKey)).limit(1);
  if (!event || event.status === "published") return { dispatched: false, alreadyPublished: true };

  await db.update(outboxEvents)
    .set({ status: "processing", attempts: event.attempts + 1, updatedAt: new Date() })
    .where(eq(outboxEvents.id, event.id));

  try {
    await runOutboxEvent(event.eventName, event.payload as Record<string, unknown>, { inline: options.inline });
    await db.update(outboxEvents)
      .set({ status: "published", publishedAt: new Date(), lastError: null, updatedAt: new Date() })
      .where(eq(outboxEvents.id, event.id));
    return { dispatched: true, alreadyPublished: false };
  } catch (error) {
    // Leave the event pending so the recovery drain retries it; never lose the work.
    await db.update(outboxEvents)
      .set({
        status: "pending",
        lastError: error instanceof Error ? error.message.slice(0, 500) : "DispatchError",
        availableAt: new Date(Date.now() + RETRY_DELAY_MS),
        updatedAt: new Date(),
      })
      .where(eq(outboxEvents.id, event.id));
    console.error(`[outbox] ${event.eventName} (${eventKey}) failed; queued for retry.`, error);
    return { dispatched: false, alreadyPublished: false };
  }
}

/** Drains pending events plus any abandoned by a crashed request. Used by the scheduled tick. */
export async function dispatchPendingOutbox(limit = 20) {
  const db = getDb();
  // "pending" events become eligible once their backoff window passes; abandoned "processing" rows
  // are re-queued separately by reclaimStaleOutboxEvents.
  const events = await db.select({ eventKey: outboxEvents.eventKey }).from(outboxEvents).where(
    and(eq(outboxEvents.status, "pending"), lte(outboxEvents.availableAt, new Date())),
  ).limit(limit);

  const results = [];
  for (const event of events) results.push(await dispatchOutboxEvent(event.eventKey));
  return results;
}

/** Re-queues events whose claiming request died mid-flight. */
export async function reclaimStaleOutboxEvents() {
  const db = getDb();
  const stale = await db.select({ eventKey: outboxEvents.eventKey }).from(outboxEvents).where(
    and(eq(outboxEvents.status, "processing"), lte(outboxEvents.updatedAt, new Date(Date.now() - CLAIM_LEASE_MS))),
  ).limit(20);
  const results = [];
  for (const event of stale) {
    await db.update(outboxEvents).set({ status: "pending", updatedAt: new Date() }).where(eq(outboxEvents.eventKey, event.eventKey));
    results.push(await dispatchOutboxEvent(event.eventKey));
  }
  return results;
}
