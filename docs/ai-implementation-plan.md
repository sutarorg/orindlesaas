# AI integration implementation plan

Status: **Phase 0 documentation/source gate completed on 2026-11-06; implementation may begin and is not yet claimed**. Checkboxes use `[x]` evidenced complete, `[~]` in progress/blocked, and `[ ]` not started.

## Phase 0 — mandatory documentation and source gate

- [x] Inspect the existing Gateway/catalog sync, registry, generation/chat runners, credits, schema/migrations, admin/customer APIs, selectors, jobs, and tests.
- [x] Research current official Gateway REST discovery/availability/pricing/generation lookup and installed AI SDK declarations.
- [x] Identify the SDK unknown-type filtering, heterogeneous pricing, exact-cost float risk, and current model-ID validation mismatch.
- [x] Complete all required architecture/registry/catalogue/capability/pricing/routing/metering/admin/sync/security/testing/plan/risk/handoff documents and update shared docs.
- [x] Obtain `vercel_ai_gateway_llm_model_ids-1.txt`, copy it verbatim into `docs/`, and prove 166 unique IDs/28 namespaces with SHA-256 and exact structural checks; see `ai-catalogue-verification.md`.

**Exit gate:** every documentation check and Source A verification passes. Do not edit application code before this gate.

## Phase 1 — additive schema and exact primitives

- [x] Extend `lib/server/db/schema.ts` with additive discovery metadata, nullable unsupported-product route, compatibility, sync runs, and read-only price observations.
- [x] Generate/review migration `0003` plus snapshots; add RLS/grants, enabled-route invariants, history protection, indexes, and migration notes. Preserve all existing rows.
- [x] Add validated REST catalogue schemas, canonical JSON hashing, exact decimal/BigInt quote primitives, and reviewed lossless generation-response parsing inside existing boundaries.
- [~] Unit-test malformed/unknown entries, every pricing shape, unsafe precision, identity matching, and Source A counts. Covered: normalization/quarantine, tier/ video/ audio pricing, rounding boundaries, legacy nano projection, compatibility policy, and option allowlists. Not covered: a recorded live response fixture and BYOK identity matching.

Exit: migration/static checks and exact primitive tests pass; no live migration claim. **Met locally**: `0003` applies on an empty PostgreSQL 16 cluster and its protections reject deletes, in-place price rewrites, and observation mutation.

## Phase 2 — one registry, sync, and routing resolver

- [x] Extend `gateway.ts` for bounded REST discovery/lossless lookup while retaining the existing inference Gateway.
- [x] Extend `catalog-sync.ts` with run lifecycle, full/hash-incremental modes, atomic upserts, missing history, observations, admin override preservation, leases, and audit.
- [x] Add the scheduled function to the existing Inngest job list and retain the existing CLI as an operator adapter.
- [x] Centralize product compatibility, parameter validation, current-price checks, quote creation, and eligible catalogue reads in `models.ts`.
- [x] Route Chat/generation/estimate services through the resolver without changing wallet or submission state-machine ownership.
- [x] Re-validate the frozen request through the same resolver immediately before each provider submission and send only server-derived options.

Exit: unit/mocked integration and disposable PostgreSQL sync/race/rollback/RLS tests pass or hosted/database items are explicitly Blocked. **Met locally** for single-flight conflict, partial quarantine, incremental idempotency, missing transitions, non-enablement, and audit runs; hosted behaviour is still Blocked.

## Phase 3 — admin and customer integration

- [x] Extend existing admin models/providers/pricing/usage queries and actions with bounded filters, compatibility revisions, sync runs, and exact price displays.
- [x] Extend the existing admin action union/route for compatibility and sync; preserve permission, step-up, idempotency, expected-state, and audit behavior.
- [x] Serve the dynamic registry DTO with per-product option allowlists to Image Studio, Video Studio, Websites, and Chat.
- [x] Render only model-specific allowed options; align estimate and submission payloads; preserve premium-white design and unrelated pages.
- [x] Keep customer responses free of upstream cost/raw metadata and preserve owner-safe history.
- [~] The standalone `model-selector.tsx` component and its tests were not reworked; the studios consume the registry directly.

Exit: component/API/browser tests, redaction tests, keyboard/320px checks, and existing regressions pass. **Partially met**: unit/component regressions and the production build pass, but browser/E2E and 320px visual checks were not run in this session.

## Phase 4 — reconciliation, verification, and handoff

- [x] Integrate lossless actual-cost lookup, model/generation identity checks, BYOK review, and bounded eventual-consistency recovery without blind paid retries.
- [~] Run full strict/static/unit/mocked integration/disposable database/E2E/build checks; record exact counts and failures. Typecheck, lint, 140 unit tests, build, and 10 disposable-PostgreSQL tests pass; E2E and browser checks are not run.
- [~] Produce changed-file and migration reports plus catalogue, customer, admin, pricing, security, and test reports. Remaining: final changed-file/migration report and browser evidence.
- [x] Update environment/deployment/sync instructions, tasks/progress/decisions/assets/risks, and `handoff-ai-integration.md` with evidence-backed status.
- [ ] Only with separate authorization, run tightly spend-limited hosted smoke/recovery verification. Otherwise record Blocked and retain NO-GO.

## Explicit non-goals

No parallel Gateway client/registry/pricing/wallet/scheduler; no automatic enablement; no deleted history; no invented metadata/prices; no embeddings/reranking/audio customer products without a separate execution design; no arbitrary provider options/fallbacks; no production deployment or unbounded live AI tests.

## Release evidence boundary

A green local suite proves only local behavior. Production requires applied hosted migrations, Supabase/auth/admin/RLS evidence, real Gateway discovery and generation-cost reconciliation, scheduled sync/Inngest verification, failure recovery, security/finance review, and explicit owner approval.
