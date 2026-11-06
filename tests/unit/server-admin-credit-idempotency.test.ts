import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  enforceRateLimit: vi.fn(),
  lockCreditWallet: vi.fn(),
  appendWalletMovement: vi.fn(),
  movements: [] as Array<Record<string, unknown>>,
  audits: [] as Array<Record<string, unknown>>,
  idempotency: new Map<string, Record<string, unknown>>(),
  lastClaim: null as Record<string, unknown> | null,
}));
vi.mock("@/lib/server/auth/guards", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/server/security/rate-limit", () => ({ enforceRateLimit: mocks.enforceRateLimit, requestIdentifier: () => "admin:test" }));
vi.mock("@/lib/server/credits/ledger", () => ({ lockCreditWallet: mocks.lockCreditWallet, appendWalletMovement: mocks.appendWalletMovement }));
vi.mock("@/lib/server/db/client", () => ({ getDb: () => ({ transaction: async (callback: (tx: typeof transaction) => unknown) => callback(transaction) }) }));

import { POST } from "@/app/api/v1/admin/credits/adjust/route";
import { auditEvents, idempotencyRecords } from "@/lib/server/db/schema";

const adminId = "00000000-0000-4000-8000-000000000301";
const firstUser = "00000000-0000-4000-8000-000000000302";
const secondUser = "00000000-0000-4000-8000-000000000303";

const transaction = {
  insert(table: unknown) {
    if (table === auditEvents) return { values: async (value: Record<string, unknown>) => { mocks.audits.push(value); return []; } };
    if (table !== idempotencyRecords) throw new Error("Unexpected insert");
    return { values: (value: Record<string, unknown>) => {
      mocks.lastClaim = value;
      return { onConflictDoNothing: () => ({ returning: async () => {
        const key = `${String(value.actorId)}:${String(value.operation)}:${String(value.key)}`;
        if (mocks.idempotency.has(key)) { mocks.lastClaim = mocks.idempotency.get(key)!; return []; }
        const stored = { ...value, id: "idempotency-row" };
        mocks.idempotency.set(key, stored);
        mocks.lastClaim = stored;
        return [{ id: "idempotency-row" }];
      } }) };
    } };
  },
  select() {
    return { from: (table: unknown) => {
      if (table !== idempotencyRecords) throw new Error("Unexpected select");
      return { where: () => ({ for: () => ({ limit: async () => mocks.lastClaim ? [mocks.lastClaim] : [] }) }) };
    } };
  },
  update(table: unknown) {
    if (table !== idempotencyRecords) throw new Error("Unexpected update");
    return { set: (values: Record<string, unknown>) => ({ where: async () => {
      if (mocks.lastClaim) Object.assign(mocks.lastClaim, values);
      return [];
    } }) };
  },
};

function request(userId: string, key = "adjustment-key-0001") {
  return new Request("https://orindle.com/api/v1/admin/credits/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://orindle.com", Host: "orindle.com" },
    body: JSON.stringify({ userId, amountCredits: 25, reason: "Synthetic support correction", idempotencyKey: key }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.movements.length = 0;
  mocks.audits.length = 0;
  mocks.idempotency.clear();
  mocks.lastClaim = null;
  mocks.requireAdmin.mockResolvedValue({ userId: adminId });
  mocks.enforceRateLimit.mockResolvedValue(undefined);
  mocks.lockCreditWallet.mockImplementation(async (_tx, userId: string) => ({ userId, availableCredits: 100, reservedCredits: 0, version: 0 }));
  mocks.appendWalletMovement.mockImplementation(async (_tx, movement: Record<string, unknown>) => {
    const existing = mocks.movements.find((entry) => entry.userId === movement.userId && entry.kind === movement.kind && entry.idempotencyKey === movement.idempotencyKey);
    if (existing) return { duplicate: true, entry: existing, wallet: { availableCredits: 125, reservedCredits: 0, version: 1 } };
    const entry = { id: `movement-${mocks.movements.length + 1}`, ...movement, availableAfterCredits: 125 };
    mocks.movements.push(entry);
    return { duplicate: false, entry, wallet: { availableCredits: 125, reservedCredits: 0, version: 1 } };
  });
});

describe("admin credit-adjustment idempotency", () => {
  it("rejects reuse of one actor's key for a different target before another wallet effect", async () => {
    const first = await POST(request(firstUser));
    const second = await POST(request(secondUser));
    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(mocks.movements).toHaveLength(1);
    expect(mocks.audits).toHaveLength(1);
  });

  it("recovers the original result for an identical retry without another audit", async () => {
    const first = await POST(request(firstUser));
    const second = await POST(request(firstUser));
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.data).toMatchObject({ duplicate: true, availableCredits: 125 });
    expect(mocks.movements).toHaveLength(1);
    expect(mocks.audits).toHaveLength(1);
  });
});
