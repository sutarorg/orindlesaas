# Data model

## Prompt 1 local content types

No production database exists in this stage. Typed local data is the only content model.

- `Product`: `id`, `slug`, `name`, `shortName`, `route`, eyebrow/tagline/descriptions, accent, benefits, workflow, capabilities, use cases and related article.
- `CreditPack`: `id` (`creator|pro|studio`), name, integer `priceUsd` (`19|49|99`), integer `credits` (`1900|4900|9900`), fit/description and featured state. Pack credits equal public pack dollars x100.
- `Article`: slug, title, `seoTitle`, description, excerpt, category, publication/update dates, structured sections, related slugs and a product link. Author display is “Orindle Editorial”; word count and reading time are derived by helpers rather than duplicated as mutable fields.
- `ArticleSection`: `id`, title and discriminated `ArticleBlock` values for paragraphs, H3 headings, ordered/unordered lists, examples, callouts, tables and workflows. Rich text distinguishes internal/external links.
- `ModelFamily`: display name, provider, summary, useful-for tasks and `status: "Planned for launch"`. Prompt 1 has no `verified` or connected availability state.

## Future production entities (contract only)

`users` (Supabase-owned identity), `profiles`, `projects`, `assets`, `conversations`, `generations`, `website_projects`, `wallets`, `credit_ledger_entries`, `credit_purchases`, `usage_events`, `model_prices` and `background_jobs`.

A wallet balance must be derived or reconciled from an append-only ledger, not a browser-mutable number. A purchase connects a provider event/payment ID to exactly one idempotent credit grant. A usage event references server-calculated model price version, metered quantity, credits deducted and request ID. Actual provider cost stays in restricted server records and is never serialized to public/client DTOs.

## Ownership and retention

Every project, asset and usage record has an owning user/workspace and authorization checks. Soft deletion and retention are decisions for later stages. Media metadata stores R2 object keys, not public secrets. Website deployment identifiers are server-managed.

## Frontend DTO boundary

Display-safe DTOs may include pack name, public credit amount, operation display cost estimate and status. They must not include provider credentials, internal cost, webhook payloads or unrestricted storage/deployment identifiers. Runtime validation is required at network boundaries in Prompt 5 even when TypeScript types exist.

`ContactRequest` and `ContactPreviewResult` in `lib/contracts/public-services.ts` describe the current local preview. `CheckoutService` returns only an unavailable preview type and has no live implementation. Neither contract stores data or proves a transaction.
