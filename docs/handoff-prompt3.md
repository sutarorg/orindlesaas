# Handoff to Prompt 3 — Dashboard and shared workspace

Prompt 3 must inherit the completed public design system, auth/session contracts and one-account/four-product model. Build the centralized dashboard with shared projects, assets, usage history, wallet display and settings using the same premium-white brand. All private routes require server authorization and `noindex, nofollow`; keep them out of the public sitemap. Do not expose internal provider cost or credentials.

Before implementation, update `architecture.md`, `data-model.md`, `api-contracts.md`, `security-threat-model.md`, `testing-strategy.md` and this handoff with actual Prompt 2 behavior. Reuse UI tokens/components while designing application density appropriately. All balances and usage are server-issued; no browser-controlled deductions. Include loading, empty, error and unauthorized states and test object-level authorization. Do not add subscriptions.
