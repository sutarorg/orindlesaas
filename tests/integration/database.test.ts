import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/lib/server/db/client";
import { applyAdminCreditAdjustment } from "@/lib/server/admin/credit-adjustments";
import { appendWalletMovement, holdCredits, settleReservation } from "@/lib/server/credits/ledger";
import { fulfillDodoPayment } from "@/lib/server/payments/fulfillment";
import { paymentWebhookSchema } from "@/lib/server/payments/payment-validation";
import { creditPacks as contentPacks } from "@/lib/content/pricing";
import { creditPacks, modelPrices, models, providers } from "@/lib/server/db/schema";
import type { VerifiedIdentity } from "@/lib/server/auth/guards";

let admin: ReturnType<typeof postgres>;
const databaseUrl = process.env.DATABASE_URL;

async function createUser(id: string, label: string) {
  await admin`insert into auth.users (id, email, raw_user_meta_data) values (${id}, ${`${label}@orindle.qa`}, ${admin.json({ name: label })})`;
}

async function wallet(userId: string) {
  const [row] = await admin<{ available: number; reserved: number; purchased: number; used: number }[]>`
    select available_credits::int available, reserved_credits::int reserved,
      lifetime_purchased_credits::int purchased, lifetime_used_credits::int used
    from public.wallets where user_id = ${userId}`;
  return row;
}

async function asRole(role: "anon" | "authenticated", userId: string, operation: () => Promise<unknown>) {
  await admin.unsafe(`SET ROLE ${role}`);
  await admin`select set_config('request.jwt.claim.sub', ${userId}, false)`;
  try {
    return await operation();
  } finally {
    await admin.unsafe("RESET ROLE");
    await admin`select set_config('request.jwt.claim.sub', '', false)`;
  }
}

function identity(userId: string) {
  return { userId } as VerifiedIdentity;
}

beforeAll(async () => {
  if (process.env.QA_DATABASE_DISPOSABLE !== "1" || !databaseUrl) {
    throw new Error("BLOCKED: real PostgreSQL tests require DATABASE_URL and QA_DATABASE_DISPOSABLE=1 for a disposable database.");
  }
  const parsed = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1", "postgres"].includes(parsed.hostname) || parsed.pathname !== "/orindle_qa") {
    throw new Error("BLOCKED: database tests allow only the local/CI orindle_qa database on localhost, 127.0.0.1 or postgres.");
  }
  admin = postgres(databaseUrl, { max: 1, prepare: false });
  await admin.unsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    END $$;
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS auth CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    CREATE SCHEMA public;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    REVOKE ALL ON auth.users FROM anon, authenticated;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
  `);
  await migrate(getDb(), { migrationsFolder: path.resolve("drizzle") });
  await getDb().transaction(async (tx) => {
    for (const pack of contentPacks) {
      await tx.insert(creditPacks).values({ id: pack.id, name: pack.name, credits: pack.credits, subtotalUsdCents: pack.priceUsd * 100, enabled: true }).onConflictDoNothing();
    }
  });
});

afterAll(async () => {
  await closeDb();
  if (admin) await admin.end({ timeout: 5 });
});

describe("disposable real PostgreSQL verification", () => {
  it("applies the migration chain and exact idempotent pack seed", async () => {
    const rows = await admin<{ id: string; credits: number; subtotal: number; currency: string }[]>`select id, credits::int, subtotal_usd_cents::int subtotal, currency from public.credit_packs order by id`;
    expect(rows).toEqual([
      { id: "creator", credits: 1900, subtotal: 1900, currency: "USD" },
      { id: "pro", credits: 4900, subtotal: 4900, currency: "USD" },
      { id: "studio", credits: 9900, subtotal: 9900, currency: "USD" },
    ]);
    const [rls] = await admin<{ count: number }[]>`select count(*)::int count from pg_tables where schemaname = 'public' and not rowsecurity`;
    expect(rls?.count).toBe(0);
  });

  it("enforces final grants and RLS independently of owner policies", async () => {
    const first = "00000000-0000-4000-8000-000000001001";
    const second = "00000000-0000-4000-8000-000000001002";
    await createUser(first, "rls-first");
    await createUser(second, "rls-second");
    await admin`update public.wallets set available_credits = 100 where user_id = ${first}`;
    await admin`update public.wallets set available_credits = 200 where user_id = ${second}`;

    const own = await asRole("authenticated", first, () => admin`select user_id, available_credits::int from public.wallets order by user_id`);
    expect(own).toEqual([{ user_id: first, available_credits: 100 }]);
    const profiles = await asRole("authenticated", first, () => admin`select id from public.profiles order by id`);
    expect(profiles).toEqual([{ id: first }]);
    const packs = await asRole("anon", "", () => admin`select id from public.credit_packs order by id`);
    expect(packs).toHaveLength(3);
    await expect(asRole("authenticated", first, () => admin`select id from public.generation_jobs`)).rejects.toThrow(/permission denied/);
    await expect(asRole("authenticated", first, () => admin`insert into public.wallets (user_id) values (${second})`)).rejects.toThrow(/permission denied/);
    await expect(asRole("anon", "", () => admin`select user_id from public.wallets`)).rejects.toThrow(/permission denied/);
  });

  it("serializes concurrent holds and settlements without overdraft or duplicate effects", async () => {
    const userId = "00000000-0000-4000-8000-000000002001";
    await createUser(userId, "wallet-race");
    await admin`update public.wallets set available_credits = 1000 where user_id = ${userId}`;
    const holds = await Promise.all(Array.from({ length: 20 }, (_, index) => getDb().transaction((tx) => holdCredits(tx, {
      userId,
      estimatedCostUsd: "0.25",
      idempotencyKey: `qa-hold-${index}-${crypto.randomUUID()}`,
      correlationId: `qa-hold-${index}`,
    }))));
    expect(holds).toHaveLength(20);
    await expect(getDb().transaction((tx) => holdCredits(tx, { userId, estimatedCostUsd: "0.01", idempotencyKey: `qa-overdraft-${crypto.randomUUID()}`, correlationId: "qa-overdraft" }))).rejects.toMatchObject({ code: "insufficient_credits" });
    expect(await wallet(userId)).toEqual({ available: 0, reserved: 1000, purchased: 0, used: 0 });

    const settlements = await Promise.all(holds.map((hold, index) => getDb().transaction((tx) => settleReservation(tx, {
      reservationId: hold.reservation.id,
      actualCostUsd: "0.10",
      correlationId: `qa-settle-${index}`,
    }))));
    expect(settlements.every((result) => result.status === "settled" && !result.duplicate)).toBe(true);
    expect(await wallet(userId)).toEqual({ available: 600, reserved: 0, purchased: 0, used: 400 });
    const [aggregate] = await admin<{ available: number; reserved: number; settlements: number }[]>`select coalesce(sum(available_delta_credits), 0)::int available, coalesce(sum(reserved_delta_credits), 0)::int reserved, count(*) filter (where kind = 'usage_settlement')::int settlements from public.wallet_ledger where user_id = ${userId}`;
    expect(aggregate).toEqual({ available: -400, reserved: 0, settlements: 20 });

    const reservationId = holds[0]!.reservation.id;
    const replay = await getDb().transaction((tx) => settleReservation(tx, { reservationId, actualCostUsd: "0.10", correlationId: "qa-replay" }));
    expect(replay).toMatchObject({ status: "settled", duplicate: true });
    await expect(getDb().transaction((tx) => settleReservation(tx, { reservationId, actualCostUsd: "0.09999999", correlationId: "qa-changed-evidence" }))).rejects.toMatchObject({ code: "conflict" });
    const [count] = await admin<{ count: number }[]>`select count(*)::int count from public.wallet_ledger where user_id = ${userId} and kind = 'usage_settlement'`;
    expect(count?.count).toBe(20);
  });

  it("preserves an over-cost reservation for reconciliation and settles only after funded recovery", async () => {
    const userId = "00000000-0000-4000-8000-000000002101";
    await createUser(userId, "wallet-reconciliation");
    await admin`update public.wallets set available_credits = 10 where user_id = ${userId}`;
    const hold = await getDb().transaction((tx) => holdCredits(tx, { userId, estimatedCostUsd: "0.025", idempotencyKey: `qa-reconcile-hold-${crypto.randomUUID()}`, correlationId: "qa-reconcile-hold" }));
    const required = await getDb().transaction((tx) => settleReservation(tx, { reservationId: hold.reservation.id, actualCostUsd: "1", correlationId: "qa-reconcile-cost" }));
    expect(required).toMatchObject({ status: "reconciliation_required", actualCredits: 200 });
    expect(await wallet(userId)).toEqual({ available: 5, reserved: 5, purchased: 0, used: 0 });

    await getDb().transaction((tx) => appendWalletMovement(tx, {
      userId,
      kind: "admin_adjustment",
      availableDelta: 195,
      reservedDelta: 0,
      referenceType: "qa_recovery",
      referenceId: "qa-recovery-001",
      correlationId: "qa-recovery",
      idempotencyKey: `qa-recovery-${crypto.randomUUID()}`,
      description: "Disposable reconciliation recovery fixture",
    }));
    const recovered = await getDb().transaction((tx) => settleReservation(tx, { reservationId: hold.reservation.id, actualCostUsd: "1", correlationId: "qa-recovered-settlement" }));
    expect(recovered).toMatchObject({ status: "settled", actualCredits: 200 });
    expect(await wallet(userId)).toEqual({ available: 5, reserved: 0, purchased: 0, used: 200 });
  });

  it("fulfills one verified purchase exactly once under concurrent webhook delivery", async () => {
    const userId = "00000000-0000-4000-8000-000000003001";
    const purchaseId = "00000000-0000-4000-8000-000000003002";
    const eventId = `evt-${crypto.randomUUID()}`;
    await createUser(userId, "webhook-race");
    await admin`insert into public.purchases (id, user_id, pack_id, credits, subtotal_usd_cents, provider_product_id, checkout_session_id, idempotency_key) values (${purchaseId}, ${userId}, 'creator', 1900, 1900, 'pdt_creator_test', 'cks_qa_race', 'checkout-qa-race-0001')`;
    await admin`insert into public.payments (purchase_id, user_id, subtotal_usd_cents) values (${purchaseId}, ${userId}, 1900)`;
    const event = paymentWebhookSchema.parse({
      type: "payment.succeeded",
      business_id: "business_qa",
      timestamp: "2026-11-05T00:00:00Z",
      data: {
        payment_id: "pay_qa_race",
        status: "succeeded",
        currency: "USD",
        total_amount: 1900,
        tax: 0,
        checkout_session_id: "cks_qa_race",
        subscription_ids: [],
        metadata: { schema_version: "1", purchase_id: purchaseId, user_id: userId, pack_id: "creator" },
        product_cart: [{ product_id: "pdt_creator_test", quantity: 1 }],
      },
    });
    const payloadSha256 = "a".repeat(64);
    const results = await Promise.all(Array.from({ length: 8 }, () => fulfillDodoPayment({ event, eventId, payloadSha256, requestId: "qa-webhook-race" })));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "duplicate")).toHaveLength(7);
    expect(await wallet(userId)).toEqual({ available: 1900, reserved: 0, purchased: 1900, used: 0 });
    const [effects] = await admin<{ ledger: number; receipts: number; outbox: number; webhooks: number }[]>`select
      (select count(*)::int from public.wallet_ledger where user_id = ${userId} and kind = 'purchase') ledger,
      (select count(*)::int from public.email_outbox where idempotency_key = ${`purchase-receipt:${purchaseId}`}) receipts,
      (select count(*)::int from public.outbox_events where event_key = ${`purchase-receipt:${purchaseId}`}) outbox,
      (select count(*)::int from public.webhook_events where event_id = ${eventId} and processed_at is not null) webhooks`;
    expect(effects).toEqual({ ledger: 1, receipts: 1, outbox: 1, webhooks: 1 });
    await expect(fulfillDodoPayment({ event, eventId, payloadSha256: "b".repeat(64), requestId: "qa-substituted-body" })).rejects.toMatchObject({ code: "conflict" });
    await expect(admin`update public.wallet_ledger set description = 'forbidden' where user_id = ${userId}`).rejects.toThrow(/append-only/);
    expect(await wallet(userId)).toEqual({ available: 1900, reserved: 0, purchased: 1900, used: 0 });
  });

  it("scopes admin replay to actor and operation across targets and concurrent requests", async () => {
    const actorId = "00000000-0000-4000-8000-000000004001";
    const otherActorId = "00000000-0000-4000-8000-000000004002";
    const firstUser = "00000000-0000-4000-8000-000000004003";
    const secondUser = "00000000-0000-4000-8000-000000004004";
    for (const [id, label] of [[actorId, "actor"], [otherActorId, "other-actor"], [firstUser, "target-one"], [secondUser, "target-two"]] as const) await createUser(id, label);
    const base = { amountCredits: 25, reason: "Disposable admin correction", idempotencyKey: "admin-qa-key-000001" };
    const first = await applyAdminCreditAdjustment(identity(actorId), { ...base, userId: firstUser }, "qa-admin-first");
    expect(first).toMatchObject({ duplicate: false, availableCredits: 25 });
    expect(await applyAdminCreditAdjustment(identity(actorId), { ...base, userId: firstUser }, "qa-admin-replay")).toMatchObject({ duplicate: true, availableCredits: 25 });
    await expect(applyAdminCreditAdjustment(identity(actorId), { ...base, userId: secondUser }, "qa-admin-cross-target")).rejects.toMatchObject({ code: "conflict" });
    expect(await applyAdminCreditAdjustment(identity(otherActorId), { ...base, userId: firstUser }, "qa-admin-other-actor")).toMatchObject({ duplicate: true, availableCredits: 25 });

    const raceInput = { amountCredits: 25, reason: "Disposable admin correction", idempotencyKey: "admin-qa-race-000001" };
    const race = await Promise.allSettled([
      applyAdminCreditAdjustment(identity(actorId), { ...raceInput, userId: firstUser }, "qa-admin-race-one"),
      applyAdminCreditAdjustment(identity(actorId), { ...raceInput, userId: secondUser }, "qa-admin-race-two"),
    ]);
    expect(race.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(race.filter((result) => result.status === "rejected")).toHaveLength(1);
    const [effects] = await admin<{ movements: number; audits: number; claims: number; total: number }[]>`select
      (select count(*)::int from public.wallet_ledger where actor_id = ${actorId} and kind = 'admin_adjustment') movements,
      (select count(*)::int from public.audit_events where actor_id = ${actorId} and action = 'credits.adjust') audits,
      (select count(*)::int from public.idempotency_records where actor_id = ${actorId} and operation = 'credits.adjust') claims,
      (select coalesce(sum(available_credits), 0)::int from public.wallets where user_id in (${firstUser}, ${secondUser})) total`;
    expect(effects).toEqual({ movements: 2, audits: 2, claims: 2, total: 50 });
  });

  it("enforces one open price interval and append-only rate history", async () => {
    await getDb().insert(providers).values({ id: "qa-provider", name: "Disposable Provider", enabled: false });
    await getDb().insert(models).values({ id: "qa-model", providerId: "qa-provider", gatewayModelId: "qa/provider/model", name: "Disposable Model", kind: "chat", enabled: false });
    const [current] = await getDb().insert(modelPrices).values({ modelId: "qa-model", inputNanoUsdPerToken: 10, outputNanoUsdPerToken: 20, operationNanoUsd: null, source: "qa" }).returning();
    expect(current).toBeDefined();
    await expect(getDb().insert(modelPrices).values({ modelId: "qa-model", inputNanoUsdPerToken: 11, outputNanoUsdPerToken: 21, operationNanoUsd: null, source: "qa" })).rejects.toMatchObject({
      cause: { code: "23505", constraint_name: "model_prices_one_open_per_model" },
    });
    const closing = new Date(Date.now() + 60_000);
    await getDb().update(modelPrices).set({ effectiveTo: closing }).where(and(eq(modelPrices.id, current!.id), eq(modelPrices.modelId, "qa-model")));
    const [next] = await getDb().insert(modelPrices).values({ modelId: "qa-model", inputNanoUsdPerToken: 11, outputNanoUsdPerToken: 21, operationNanoUsd: null, source: "qa", effectiveFrom: closing }).returning();
    await expect(getDb().update(modelPrices).set({ inputNanoUsdPerToken: 99 }).where(eq(modelPrices.id, next!.id))).rejects.toMatchObject({
      cause: { message: expect.stringContaining("only the first valid effective_to closure") },
    });
    await expect(getDb().delete(modelPrices).where(eq(modelPrices.id, next!.id))).rejects.toMatchObject({
      cause: { message: expect.stringContaining("append-only") },
    });
  });
});
