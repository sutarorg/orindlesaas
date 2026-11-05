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

Real signup/login, checkout, credit balance/ledger, model execution, file upload/storage, website deployment, email delivery, admin and customer dashboard. Their future contracts and handoffs are documented but not faked.
