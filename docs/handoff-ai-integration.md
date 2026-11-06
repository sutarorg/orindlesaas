# Handoff — dynamic AI Gateway integration

Status: **documentation/source gate complete; Phases 1–3 implemented with local evidence; hosted verification absent; production NO-GO**. Date: 2026-11-06. Branch: `arena/f7f2b3be-orindlesaas`.

## What exists today

The repository already has the correct extension points: `lib/server/ai/gateway.ts`, `models.ts`, `catalog-sync.ts`, the catalog CLI, Drizzle providers/models/prices, Chat and generation workers, wallet reservations/settlement/usage evidence, Inngest recovery, versioned catalogue/generation/admin APIs, real admin provider/model/pricing/usage pages, and registry-driven workspace DTOs. Three migrations (`0000`–`0002`) and mocked/unit/disposable-PostgreSQL test conventions exist.

Do not replace these with another Gateway client, registry, pricing engine, wallet, or scheduler. Preserve the premium-white site and unrelated designs.

## Research completed

Official Vercel REST/model/availability/pricing/generation/video documentation and installed `ai@7.0.163` / `@ai-sdk/gateway@4.0.136` declarations were inspected. Public `GET /v1/models` and several exact public model-detail reads succeeded without credentials or paid generation. No sync, migration, hosted provider job, or deployment ran.

Key findings:

1. REST is the required discovery authority. SDK `getAvailableModels()` exposes less metadata and filters unknown model types.
2. Gateway entries include rich modalities/specifications/parameters/eligibility and heterogeneous exact decimal pricing. Current Veo entries use resolution/audio per-second rates; current image entries do not share one safe operation-price formula.
3. Unknown/non-product categories must be stored but never exposed as Chat/Image/Video/Websites.
4. SDK generation cost is a `number`; exact ledger reconciliation needs lossless REST response parsing and strict identity/precision checks.
5. Usage lookup is eventually consistent; “not found” means retry the read later, not repeat generation.
6. Current generation model-ID validation is incompatible with synced `gateway:` internal IDs and must become bounded opaque lookup.
7. Current fixed studio options and incomplete video estimate inputs require centralized model-specific validation and shared quote/submission schemas.

## Documentation created for this stage

`ai-provider-architecture.md`, `ai-model-registry.md`, `ai-model-catalogue.md`, `ai-model-capabilities.md`, `ai-model-pricing.md`, `ai-routing-engine.md`, `ai-metering-and-reconciliation.md`, `ai-admin-management.md`, `ai-catalog-sync.md`, `ai-security.md`, `ai-testing-strategy.md`, `ai-implementation-plan.md`, and `ai-risk-register.md` define the target. Shared architecture/database/API/economics/migration/environment/plan/task/progress/decisions/assets/risk documents were reconciled at this documentation checkpoint.

These are design documents, not implementation or test evidence.

## Source A verified

The user supplied `vercel_ai_gateway_llm_model_ids-1.txt`, and its complete content is preserved at `docs/vercel_ai_gateway_llm_model_ids-1.txt`. An independent parser verified **166 unique nonempty IDs in exactly 28 namespaces**, with every declared provider count matched and no duplicates. SHA-256 is `1fe5f8a45c45a8d7a63cd46cb0aa0bb3ca1f099ff89ab8fe8d5acfbebc8888e8`; see `ai-catalogue-verification.md`.

`ai-model-catalogue.md` links the canonical exact list and retains its explicit partial-source label. No ID was reconstructed from the SDK, memory, or examples. Permanent implementation tests must repeat the structural check and reconcile exact IDs against live/mocked discovery without treating reference-only entries as currently available. The documentation/source gate is complete.

## Planned implementation order

Follow `ai-implementation-plan.md`: additive `0003` schema/exact primitives → REST discovery/lossless lookup and transactional sync → central routing/pricing → existing admin/customer UI/API integration → tests/reports/handoff. Keep external Gateway calls outside DB transactions and preserve the existing no-blind-retry, no-negative-balance, and exact-settlement rules.

Normal tests use mocks. Real PostgreSQL requires the existing disposable gate. Live AI calls require separate authorization, strict spend/call limits, and are disabled by default. A local green suite is not hosted Gateway/Supabase/Inngest or production evidence.

## Implemented in this revision

- `lib/server/db/schema.ts` plus additive `drizzle/0003_milky_dark_beast.sql`: discovery metadata, nullable legacy `kind`, reviewed compatibility/versioning, raw `pricing_data`, sync runs, append-only price observations, 28 disabled providers and 166 disabled `kind=NULL` reference models, plus delete/rewrite protections, RLS, and client-grant removals.
- `lib/server/ai/pricing.ts`: lossless JSON (`parseGatewayJson`), exact BigInt decimals, single-tier selection using the official `cost` field, video resolution/audio rates, upward estimate rounding, and half-up actuals only at the `NUMERIC(24,8)` boundary.
- `lib/server/ai/compatibility.ts` and `lib/contracts/catalog.ts`: one shared compatibility policy schema (client-safe), evidence-based product gating, and option allowlists.
- `lib/server/ai/catalog-sync.ts`: REST discovery, quarantine of invalid rows, immutable observations, atomic apply, manual idempotency, leases with stale recovery, and audit records.
- `lib/server/ai/models.ts`, `generations/service.ts`, `generations/runners.ts`, `chat/service.ts`, `catalog/estimate`: one resolver for enablement, discovery, compatibility, and exact quotes; runners re-validate before submission and send only server-derived options.
- `lib/server/ai/gateway.ts`: authenticated lossless `GET /v1/generation?id=…` actual-cost lookup with response-ID validation and explicit rounding.
- Admin: `set_model_compatibility`, raw `pricing_data` price versions, `run_catalog_sync`, expected-version/state checks, compatibility editor and sync-run history panels.
- Customer: Image/Video/Website studios now render only server-published options and send exactly those options.
- Jobs: daily incremental `17 3 * * *` sync function alongside the existing CLI adapter.

## Current verification and release state

- Documentation/repository/SDK research: performed as described above.
- Source A acceptance: **Passed** — 166 unique IDs/28 namespaces; see `ai-catalogue-verification.md`.
- Local gates: **Passed** — typecheck, ESLint, 140 unit tests in 28 files, `next build`, and 10 disposable-PostgreSQL integration tests with `0000`–`0003` applied. Details and limits are in `ai-testing-strategy.md`.
- Not run: browser/E2E and 320px visual checks.
- Hosted catalogue sync, authenticated availability, paid models, scheduled Inngest runs, Supabase/RLS production database, R2, and Dodo: **not verified**.
- Migration `0003` was applied only to a throwaway local cluster, never to a hosted database.
- Commercial/production release: **NO-GO** until all technical, financial, security, recovery, and owner gates pass.
