# Page requirements

## Shared

Every public page has one clear H1, a unique title/description, canonical URL, Open Graph metadata, header/footer, descriptive links, visible keyboard focus and responsive content. Breadcrumbs appear on nested feature/article/legal pages where useful. No dead controls or fabricated activity.

## Home

Required sequence: hero with exact requested headline/supporting copy; ecosystem visual; four visually distinct product chapters; models/provider ecosystem; Why Orindle; connected workflow; creator/business use cases; shared credits; pricing preview; FAQ; final CTA. All availability claims reflect frontend-only status.

## Features overview and product pages

Overview explains shared account/workspace concepts and helps visitors select a product. Each product page includes a specific hero, practical inputs/outputs, workflow steps, benefits, limitations/expectations, related article and CTA. No claim of real-time generation or publishing in this stage.

## Pricing

Display Creator/Pro/Studio exactly; identify one-time payment and no recurring subscription. Explain shared wallet, 100-credit display value, variable deductions, additional packs and example planning without exposing provider cost. Include comparison by user needs rather than fabricated “savings.” Purchase CTAs cannot simulate checkout.

## Models

Explain that different models have different strengths and costs. Use provider family names only with a verified/planned label and date-sensitive language. Link to the model-selection article. Do not list invented model IDs, benchmark rankings or context-window values.

## Blog and articles

Listing exposes all six titles, descriptions, topics and reading time. Articles contain original practical guidance, semantic H2/H3 hierarchy, TOC for longer pieces, relevant internal/external links and a natural CTA. Dates and author are real content metadata, not social proof.

## About and contact

About states mission, four-product scope and design/product principles without founding myths or team fabrication. Contact clearly states which channels are configured; an unconnected form must not claim message delivery.

## FAQ and policy pages

FAQ covers product, wallet, one-time pricing, usage variability, model choice and account expectations. Privacy/Terms identify their draft/last-updated status and avoid fictional entity/contact data. Credits Policy preserves statutory rights, payment disputes and legally required remedies. There is no refund-policy route.

## Authentication pages

All authentication routes use one H1, unique noindex metadata, the shared Orindle shell, visible frontend-preview disclosure and real internal recovery/navigation links. Forms have persistent labels, appropriate autocomplete, keyboard-operable password visibility, associated inline errors, first-invalid focus, busy feedback and an explicit mock result. No route creates an account/session, sends email, contacts OAuth providers or changes a password.

- `/login`: welcome copy, email/current-password, remember-me choice, forgot-password, login CTA, planned Google/GitHub UI, signup and Terms/Privacy links.
- `/signup`: name/email/new-password/confirmation, Unicode length guidance, independent visibility controls, unchecked required terms, OAuth UI, sign-in navigation and optional pack-intent display.
- `/forgot-password`: email validation and a generic no-delivery reset-request result that cannot enumerate accounts.
- `/reset-password`: new-password/confirmation validation, length guidance and expired-link presentation; no update claim.
- `/verify-email`: required/success/expired presentation states and resend preview; no verification or email claim.
- `/auth/callback`: static processing/error/cancellation presentation only; no token/code reading, session handling or arbitrary redirect.

Detailed copy and preview query URLs are maintained in `authentication-flows.md`.

## Customer application pages

Every `/app` route inherits the unified DashboardShell and noindex metadata. A visible demo-workspace notice, fixture labels and honest action feedback are mandatory. One H1 per view, contextual navigation and responsive keyboard operation are required. No fixture is a real session, account balance, payment, generation or deployment.

- `/app`: personalized fixture greeting, universal balance/buy-credits destination, four product entries, recent projects/generations, suggested actions, model highlights and a compact usage summary. Allowlisted empty/error/session-expired/unauthorized state presentations are documented in `dashboard-navigation.md`.
- `/app/chat` and `/app/chat/[conversationId]`: conversation history, New chat, typed registry/Auto selector with provider details, attachment-name selection, message composer, safe markdown/code blocks, copy/regenerate/stop, title, empty/error/submitted/streaming states. Unknown conversation IDs return not-found.
- `/app/image-studio`: prompt, provider-supported negative-prompt treatment, model/reference/ratio/resolution/count/style controls, illustrative estimate, generate preview, fixture image grid/history, full-screen preview and honest download/save/edit/variation behavior.
- `/app/video-studio`: text/image mode, model/duration/ratio/resolution/reference controls, illustrative estimate, generate preview, queued/processing/completed/failed fixtures, retry and labelled still-frame player; no false readiness or playback.
- `/app/websites`: project thumbnails, status, updated time, published/unpublished labels, editor destinations and New website CTA.
- `/app/websites/new`: website brief, business/type/style/reference inputs, suggested sections, estimate and validated non-generating submit.
- `/app/websites/[projectId]/editor`: page/section navigation, actual responsive local preview, AI editing panel, editable code panel, desktop/tablet/mobile modes, local save status, preview URL, publish preview and settings link.
- `/app/websites/[projectId]/settings`: website identity/metadata/publishing fields and explicit non-persistent save.
- `/app/projects`: searchable/filterable projects, create/edit dialogs, project details and related-generation organization.
- `/app/library`: images/videos/website assets/documents, search/filter, preview, download feedback and confirmed non-deleting action; useful no-results empty state.
- `/app/history`: generation product, model/provider, fixture credits, date and status with local filters.
- `/app/credits` and `/app/credits/history`: fixture balance, Creator/Pro/Studio exact one-time packs, purchase/usage history, transaction details and transparent wallet explanation; no real payment history or checkout.
- `/app/settings`: profile, security, preferences, connected accounts, notifications, deletion-request validation and help links without data mutation.
- `/app/support`: product/help guidance, public FAQ/contact links and an honest no-live-status statement.

Loading, empty, error and completed-fixture presentations must be inspectable. Controls either navigate, perform a genuine local UI action or return explicit preview/unavailable feedback.

## Administration pages

Every `/admin` route inherits the separate AdminShell, noindex metadata and a persistent demo-operations notice. All records and health/financial states are fictional fixtures. One H1, contextual breadcrumbs, local discovery, responsive semantic data displays and honest non-persistent actions are mandatory.

- `/admin`: all required user/payment/credit/cost/contribution/failure/job metrics, qualified fixture ranges, accessible charts and exception links.
- `/admin/users`: search/status filters, pagination, safe account/purchase/usage details and confirmed account-action previews.
- `/admin/models` and `/admin/providers`: exact model IDs, per-model capabilities/modalities, availability/pricing, integration/health fixtures and configuration previews.
- `/admin/model-pricing`: restricted illustrative costs, credit-price versions/effective dates and validated configuration previews.
- `/admin/credit-packages`: exact Creator/Pro/Studio initial packs, edit/configuration forms and two-step confirmation.
- `/admin/payments` and `/admin/transactions`: payment/webhook/fulfillment/reference states, filters, pagination and safe details.
- `/admin/usage`: provider cost, credit deductions/usage value, product/model/day/user costs, failed and unreconciled usage and gross contribution with explicit definitions.
- `/admin/jobs`: all four products, queue/running/completed/failed states, retries/provider/model/duration/IDs and redacted diagnostics.
- `/admin/websites`: safe owner/project/deployment/domain/failure metadata without customer code or files.
- `/admin/adjustments`: validated reasoned credit/dispute intents, explicit confirmation and non-persistent audit previews; zero real balance/payment changes.
- `/admin/settings`: local display/notification preference previews and proposed permission explanations, not role or secret management.

See `admin-requirements.md` for full field and interaction requirements. Unknown `/admin/*` paths return an admin-safe real 404. No route implements authentication or authorization in Prompt 4.
