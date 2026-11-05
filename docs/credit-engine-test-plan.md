# Credit engine and financial concurrency test plan

Status: **pre-execution**. The wallet and append-only ledger are authoritative; Dodo entitlement meters are not a second balance. All money/credit calculations use integers or decimal strings, never binary floating-point ledger arithmetic.

## Invariants under test

1. Exactly one wallet per user; available, reserved, lifetime purchased, and lifetime used counters are non-negative safe integers.
2. Pack grants are exactly Creator 1,900, Pro 4,900, Studio 9,900 credits. Purchases do not expire by application rule.
3. Every counter change has one append-only ledger entry with matching after-balances, owner, kind, reference, correlation, and idempotency identity.
4. A hold of H performs available `-H`, reserved `+H`. Release reverses it. Settlement at actual A performs reserved `-H`, available `H-A`, lifetime used `+A`.
5. Final credits equal `ceil(actual_metered_cost_usd × 200)`. Estimated cost is never substituted for missing actual metering.
6. If available plus the hold cannot cover A, no overdraft or false success occurs; the reservation retains the hold and enters reconciliation with actual evidence.
7. Identical retries recover the original effect. Same key with different request, target, actor, exact cost, or metering identity conflicts rather than silently deduplicating.
8. Ledger and audit history cannot be updated/deleted through application roles. External side effects are reconciled, not falsely described as part of the PostgreSQL transaction.

## Exact arithmetic vectors

| Actual USD | Expected credits | Notes |
|---|---:|---|
| `0` | 0 | Zero-cost completion still has explicit state |
| `0.00000001` | 1 | Smallest stored decimal unit rounds up |
| `0.005` | 1 | $0.01 customer value before rounding |
| `0.00500001` | 2 | Just over one-credit boundary |
| `0.01` | 2 | Documented example |
| `1` | 200 | Documented example |
| `123.12345678` | 24,625 | Ceiling of exact decimal ×200 |

Reject negative, exponent, NaN/infinite, empty, leading-dot, excess-precision, unsafe-integer, and values beyond supported storage/conversion bounds. Round-trip decimal formatting without dropping the eight-place storage representation.

## State-transition cases

| Case | Initial state | Action | Expected final evidence |
|---|---|---|---|
| CR-T01 | 1,900 available / 0 reserved | Hold 500 | 1,400 / 500; one hold entry |
| CR-T02 | Held 500 | Release | 1,900 / 0; one release; repeat is duplicate |
| CR-T03 | Held 500 | Settle A=300 | 1,700 / 0; used +300; one settlement |
| CR-T04 | Held 500 | Settle A=500 | 1,400 / 0; used +500 |
| CR-T05 | Held 500 | Settle A=100 | 1,800 / 0; over-reservation returned |
| CR-T06 | 100 available + held 500 | Settle A=700 | Available/reserved unchanged; reconciliation required; actual evidence stored |
| CR-T07 | CR-T06 | Audited +600 adjustment, then same settlement | Settles exactly once; output retained; usage becomes settled |
| CR-T08 | Settled A=300 | Same exact retry | Duplicate; no new ledger/usage/job transition |
| CR-T09 | Settled A=300 | Different exact cost with same rounded credits | Conflict; no mutation |
| CR-T10 | Settled A=300 | Same cost, different Gateway generation ID | Conflict; no mutation |
| CR-T11 | No/empty provider output with actual cost | Settle failed result | Actual cost may be charged; generation is failed, not succeeded |
| CR-T12 | Missing generation ID/cost | Attempt settlement | Reconciliation/unavailable; estimate is not actual |

## Real PostgreSQL concurrency suite

These tests require independent database connections and a disposable PostgreSQL database. Mocked `for("update")` chains are not acceptable evidence.

### CR-C01 — Competing holds

- Arrange a wallet with 1,900 available and 20 independent requests for 100 credits each, released simultaneously by a barrier.
- Expect exactly 19 successful holds and one insufficient-credit result (unless the test intentionally uses a different cardinality); available 0, reserved 1,900.
- Assert 19 hold entries, no negative value, version equals successful mutation count from the known starting version, and ledger-derived balances match the wallet.

### CR-C02 — Identical request race

- Run 20 identical purchase/hold/settlement/adjustment requests concurrently.
- Expect one business effect and one applicable ledger/audit/outbox record; other callers return the original result or a safe conflict according to the contract.
- Repeat the key with changed amount, reason, target user, actor, request hash, exact cost, and generation identity. Each mismatch must conflict with no new effect.

### CR-C03 — Settlement/release race

- Race settlement and release for one reservation, and race two different settlements for two reservations sharing one wallet.
- Expect exactly one legal terminal transition per reservation, no deadlock loop without bounded handling, no lost wallet update, and consistent usage evidence.
- A legal retry must not convert released back to held/settled.

### CR-C04 — Reconciliation recovery race

- Create an actual charge above available funds, then concurrently credit the wallet and run two metering recoveries.
- Expect no negative balance, one settlement movement, one settled usage record, and one final generation result. Provider output remains stored while reconciliation is open.

### CR-C05 — Administrative adjustment and audit

- Race positive/negative adjustments, overdraft attempts, same-key retries, same key/different target, and same key/different actor.
- Expect every new effect to have exactly one attributable append-only audit row in the same transaction. Audit failure rolls back the ledger mutation. No cross-target or cross-actor silent deduplication is allowed.

## Reconciliation SQL evidence

For each test user and trial, capture safe synthetic IDs and:

- wallet counters/version;
- ordered ledger kind/deltas/after-values/idempotency references (no private metadata);
- reservation estimated/actual credits and status;
- usage exact actual cost, generation identity, charged credits, and reconciliation state;
- generation status/result presence and submission state;
- adjustment audit actor/action/target/outcome count;
- constraint/trigger violation counts and unexpected database errors.

Verify `SUM(available_delta_credits)` and `SUM(reserved_delta_credits)` reconcile to current balances from the known opening state, the latest after-values match the wallet, and lifetime counters equal only their defined movement classes. Usage value, captured payment value, provider cost, and gross contribution remain separate metrics.

## Failure injection

Cover wallet lock/version conflict, ledger unique violation, reservation unique violation, usage conflict, audit failure, outbox failure, process crash before/after commit, provider timeout before/after submission, R2 success followed by database failure, and missing actual cost. Assert the transaction's local effects roll back while any external effect remains explicitly uncertain/reconcilable.

## Launch gate

P0 financial cases must pass on real PostgreSQL with concurrency and on the intended Supabase environment before launch. Exact arithmetic unit tests are necessary but not sufficient. Any unexplained balance, extra/missing ledger or audit row, duplicate grant/deduction, substituted metering identity, or false successful status is release-blocking.
