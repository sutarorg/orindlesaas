import { beforeEach, describe, expect, it, vi } from "vitest";

const listEnabledCatalog = vi.fn();
const userId = "11111111-1111-4111-8111-111111111111";
const profileRow = { id: userId, email: "user@orindle.test", fullName: "Test User", avatarUrl: null, createdAt: new Date() };
const walletRow = { userId, availableCredits: 250, reservedCredits: 0 };

/** Chainable stand-in for a Drizzle query builder; awaiting one resolves to its rows. */
function builder(rows: unknown[]): unknown {
  return new Proxy(() => undefined, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown[]) => unknown) => resolve(rows);
      return () => builder(rows);
    },
  });
}

/** Returns the given row sets in the order `getWorkspaceSnapshot` issues its selects. */
function dbStub(rowSets: unknown[][]) {
  let selectCount = 0;
  return { select: () => builder(rowSets[selectCount++] ?? []) };
}

const getDbMock = vi.fn(() => dbStub([[profileRow], [walletRow]]));

vi.mock("@/lib/server/ai/models", () => ({ listEnabledCatalog: (...args: unknown[]) => listEnabledCatalog(...args) }));
vi.mock("@/lib/server/db/client", () => ({ getDb: () => getDbMock() }));

const { getWorkspaceSnapshot } = await import("@/lib/server/workspace/queries");

beforeEach(() => {
  listEnabledCatalog.mockReset();
  getDbMock.mockReturnValue(dbStub([[profileRow], [walletRow]]));
});

describe("workspace snapshot resilience", () => {
  it("does not fail the whole workspace when the model catalogue is unreadable", async () => {
    // Reproduces a database that has not had the catalogue migrations applied: selecting from
    // models/model_prices throws. That error previously escaped app/app/layout.tsx and replaced
    // the entire dashboard with Next.js's global error page ("This page couldn't load").
    listEnabledCatalog.mockRejectedValue(new Error("column models.catalog_type does not exist"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const snapshot = await getWorkspaceSnapshot(userId);

    expect(snapshot.profile).toBe(profileRow);
    expect(snapshot.wallet).toBe(walletRow);
    expect(snapshot.models).toEqual([]);
    expect(snapshot.modelsLoaded).toBe(false);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("marks the catalogue as loaded when the query succeeds", async () => {
    const catalogue = [{ id: "gateway:openai/example" }];
    listEnabledCatalog.mockResolvedValue(catalogue);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const snapshot = await getWorkspaceSnapshot(userId);

    expect(snapshot.models).toEqual(catalogue);
    expect(snapshot.modelsLoaded).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("still refuses to serve a workspace with no profile or wallet row", async () => {
    listEnabledCatalog.mockResolvedValue([]);
    getDbMock.mockReturnValue(dbStub([]));

    await expect(getWorkspaceSnapshot(userId)).rejects.toThrow("The workspace has not been initialized.");
  });
});
