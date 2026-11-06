# AI integration testing strategy

Status: **test contract plus recorded local results as of 2026-11-06**. Existing Prompt 5/6 evidence remains historical and does not validate this design.

## Recorded local evidence for this revision

Commands below were executed in this workspace; they are local evidence only and do not imply hosted, paid-provider, or production results.

| Command | Result | What it proves |
| --- | --- | --- |
| `npm run typecheck` | pass | Strict TypeScript over app, lib, components, and tests. |
| `npm run lint` | pass | ESLint, including the React hooks rules that shaped the studio option state. |
| `npm run test:unit` | 140 tests / 28 files pass | Catalogue normalization, exact pricing, compatibility policy, runner boundaries, and all pre-existing suites. |
| `npm run build` | pass | Next.js production build with the new admin and studio code. |
| `npm run test:integration` | 10 tests pass on disposable PostgreSQL 16 | `0000`–`0003` apply, RLS/grants hold, and discovery/sync behaviour works against real SQL. |
| `git diff --check` | pass | No whitespace errors in the change set. |

New unit files: `tests/unit/server-pricing-exact.test.ts` and `tests/unit/server-compatibility.test.ts`; `tests/unit/server-catalog-sync.test.ts` was rewritten and `tests/unit/server-generation-runner.test.ts` extended.

Integration notes: the disposable cluster was a local PostgreSQL 16 build without `pgcrypto`, so the QA server used a local-only `digest(text,text)`/`gen_random_bytes` shim purely to satisfy migration `0002`'s `digest(...,'sha256')` backfill. That shim is not part of the repository and must never be used in production; Supabase provides real `pgcrypto`.

## Source and schema verification

After Source A is supplied, a deterministic test/script must verify the verbatim `docs/vercel_ai_gateway_llm_model_ids-1.txt` copy, SHA-256, 166 unique IDs, exactly 28 namespaces, and no normalization changes. It must compare every reference ID to discovery results by exact string and report reference-only/live-only/both without treating reference-only as currently available.

Run `git diff --check`, `npx drizzle-kit check`, strict typecheck, ESLint, unit tests, production build, and the existing regression suites after implementation. These are necessary but not hosted evidence.

## Unit tests

Extend the existing suites and add focused coverage for:

- REST envelope/entry normalization, exact IDs/namespaces, all known types, unknown future types, missing fields, malformed rows, conflicting duplicates, and bounded payloads;
- preservation of provider/model enablement, compatibility, historical rows, and manual prices during upsert mapping;
- exact decimal parsing/canonical hashing, base/tier/cache/region/service/per-image/video-duration shapes, zero values, extreme precision, overflow, invalid tiers, and no float arithmetic;
- centralized Chat/Image/Video/Website compatibility, modality/specification checks, unsupported categories, parameter allowlists, context/max-token limits, opaque internal IDs, current price/presence/provider/model enablement;
- quote/submission coherence, including video resolution/audio/duration and unsupported option omission;
- lossless generation lookup, same-ID/model evidence, excess precision, negative/non-finite costs, BYOK review, eventual “not found,” and exact existing credit settlement;
- admin action validation, expected revisions, idempotency, permissions, audit rollback, and no external call inside a transaction;
- dynamic customer DTO redaction and option-driven studio rendering.

Mocks must be deterministic and injected in tests only. No fake provider can be selected by a browser parameter or silently in production.

## Integration and race tests

Use mocked Gateway HTTP/SDK boundaries for normal integration tests. Assert persisted rows and external-call counts for full/incremental sync, partial invalid entries, no changed-price duplicates, missing/reappearing rows, manual override preservation, unknown category retention, estimate/generation acceptance/rejection, and safe API envelopes.

On a disposable real PostgreSQL database, apply the complete migration chain and test:

- two concurrent sync runs and stale lease recovery;
- sync versus admin compatibility/enablement/price changes;
- one open quote interval and immutable observations/price history;
- rollback after a mid-transaction failure;
- historical model/provider deletion protection and existing generation/conversation FKs;
- concurrent holds/settlement with heterogeneous estimates;
- RLS/grants for new sync/observation tables and cross-user/customer catalogue access.

The existing integration harness is explicitly gated by `QA_DATABASE_DISPOSABLE=1` and a local `orindle_qa` URL. Lack of that database is **Blocked**, not a pass. It now also covers: the 166/28 reference seed as disabled, kind-less, unpriced history; non-deletable catalogue history; append-only observations; single-flight lease conflict; partial quarantine of invalid entries; incremental idempotency with no price churn; `present` to `missing` transitions without deletion or enablement; and audit run records.

## Browser/E2E tests

Using mocked registry/API data, cover each product with zero/one/many models, long exact IDs, model changes resetting options, hidden unsupported controls, server validation errors, pricing-unavailable states, keyboard operation, 320px reflow, and no upstream-cost fields. Cover admin filters, compatibility editing, enablement rejection, price versions, sync progress/history, and usage filters without exposing unauthorized fields.

**Not run in this session:** browser/E2E and 320px visual checks. They remain open evidence, so the customer/admin UI is locally build- and component-verified only.

Preserve all public/auth/customer/admin regression suites and actual unknown-route status behavior. Build success alone is not an E2E result.

## Live tests — separately authorized and disabled by default

No live paid call is authorized by this task or this document. Any future live smoke needs a named authorizer, disposable/test team, `QA_ENABLE_AI_SMOKE=1`, exact environment label, one approved model/prompt, SDK retries disabled, one process-level call permit, and explicit maximum USD/credit envelopes. Start with at most 64 output tokens for one text generation.

Image, video, website, scheduled authenticated sync, and BYOK each require separate approval and per-kind call/spend limits. Record only safe IDs, actual cost/credits, timing, and outcome—never keys, prompts, raw responses, signed URLs, or generated source. Hosted Gateway/Supabase/Inngest/R2 verification remains a release gate even if every local test passes.

## Required evidence reports

Implementation must finish with actual changed-file/migration reports and catalogue, customer, admin, pricing, security, and test reports. Each assertion links to a command/test and distinguishes mocked, real PostgreSQL, hosted, and unexecuted evidence. Production remains **NO-GO** until live infrastructure, recovery, security, finance, and owner release gates genuinely pass.
