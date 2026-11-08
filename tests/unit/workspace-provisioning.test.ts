import { beforeEach, describe, expect, it, vi } from "vitest";

const listEnabledCatalog = vi.fn();
const userId = "11111111-1111-4111-8111-111111111111";
const profileRow = { id: userId, email: "user@orindle.test", fullName: "Test User", avatarUrl: null, createdAt: new Date() };
const walletRow = { userId, availableCredits: 0, reservedCredits: 0 };

/** Chainable stand-in for a Drizzle query builder; awaiting one resolves to its rows. */
function builder(rows: unknown[]): unknown {
  return new Proxy(() => undefined, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown[]) => unknown) => resolve(rows);
      return () => builder(rows);
    },
  });
}

/**
 * `getWorkspaceSnapshot` reads profiles then wallets first; the rest resolve to []. Values are
 * consumed in call order so a repair that re-reads wallets can be modelled.
 */
function dbStub(sequence: unknown[][]) {
  let call = 0;
  const writes: unknown[] = [];
  return {
    writes,
    getDb: () => ({
      select: () => builder(sequence[call++] ?? []),
      insert: () => ({ values: (values: unknown) => ({ onConflictDoNothing: async () => { writes.push(values); } }) }),
    }),
  };
}

vi.mock("@/lib/server/ai/models", () => ({ listEnabledCatalog: () => listEnabledCatalog() }));

vi.mock("@/lib/server/db/client", () => ({ getDb: () => stub.getDb() }));

let stub = dbStub([[profileRow], [walletRow]]);

beforeEach(() => {
  listEnabledCatalog.mockReset().mockResolvedValue([]);
  stub = dbStub([[profileRow], [walletRow]]);
});

const { getWorkspaceSnapshot } = await import("@/lib/server/workspace/queries");

describe("workspace provisioning self-heal", () => {
  it("creates the missing wallet row instead of locking the account out", async () => {
    // Reproduces the permanent lockout: profile exists, wallet does not. Previously this threw
    // "The workspace has not been initialized" forever, which looked like a hang after login.
    // The snapshot's Promise.all consumes eight selects before the repair re-reads wallets.
    stub = dbStub([[profileRow], [], [], [], [], [], [], [], [walletRow]]);

    const snapshot = await getWorkspaceSnapshot(userId);

    expect(stub.writes).toEqual([{ userId }]);
    expect(snapshot.wallet).toBe(walletRow);
    // A provisioned wallet must start empty — this path must never mint credits.
    expect(walletRow.availableCredits).toBe(0);
  });

  it("still refuses when no profile exists", async () => {
    stub = dbStub([[], []]);

    await expect(getWorkspaceSnapshot(userId)).rejects.toThrow("The workspace has not been initialized.");
    expect(stub.writes).toEqual([]);
  });

  it("still refuses when the wallet cannot be provisioned", async () => {
    stub = dbStub([[profileRow], [], [], [], [], [], [], [], []]);

    await expect(getWorkspaceSnapshot(userId)).rejects.toThrow("The workspace has not been initialized.");
  });
});
