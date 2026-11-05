import { describe, expect, it } from "vitest";
import {
  creditsForActualCost,
  formatUsdNanodollars,
  grossContributionNanodollars,
  parseUsdNanodollars,
} from "@/lib/server/credits/arithmetic";
import { appendWalletMovement, settleReservation } from "@/lib/server/credits/ledger";
import type { DbTransaction } from "@/lib/server/db/types";

describe("exact AI cost arithmetic", () => {
  it.each([
    ["0", 0n],
    ["0.00000001", 10n],
    ["0.005", 5_000_000n],
    ["1", 1_000_000_000n],
    ["123.12345678", 123_123_456_780n],
  ])("parses %s without float arithmetic", (input, expected) => {
    expect(parseUsdNanodollars(input)).toBe(expected);
    expect(parseUsdNanodollars(formatUsdNanodollars(expected))).toBe(expected);
  });

  it("rounds the customer charge up to a whole credit", () => {
    expect(creditsForActualCost("0")).toBe(0n);
    expect(creditsForActualCost("0.00000001")).toBe(1n);
    expect(creditsForActualCost("0.005")).toBe(1n);
    expect(creditsForActualCost("0.00500001")).toBe(2n);
    expect(creditsForActualCost("1")).toBe(200n);
  });

  it("keeps customer value and provider cost separate", () => {
    expect(grossContributionNanodollars(2n, "0.01")).toBe(10_000_000n);
  });

  it.each(["-1", "1e-8", ".01", "1.123456789", "NaN", ""])("rejects invalid cost %s", (input) => {
    expect(() => parseUsdNanodollars(input)).toThrow();
  });
});

function settledReservationTransaction() {
  const reservation = { id: "reservation", userId: "user", jobId: "job", status: "settled", actualCostUsd: "0.00500000", actualCredits: 1 };
  const tx = {
    select: () => ({ from: () => ({ where: () => ({ for: () => ({ limit: async () => [reservation] }) }) }) }),
  } as unknown as DbTransaction;
  return tx;
}

describe("settlement evidence identity", () => {
  it("recovers an identical settled result without another wallet movement", async () => {
    const result = await settleReservation(settledReservationTransaction(), { reservationId: "reservation", actualCostUsd: "0.005", correlationId: "request" });
    expect(result).toMatchObject({ status: "settled", duplicate: true, actualCredits: 1 });
  });

  it("rejects different exact costs even when they round to the same credit", async () => {
    await expect(settleReservation(settledReservationTransaction(), { reservationId: "reservation", actualCostUsd: "0.00499999", correlationId: "request" })).rejects.toMatchObject({ code: "conflict", status: 409 });
  });

  it("rejects an overdraft before writing a wallet or ledger mutation", async () => {
    let selectCall = 0;
    let mutationAttempted = false;
    const wallet = { userId: "user", availableCredits: 0, reservedCredits: 0, lifetimePurchasedCredits: 0, lifetimeUsedCredits: 0, version: 0 };
    const tx = {
      insert: () => ({ values: () => ({ onConflictDoNothing: async () => undefined }) }),
      select: () => {
        selectCall += 1;
        const call = selectCall;
        return { from: () => ({ where: () => call === 1 ? { for: () => ({ limit: async () => [wallet] }) } : { limit: async () => [] } }) };
      },
      update: () => { mutationAttempted = true; throw new Error("must not update"); },
    } as unknown as DbTransaction;
    await expect(appendWalletMovement(tx, { userId: "user", kind: "admin_adjustment", availableDelta: -1, reservedDelta: 0, referenceType: "test", referenceId: "overdraft", correlationId: "request", idempotencyKey: "overdraft", description: "Must not overdraw" })).rejects.toMatchObject({ code: "insufficient_credits", status: 409 });
    expect(mutationAttempted).toBe(false);
  });
});
