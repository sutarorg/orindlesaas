# AI model catalogue

Status: **Source A preserved and structurally verified; Source B research verified on 2026-11-06; no application sync has run**. The complete supplied reference is in `vercel_ai_gateway_llm_model_ids-1.txt`; it remains explicitly partial.

## Source A — supplied partial language-model reference (verified)

The user supplied `vercel_ai_gateway_llm_model_ids-1.txt`, and its complete content is preserved at `docs/vercel_ai_gateway_llm_model_ids-1.txt`. Independent parsing verified **166 nonempty unique IDs in exactly 28 namespaces**, with every per-provider declared count matched and no section/namespace mismatch.

- SHA-256: `1fe5f8a45c45a8d7a63cd46cb0aa0bb3ca1f099ff89ab8fe8d5acfbebc8888e8`
- Size: 5,959 bytes
- Verification report: `ai-catalogue-verification.md`
- Source completeness: **verified partial export**, not a guaranteed exhaustive dump

The file itself is the canonical human-readable list of all 166 exact IDs; they are not duplicated into this Markdown document where divergence could occur. Implementation tests must read the preserved file, repeat the structural checks, and reconcile each exact ID against discovery as reference-only, currently returned, or both. Reference-only rows remain historical/disabled unless separately validated.

## Source B — authoritative runtime discovery

`GET https://ai-gateway.vercel.sh/v1/models` is the public authoritative discovery endpoint. Authenticated requests may include team private/virtual models; `GET /v1/models?include_availability` adds team eligibility annotations and request-context status. These are point-in-time observations, not permanent claims.

The public endpoint was read successfully during research without an API key or paid generation. The complete response was not imported into this document, and no database write occurred. Live discovery at sync time—not this research note—is the runtime source.

### Observed exact entries (research samples only)

These entries demonstrate actual schema heterogeneity; they are **not substitutes for Source A or a static production allowlist**.

| Exact Gateway ID | Observed `type` | Observed pricing/capability evidence |
|---|---|---|
| `alibaba/qwen-3-14b` | `language` | Text modalities, v2/v3/v4 specifications, decimal input/output token strings, reasoning toggle |
| `google/gemini-3-pro-image` | `language` | Text+image input, text+image output, service-tier token pricing; not automatically Image Studio compatible |
| `openai/gpt-image-2` | `image` | Text→image, decimal input/output/cache token rates; no per-image estimate rate observed |
| `bfl/flux-2-pro` | `image` | Text→image, input/output token strings of `0`; no per-operation estimate rule inferred |
| `google/veo-3.1-fast-generate-001` | `video` | Resolution/audio-specific `video_duration_pricing` with decimal `cost_per_second` strings |
| `google/veo-3.1-generate-001` | `video` | Different per-second rates from the fast variant; model-specific price preservation is required |

### Runtime fields to preserve

The validator must accept known and unknown fields while requiring only safe identity fundamentals. Observed/documented fields include `id`, `owned_by`, `name`, `description`, `created`, `released`, `type`, `tags`, `supported_specifications`, `modalities.input/output`, `supported_parameters`, `reasoning_options`, `context_window`, `max_tokens`, `knowledge`, `zdr`, `no_training`, `regions`, `pricing`, and optional `model_eligibility`. Missing fields remain null/absent; they are never converted into support claims.

The official SDK 4.0.136 declaration lists known types `embedding`, `decision`, `evaluation`, `image`, `language`, `realtime`, `reranking`, `speech`, `transcription`, and `video`, but its metadata transform filters out unknown types. Orindle therefore uses the REST response in the existing Gateway/catalog-sync boundary so unknown categories remain visible and safely unroutable.

## Catalogue completeness language

A sync report may say “all entries returned by this Gateway response were processed.” It must not say “all models that exist,” “all providers support Orindle,” or “166 is complete.” Source A and Source B are reconciled by exact ID: reference-only, currently returned, or both. Reference-only rows remain historical/disabled unless separately validated; live-only rows are discovered disabled.

## Customer catalogue

The customer selector is a bounded projection of the registry, not either raw source. It includes only models that pass centralized product, enablement, presence, compatibility, parameter, and current-price checks. Exact Gateway IDs may be displayed for clarity, but internal upstream prices, raw admin notes, sync errors, and unsupported categories are not exposed.
