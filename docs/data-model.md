# Data model

## Prompt 1 local content types

No production database exists in this stage. Typed local data is the only content model.

- `Product`: `id`, `slug`, `name`, `shortName`, `route`, eyebrow/tagline/descriptions, accent, benefits, workflow, capabilities, use cases and related article.
- `CreditPack`: `id` (`creator|pro|studio`), name, integer `priceUsd` (`19|49|99`), integer `credits` (`1900|4900|9900`), fit/description and featured state. Pack credits equal public pack dollars x100.
- `Article`: slug, title, `seoTitle`, description, excerpt, category, publication/update dates, structured sections, related slugs and a product link. Author display is “Orindle Editorial”; word count and reading time are derived by helpers rather than duplicated as mutable fields.
- `ArticleSection`: `id`, title and discriminated `ArticleBlock` values for paragraphs, H3 headings, ordered/unordered lists, examples, callouts, tables and workflows. Rich text distinguishes internal/external links.
- `ModelFamily`: display name, provider, summary, useful-for tasks and `status: "Planned for launch"`. Prompt 1 has no `verified` or connected availability state.

## Prompt 2 authentication DTOs (frontend only)

Authentication form state is ephemeral React state; it is not a database model. Typed requests cover signup (name/email/password/confirmation/terms), login (email/password/remember-me), reset/resend (email), password update (new password/confirmation), OAuth provider/intent and future callback/access inputs. Password length is evaluated as 15–128 Unicode code points; passwords are never trimmed, logged or persisted.

`AuthenticationResult` distinguishes future success/safe error from current preview. `SessionSnapshot` may later contain only a display-safe user ID/email/name, verification status and expiry; never access/refresh tokens. The mock snapshot is unavailable and has no user. `RouteAccessResult` is similarly unavailable and cannot authorize rendering. No profile, account, session or verification record is created locally.

## Prompt 3 dashboard fixtures and DTOs (frontend only)

`WorkspaceFixture` is explicitly `kind: "fixture"` and contains a demo profile, fixture wallet, notifications, projects, conversations/messages, assets, generations/jobs, websites and ledger entries. It is not a session or database snapshot. Dates are stable fixture values; no live relative-time or online presence is inferred.

- `ModelRegistryEntry`: documented `id`, display name, provider, product, capabilities, input/output modalities, optional context display, pricing display, `availability: "catalog-fixture"` and feature tags. Auto is a separate UI routing option, not a model ID.
- `Conversation`: ID/title/project/model/messages/update time. `DashboardMessage` contains typed text/code/list/heading parts and role/status; it never contains executable HTML.
- `Generation`: ID, product, model/provider display, illustrative credit value, status, created time and optional project/asset references. Video jobs use queued/processing/completed/failed and static optional progress.
- `Project` / `LibraryAsset`: cross-product ownership-shaped display fields, type/status/update metadata and safe preview path/alt where applicable. Fixture ownership does not prove authorization.
- `WebsiteProject`: ID/name/status/domain-preview state, pages/sections, local preview content and editable fixture code. Published/deployed URLs remain unassigned unless a real server later supplies them.
- `WalletFixture` / `LedgerEntry`: fixture balance and clearly labelled purchase/usage entries. Browser values are never authoritative and mock operations return `creditsChanged: 0`.
- `GenerationQuote`: `kind: "fixture"`, estimated credits and option summary. It is not a server quote, reservation or final deduction.

Mutation requests cover generation intent, project/asset changes, wallet intent, profile/preferences, website save/publish and account-deletion request. `DashboardPreviewResult` returns a safe message, `persisted: false` and zero credit changes. No password, session token, secret object key, provider cost, unrestricted deployment ID or raw provider/webhook payload appears in a fixture DTO.

## Future production entities (contract only)

`users` (Supabase-owned identity), `profiles`, `projects`, `assets`, `conversations`, `generations`, `website_projects`, `wallets`, `credit_ledger_entries`, `credit_purchases`, `usage_events`, `model_prices` and `background_jobs`.

A wallet balance must be derived or reconciled from an append-only ledger, not a browser-mutable number. A purchase connects a provider event/payment ID to exactly one idempotent credit grant. A usage event references server-calculated model price version, metered quantity, credits deducted and request ID. Actual provider cost stays in restricted server records and is never serialized to public/client DTOs.

## Ownership and retention

Every project, asset and usage record has an owning user/workspace and authorization checks. Soft deletion and retention are decisions for later stages. Media metadata stores R2 object keys, not public secrets. Website deployment identifiers are server-managed.

## Frontend DTO boundary

Display-safe DTOs may include pack name, public credit amount, operation display cost estimate and status. They must not include provider credentials, internal cost, webhook payloads or unrestricted storage/deployment identifiers. Runtime validation is required at network boundaries in Prompt 5 even when TypeScript types exist.

`ContactRequest` and `ContactPreviewResult` in `lib/contracts/public-services.ts` describe the current local preview. `CheckoutService` returns only an unavailable preview type and has no live implementation. Neither contract stores data or proves a transaction.
