export const NANODOLLARS_PER_DOLLAR = 1_000_000_000n;
export const CREDITS_PER_DOLLAR = 100n;
export const CREDIT_MARKUP = 2n;
export const NANODOLLARS_PER_CREDIT = NANODOLLARS_PER_DOLLAR / CREDITS_PER_DOLLAR;

export function assertNonNegativeSafeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer.`);
  }
  return value;
}

/** Parse a numeric(24,8) USD value without passing through a JavaScript float. */
export function parseUsdNanodollars(value: string | bigint): bigint {
  if (typeof value === "bigint") {
    if (value < 0n) throw new RangeError("Actual AI cost cannot be negative.");
    return value;
  }
  const normalized = value.trim();
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,8}))?$/.exec(normalized);
  if (!match) throw new RangeError("Cost must be a non-negative decimal with at most 8 decimal places.");
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").padEnd(8, "0");
  return BigInt(whole) * NANODOLLARS_PER_DOLLAR + BigInt(fraction + "0");
}

export function formatUsdNanodollars(value: bigint): string {
  if (value < 0n) throw new RangeError("Actual AI cost cannot be negative.");
  const whole = value / NANODOLLARS_PER_DOLLAR;
  const fraction = (value % NANODOLLARS_PER_DOLLAR).toString().padStart(9, "0").slice(0, 8);
  return `${whole}.${fraction}`;
}

/** Customer charge: 2x actual cost at $1 per 100 credits, rounded up to one credit. */
export function creditsForActualCost(actualCostUsd: string | bigint): bigint {
  const nanodollars = parseUsdNanodollars(actualCostUsd);
  const numerator = nanodollars * CREDITS_PER_DOLLAR * CREDIT_MARKUP;
  return (numerator + NANODOLLARS_PER_DOLLAR - 1n) / NANODOLLARS_PER_DOLLAR;
}

export function customerValueNanodollars(credits: bigint): bigint {
  if (credits < 0n) throw new RangeError("Credits cannot be negative.");
  return credits * NANODOLLARS_PER_CREDIT;
}

export function grossContributionNanodollars(customerCredits: bigint, actualCostUsd: string | bigint) {
  return customerValueNanodollars(customerCredits) - parseUsdNanodollars(actualCostUsd);
}

export function nanodollarsToSafeNumber(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new RangeError("Nanodollar value exceeds safe integer range.");
  return result;
}
