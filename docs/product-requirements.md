# Product requirements

## Product definition

Orindle provides exactly four primary products under one account and workspace: Orindle Chat, Orindle Image Studio, Orindle Video Studio and Orindle Websites. Later stages share one dashboard, universal credit wallet, asset library, project system, usage history and settings.

## Prompt 1 functional requirements

- Deliver `/`, `/features`, four product feature pages, `/pricing`, `/models`, `/blog`, six `/blog/[slug]` articles, `/about`, `/contact`, `/faq`, `/privacy`, `/terms` and `/credits-policy`.
- Provide a shared responsive public layout, working Products navigation and meaningful CTA destinations.
- Use typed local content and frontend contracts only; no real auth, payment, AI, database or deployment behavior.
- Publish six substantial original, interlinked articles matching the specified cluster.
- Provide unique metadata, canonical URLs, Open Graph, sitemap, robots, semantic content and truthful JSON-LD.
- Include usable mobile layouts, visible focus, reduced-motion handling, accessible controls and useful not-found/error states.

## Prompt 2 authentication frontend requirements

- Deliver `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` and `/auth/callback` using the established premium-white design system.
- Provide complete email/password signup/login UX, password visibility/guidance, remember-me where appropriate, required terms consent, planned Google/GitHub UI and clear sign-in/signup/recovery navigation.
- Support respectful invalid-email, weak-password, mismatch, invalid-credential, registered-account, verification, reset, network, loading, OAuth-cancellation and session-expired states without account enumeration.
- Use provider-neutral typed contracts and explicit preview-only mock adapters for signup, login, logout, reset, verification, OAuth, session and route protection.
- Do not install/connect Supabase, send email, redirect to OAuth, read/exchange auth codes, create cookies/sessions, store credentials or claim account/password/verification success.
- Keep every auth route noindex and outside the sitemap. Actual session handling and server route protection belong to Prompt 5.

## Prompt 3 customer application requirements

- Deliver a unified noindex `/app` shell with persistent desktop sidebar, accessible mobile drawer, contextual top bar, fixture-labelled universal balance, notifications and demo profile menu.
- Provide an intelligent overview plus complete Chat, Image Studio, Video Studio and Websites task interfaces; share projects, library, history, credits and settings across all four products.
- Implement conversation/new-chat, registry-driven model selection, safe message/code rendering, attachments, composer, copy, regenerate, stop and submitted/streaming/ready/error presentations.
- Implement image prompt/configuration, reference selection, estimates, fixture gallery/history, accessible preview and honest edit/download/save actions.
- Implement video text/image modes, documented model/options, illustrative estimates, distinct queued/processing/completed/failed jobs, retry and honest preview/download/save behavior.
- Implement website overview, creation, editor and settings with responsive local preview, sections/pages, AI-edit and code panels, save/publish/preview-URL distinctions.
- Implement cross-product projects, searchable/filterable library, history, exact one-time wallet packs/history and profile/security/preferences/connected-account/deletion-request settings previews.
- Use typed fixtures and preview adapters only. Do not claim authentication, persistence, AI generation, uploads, payment, credit changes, deployment or account deletion. No real backend integration belongs to this stage.

## Prompt 4 administration frontend requirements

- Deliver a separate noindex `/admin` operations shell and all 13 routes for Overview, Users, AI Models, Providers, Model Pricing, Credit Packages, Payments, Transactions, AI Usage & Costs, Generation Jobs, Website Projects, Adjustments & Disputes and Admin Settings.
- Provide responsive semantic tables, working local search/filter/pagination, useful details, accessible charts, confirmations and explicit preview feedback. Prioritize discovery, evidence and safe action flows over decorative analytics.
- Use clearly labelled fictional fixtures and typed preview adapters only. Define captured payment value, usage value, provider cost and gross contribution precisely; never present modeled values as actual Orindle financial performance.
- Require reason/confirmation for privileged intents and a non-persistent audit preview for credit adjustments. Do not expose secrets, customer files/code, raw logs or payment details.
- Document proposed route/action/field permissions for Prompt 5. Do not implement or claim actual authorization, database access, payment/provider/user/credit mutation, live health checks or persistent audit.

`admin-requirements.md` contains the complete route acceptance criteria and `admin-permissions.md` contains the future access contract.

## Pricing truth

| Pack | One-time price | Credits |
|---|---:|---:|
| Creator | $19 | 1,900 |
| Pro | $49 | 4,900 |
| Studio | $99 | 9,900 |

One-hundred credits represent $1 of customer-facing usage value. Proposed usage price is 2× verified metered provider cost; actual deduction is server-calculated later. Operations vary in credit cost. Credits are shared across all four products. No subscription, unlimited-use or universal operation-price claim is allowed.

## Legal/content boundaries

A Credits Policy explains purchases and usage without removing statutory rights, disputes or legally required remedies. There is no `/refund-policy` route. Privacy and Terms are clear starter documents for the frontend stage, not represented as legal advice or proof of compliance. No fake social proof, statistics, testimonials or provider availability.

## Out of scope

Real signup/login, checkout, authoritative credit balance/ledger, model execution, file upload/storage, website deployment, email delivery, administrative authorization/database access and persistent customer/admin behavior. Prompts 3 and 4 implement customer and admin frontends with clearly labelled fixtures; real data and operations remain unimplemented.
