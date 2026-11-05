# Financial accuracy and reconciliation report

Status: **unit and disposable real-PostgreSQL financial controls passed; financial launch sign-off is NOT MET**. Dodo test-mode, hosted Supabase/Gateway, finance-owner reconciliation, restore and incident evidence remains unavailable. Scope and vectors: `credit-engine-test-plan.md` and `payment-test-plan.md`.

## Verified contract

- One-time Creator/Pro/Studio packs: **$19/1,900, $49/4,900, $99/9,900 credits**; no subscription or checkout-return fulfillment.
- One authoritative wallet and append-only ledger shared by exactly four products; integer credits/USD cents and exact eight-place decimal provider cost.
- Final credits are `ceil(actual Gateway USD × 200)`; estimates never replace actual metering.
- Hold, release, settlement and reconciliation are distinct. Over-cost reservations remain held for review/recovery rather than creating an overdraft or false success.
- Verified Dodo success is the only automated purchase fulfillment path. Captured payment value, customer usage value, provider cost, tax and unreconciled amounts remain separate.
- Admin adjustment replay is scoped to actor and operation, detects changed target/body, and writes movement plus audit atomically.

## Fresh observed evidence

| Layer | Executed assertions | Result |
|---|---|---|
| Unit arithmetic/state | Exact rounding, customer-value/provider-cost separation, identical settlement recovery, changed exact-cost conflict even at equal rounded credits, overdraft rejection, admin cross-target conflict and original-response recovery | PASS within the 25-file/124-test suite |
| Migration/seed | Applied the migration chain to disposable PostgreSQL 16 and verified exact idempotent pack seed | PASS in CI PostgreSQL job |
| RLS/grants | Final grants and RLS checked independently of owner policies, including default-privilege behavior | PASS in disposable PostgreSQL; not hosted Supabase evidence |
| Parallel wallet work | Concurrent holds/settlements serialized with row locks/constraints; no overdraft or duplicate effect | PASS |
| Over-cost recovery | Reservation retained for reconciliation and settled only after funded recovery | PASS |
| Webhook race | One verified succeeded purchase fulfilled exactly once under concurrent delivery | PASS with synthetic verified event in disposable database |
| Admin replay/race | Actor/operation scoping across targets and concurrent requests; one effect/audit per accepted operation | PASS after QA-003 correction |
| Catalog price history | One open interval and append-only rate history enforced | PASS |
| Browser/payment handoff | Pack selection does not claim payment/credit success; anonymous/cross-origin charged mutations deny before provider effects | PASS for fail-closed scope |

The PostgreSQL job passed independently in CI runs `42067360809`, `42069035875` and final application run `42074366023`; see `handoff-final.md` for the run index.

## Still missing

- Dodo **test_mode** product mapping, raw-signature delivery, tax/replay/exactly-once/receipt and provider-dashboard reconciliation using safe test records.
- Actual Gateway generation identity, `totalCost`, unavailable-cost recovery and provider-invoice reconciliation.
- Credentialed Supabase role/Data API behavior, every admin permission, and finance/support operational procedures.
- Backup restoration, financial incident/rollback drill, and reconciliation of genuine uncertain external side effects.

No live charge was performed and no real customer balance changed. Only synthetic/unit records and disposable CI PostgreSQL rows were used. Mocked arithmetic and a clean local database do not prove payment-provider or production financial correctness.

## Release rule and decision

Any negative/lost balance, duplicate/missing grant/deduction, same-key different-operation acceptance, mismatched payment state change, false generation/payment success, missing audit, or untracked reconciliation is **P0** and blocks launch.

**Observed unit/disposable-PostgreSQL financial regression gate: PASS. Financial launch gate: NOT MET.** The blocked provider, restore, operational and owner-approval evidence cannot be waived by this report.
