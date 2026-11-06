# AI provider architecture

Status: **documentation design gate completed, 2026-11-06; implementation not yet claimed**. The existing Prompt 5 implementation is the baseline. Source A is preserved at `docs/vercel_ai_gateway_llm_model_ids-1.txt` and independently verified as 166 unique IDs in 28 namespaces; see `ai-catalogue-verification.md`. The dynamic ecosystem described here is **not implemented yet**.

## Non-negotiable extension boundaries

Orindle remains one Next.js modular monolith. Extend these existing modules rather than introducing substitutes:

| Responsibility | Existing boundary to extend |
|---|---|
| Gateway SDK, discovery reads, generation lookup | `lib/server/ai/gateway.ts` |
| Registry reads, product resolution, quotes | `lib/server/ai/models.ts` |
| Discovery normalization and synchronization | `lib/server/ai/catalog-sync.ts`, `scripts/catalog-sync.ts` |
| Generation validation and idempotency | `lib/server/generations/` |
| Chat/media/website execution | `lib/server/chat/service.ts`, `lib/server/generations/runners.ts` |
| Holds, settlement, usage evidence | `lib/server/credits/` and existing tables |
| Durable scheduling/recovery | `lib/server/jobs/functions.ts`, transactional outbox |
| Admin reads/mutations/audit | `lib/server/admin/`, `app/api/v1/admin/actions` |
| Customer selection and estimates | Existing workspace snapshot, `/api/v1/catalog/*`, Chat and Generation Studio |

No second Gateway inference client, wallet, pricing engine, model selector data source, or scheduler is permitted. REST discovery and lossless generation lookup are extensions of `gateway.ts`; AI SDK inference remains on the existing `createGateway` instance.

## Authority order

1. **Reference Source A:** the supplied 166 language-model IDs in 28 namespaces. It is a partial historical seed/reference, not availability or pricing evidence. Every ID must be preserved exactly after the file is supplied.
2. **Runtime Source B:** `GET https://ai-gateway.vercel.sh/v1/models`, optionally authenticated with `include_availability` for team annotations. It discovers all returned categories, including unknown future types.
3. **Validated administrator policy:** enablement and Orindle-specific parameter constraints. Sync never enables a row or overwrites this policy.
4. **Execution evidence:** the stored Gateway generation ID and an authenticated generation lookup determine actual cost. Catalogue estimates never become actual charges.

A public catalogue row does not prove team eligibility, provider health, product compatibility, or a safe quote. `eligible` plus available request context is useful admission metadata; `unknown` is never treated as approval.

## Request flow

1. A versioned API validates body size, identity, same-origin policy, rate limit, and an opaque internal model ID.
2. The centralized registry resolver locks in a current server-side decision: model present in discovery, provider/model enabled, exact product compatibility, parameter allowlists, operation caps, and current estimable price version.
3. The service computes an exact-decimal estimate and canonical request hash. The existing job/wallet transaction creates the hold, job, and outbox record. No external call occurs in that transaction.
4. The existing worker atomically claims first submission and calls the AI SDK with the exact `gateway_model_id`, SDK retries disabled, and only validated options.
5. Provider references and generated assets follow the existing checkpoint rules. An attempted/uncertain submission is never blindly repeated.
6. Settlement performs authenticated generation lookup, parses cost losslessly, records actual usage evidence, and applies the existing credit ledger rules.

## Discovery and routing separation

Discovery records what Gateway returns. Product routing is a separate, deny-by-default decision:

- `language` can be considered for Chat and, with structured-output/metadata and token-limit checks, Websites.
- `image` can be considered for Image Studio only through the existing image-model worker.
- `video` can be considered for Video Studio only through the existing asynchronous video worker.
- `embedding`, `reranking`, `speech`, `transcription`, `realtime`, `decision`, `evaluation`, and unknown types remain registry records with no Orindle product route.
- A language model whose output modalities include images is **not** automatically an Image Studio model; the current worker and price rule must explicitly support that execution path.

## Sync architecture

A run has `queued/running/succeeded/partial/failed` state, trigger (`manual`, `scheduled`, or `incremental`), actor/request correlation, snapshot hash, timestamps, lease, and safe counts/error codes. Discovery happens outside the database transaction. A global database advisory lock plus run-row lease prevents overlapping writers; one transaction applies the complete normalized changeset and audit record.

“Incremental” means hash-based changed-row upserts from a complete authoritative response. Gateway documents no delta feed, so Orindle must not invent one. Invalid entries are reported without corrupting valid historical rows; ambiguous duplicate IDs or an invalid envelope abort the run. Missing rows are marked `missing`, not deleted, and are ineligible for routing until seen again.

## Security and privacy

Only server modules see Gateway credentials, raw metadata, internal prices, actual cost, and sync diagnostics. Customer DTOs contain display-safe identity, modalities, validated parameter choices, and credit estimates—not upstream cost or raw metadata. Admin reads remain permission-filtered; mutations require the existing action permission, recent AAL2/TOTP, substantive reason, idempotency, expected state, and append-only audit.

## Implementation status gate

Source A is copied verbatim and its 166 unique IDs/28 namespaces are verified, so the documentation/source gate is complete. Before release: run additive migrations and all concurrency/RLS/recovery tests on disposable PostgreSQL, complete mocked/browser suites, and obtain separately authorized, tightly spend-limited hosted evidence. Local success never implies production readiness.
