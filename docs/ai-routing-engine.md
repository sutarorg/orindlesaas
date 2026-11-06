# AI routing engine

Status: **centralization design; current code still has product checks distributed across `models.ts`, generation schemas, and studio components**. No routing implementation is claimed yet.

## One server resolver

Extend `lib/server/ai/models.ts` with a single server-only resolution path used by workspace/catalogue reads, estimates, Chat, and all generation creation. It returns either a safe rejection or an immutable execution plan containing the internal model ID, exact Gateway ID, product, validated options, price-version ID, and exact estimate.

The resolver evaluates, in order:

1. well-formed opaque internal model ID and supported product;
2. existing model/provider rows and current `present` discovery state;
3. provider and model admin enablement;
4. explicit product compatibility and current Gateway specification support;
5. request prompt/history, modalities, operation parameters, and model limits;
6. current immutable price version and exact quote formula;
7. server operation caps and an executable plan for the existing worker.

No UI-only filter, legacy `kind` check, or browser field can bypass any step.

## Product plans

- **Chat:** database-owned history, bounded message count/bytes, text-only current input, validated output cap, and language-model execution.
- **Image:** text prompt plus only reviewed size/aspect/seed options; omitted unsupported options stay absent from the SDK call.
- **Video:** reviewed duration/aspect/resolution/audio and exact matching duration rate; asynchronous start/status remains the only execution path.
- **Website:** language model with structured-output evidence, 5,000-token server cap, fixed system instruction, and existing source-validation/build boundary.

The current model ID regex must be replaced by bounded opaque-ID lookup. Synced internal IDs contain a `gateway:` prefix and must not be rejected by a lowercase provider/model regex or rewritten before lookup.

## Optional automatic selection

If `auto` is offered, the server chooses only from the same eligible product set using a documented deterministic admin policy (for example, explicit priority, then exact estimated credits, then stable internal ID). It must not send Gateway fallback lists or switch models after submission. A user-selected exact model is never silently replaced. If no eligible model exists, return an unavailable state.

## Price and parameter coherence

The execution plan carries the exact price-version ID and normalized options into request hashing and job persistence. The estimate endpoint and actual submission use the same validation function, so video duration/resolution/audio cannot be omitted from its quote. A model change resets browser options to server-provided defaults/allowed values, but the server still revalidates everything.

Estimated input tokens are a conservative documented approximation for reservations only; model-declared context limits are enforced against the bounded estimate. Actual token usage and cost come from Gateway afterward.

## Failure behavior

Validation, compatibility, and price failures happen before a hold/provider call where possible. After the atomic submission claim, no routing change, fallback, or automatic second model call is allowed. A lost response, missing generation ID, uncertain cost, or postprocessing error follows the existing reconciliation path.

## Customer and admin views

Customer catalogue reads are the same resolver with list semantics and a bounded result. Admin views may show why a row is ineligible—disabled, missing, unsupported type, unreviewed compatibility, invalid parameters, or unquotable—without exposing raw secrets or implying live health. Sync and admin edits invalidate request-time cached data naturally; no long-lived client registry cache is authoritative.
