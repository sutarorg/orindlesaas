# AI integration risk register

Status: **active design/implementation risks as of 2026-11-06**. P0 blocks paid use/release; P1 blocks stage acceptance; P2 requires tracked remediation.

| Priority | Risk | Current evidence/control | Required disposition |
|---|---|---|---|
| P1 — closed | Source A could be fabricated or incomplete | User supplied the file; verbatim copy and independent parser verified 166 unique IDs/28 namespaces and every provider count; SHA-256 recorded | Closed at documentation gate by `ai-catalogue-verification.md`; permanent implementation tests must repeat the check |
| P0 | SDK discovery drops unknown future model types | Installed SDK transform filters types outside its known list | Extend existing Gateway boundary with validated REST discovery; store unknowns disabled/unroutable |
| P0 | Binary-float cost conversion corrupts financial evidence | Existing SDK lookup returns `number` and current helper uses `toFixed(8)` | Losslessly parse authenticated REST generation response; reject unsafe precision; test exact ledger settlement |
| P0 | Heterogeneous pricing is flattened or invented | Live video uses resolution/audio per-second rates; image entries vary and some lack an operation formula | Preserve raw decimal JSON; supported exact formulas only; block unquotable operations |
| P0 | Unknown/disabled/incompatible model reaches a paid call | Current checks are distributed and discovery skips unsupported categories | Central server resolver for presence/provider/model/product/options/price; test every bypass |
| P0 | Uncertain paid submission is blindly retried or rerouted | Existing submission guards and `maxRetries: 0` are the baseline | Preserve atomic claim; no fallback/retry after attempt; reconcile stored generation evidence |
| P0 | Actual lookup “not found” is treated as zero or generation is repeated | Official docs state usage ingestion is asynchronous | Bounded read-only recovery; retain hold/reconciliation until exact evidence exists |
| P0 | BYOK zero `total_cost` is treated as free | Official docs distinguish BYOK upstream cost | Block/review BYOK until finance defines the billable actual-cost rule |
| P1 | Sync overwrites admin policy or deletes missing history | Current upsert preserves enabled but has limited metadata/history | Separate discovery/admin fields; mark missing; additive constraints and race tests |
| P1 | Concurrent sync/admin price writers overlap or close overrides | Existing row lock/single-open index help; manual override behavior needs extension | Common locking, expected current IDs, observation history, real PostgreSQL race tests |
| P1 | Partial Gateway data corrupts a valid snapshot | External metadata can be malformed or duplicated | Envelope/entry validation, conflicting-duplicate abort, accepted-ID missing calculation, transactional rollback |
| P1 | Current model-ID schema rejects synced `gateway:` IDs or future exact IDs | Generation schema regex does not admit the internal prefix and assumes one lowercase slash pair | Bounded opaque IDs with exact server lookup; no renaming/normalization |
| P1 | Fixed studio options send unsupported parameters | Current UI offers static sizes/ratios/durations/audio for every model | Server-reviewed option policies; dynamic controls; omit unsupported fields; server revalidation |
| P1 | Estimate omits billable video dimensions | Current estimate endpoint does not receive full video options | Shared quote/submission schema and exact duration/resolution/audio pricing tests |
| P1 | Sensitive raw metadata/cost/sync data leaks | Customer/admin DTOs have different permissions | Allowlisted projections, RLS/grants, cache separation, redaction and bundle scans |
| P1 | Scheduled sync overlaps or creates a second scheduler | Existing Inngest jobs are the durable boundary | One function/service, advisory lock/lease, idempotent run history, deployment sync instructions |
| P1 | Additive migration breaks historical rows/RLS | Three migrations exist; nullable unsupported routing and new tables need review | Expand-only `0003`, snapshots, disposable apply, two-user grants/RLS and FK/history tests |
| P1 | Local mocks are reported as hosted/production proof | No hosted credentials or live verification established | Separate evidence labels; authorized spend-limited live gates; retain NO-GO |
| P2 | Gateway metadata changes make old compatibility stale | Sync retains reviewed policy by design | Material-change review status/fail-closed resolver and admin audit visibility |
| P2 | Large raw snapshots create storage/log/API bloat | Catalogue is dynamic and metadata-rich | Byte/depth/count limits, changed-row observations only, bounded admin queries, no raw response logging |
| P2 | Model creator is mistaken for actual hosting provider | Gateway can route across providers | Use namespace for catalogue ownership; record actual provider separately as metering evidence |

## Release priority

Any paid-call routing, duplicate submission, exact-cost, overdraft, secret, authorization, or historical-data failure is P0. Missing Source A blocks implementation acceptance even if unrelated local checks pass. A risk is closed only by a linked code/config control and observed appropriate test evidence; documentation alone does not close it.
