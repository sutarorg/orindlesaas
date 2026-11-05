# Admin requirements

Status: **accepted Prompt 4 frontend scope**. Every page uses fictional, explicitly labelled data. No requirement below authorizes a real administrative operation in this phase.

## Shared shell and usability

- Provide a distinct premium-white, data-oriented `/admin` shell with desktop sidebar, responsive modal navigation, top bar, breadcrumbs, local fixture search, notification area, demo profile menu and main workspace.
- Include exactly these global destinations: Overview, Users, AI Models, Providers, Model Pricing, Credit Packages, Payments, Transactions, AI Usage & Costs, Generation Jobs, Website Projects, Adjustments & Disputes and Admin Settings.
- Keep one visible H1 per route, useful descriptions, readable density, clear text-plus-color statuses, consistent date/currency/credit formats and visible keyboard focus.
- Search, filters and pagination must work locally with fixtures; empty results and filter reset are required. Tables must preserve semantics and remain usable at 320px without page-level overflow.
- Show a persistent demo-operations notice and route-level fixture context. No fake online presence, live health check, actual revenue, saved change or operational success claim.

## `/admin` — Overview

Show total registered users, active users, new users, demo total revenue, successful purchases, credits issued, credits consumed, provider costs, gross contribution, payment failures, generation failures and job processing volume.

Provide sensible fixture time-range controls and readable charts with units, text summaries and equivalent values. Define every financial metric. Do not add arbitrary growth percentages, fabricated company claims or unlabeled analytics. Surface actionable fixture exceptions with real links to relevant admin views.

## `/admin/users` — User management

- Search by fictional name/email/ID; filter account status; paginate.
- Show status, credit balance, creation date and last fixture activity.
- Open a detail dialog with profile, purchase history, usage history and account timestamps.
- Provide account status/session-related administrative intents with reason and two-step confirmation.
- Never expose credentials, session tokens, private files or unrestricted customer content. Feedback must say no user/session changed.

## `/admin/providers` and `/admin/models`

Providers display name, illustrative integration status, enabled state, last demo health-check timestamp, safe error status and derived model count. Model rows derive from the shared catalogue and include display name, provider, exact model identifier, product capabilities, input/output modalities, enabled state, pricing summary and availability.

Provide configuration dialogs for provider/model enabled state and product availability. Do not assume modality support: render each model's typed arrays. Require confirmation for availability changes and state that no provider or catalogue was changed. Model IDs remain date-sensitive fixtures, not proof of Orindle connectivity.

## `/admin/model-pricing`

- Show model, unit/meter, illustrative provider cost, proposed customer usage value/credit configuration, effective date/version and status.
- Provide edit/review interfaces for pricing configuration with numeric validation, reason and confirmation.
- Keep internal provider cost restricted to the admin fixture; never add it to public/customer DTOs.
- Do not claim a price version became active. Prompt 5 must validate server prices, effective dates and transactional usage of the applicable version.

## `/admin/credit-packages`

Include exactly Creator — $19 — 1,900 credits; Pro — $49 — 4,900 credits; Studio — $99 — 9,900 credits as the initial fixtures. Provide package editing/configuration UI with integer validation, preview of customer-facing display value, reason and a two-step confirmation. No package save or checkout change may be claimed.

## `/admin/payments` and `/admin/transactions`

Payments show provider payment ID, fictional customer, package, amount/currency, payment status, webhook status, credit-fulfillment status and safe references. Include search/status filters, pagination, details and a non-operational reconciliation intent where useful.

Transactions show transaction/reference IDs, type, customer, payment/generation association, signed credits, amount where applicable, timestamp and status. Do not create a customer-facing refund-policy page. Refund/dispute status is operational fixture information only.

## `/admin/adjustments`

- Separate credit-adjustment and dispute workflows while keeping one global destination.
- Credit adjustment requires target user, non-zero integer amount, category, ticket/reference, a substantive reason and explicit review/confirmation.
- Display an ephemeral audit-preview record after valid confirmation, including actor/action/target/reason/timestamp and `persisted: false`. It is not a real audit log and zero credits changed.
- Dispute review requires a reason and confirmation; no payment, chargeback or balance mutation is claimed.
- Existing audit/dispute records are fictional and labelled.

## `/admin/usage`

Show illustrative provider cost, customer credit deductions/usage value, product- and model-level costs, cost per active fixture user, usage by day, failed-generation cost, unreconciled usage and gross contribution.

Clearly distinguish provider cost, customer usage value, captured payment value, gross contribution and excluded operating expenses. Never call modeled usage value actual received revenue. Provide range/product/model filters and accessible summaries/tables.

## `/admin/jobs`

Include chat, image, video and website jobs with queued/running/completed/failed states, retry count, provider/model, duration, safe job ID and redacted diagnostic detail. Provide product/status/search filters, pagination and a suitable detail dialog. Retry requires reason/confirmation and cannot claim a job was queued or retried.

Logs must not contain prompts, customer file contents, generated code, secrets, signed URLs, raw provider responses or stack traces.

## `/admin/websites`

Show fictional customer project, owner, current status, deployment status, safe domain display, last deployment and failed-deployment state. Include filters/detail views and safe operational metadata only. Do not expose generated customer code, files, tokens or unrestricted deployment identifiers.

## `/admin/settings`

Provide local-only preferences for default range/density and notification-preview controls, plus a read-only explanation of the proposed permission model and step-up/audit requirements. Do not provide real role assignment, API keys, secret values or organization security settings. Saving preferences returns non-persistent feedback.

## Acceptance and exclusions

All routes and interactions must pass strict TypeScript, ESLint and production build, with unit/browser coverage and responsive/accessibility review. Actual RBAC/ABAC, sessions, Supabase/Drizzle access, payment/webhook operations, credit ledger changes, provider calls, real health checks, deployment access, persistent audit and email remain Prompt 5 backend work.
