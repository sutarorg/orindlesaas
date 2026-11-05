# Task checklist

Status keys: `[ ]` not started, `[~]` in progress, `[x]` implemented and appropriately validated. Do not mark code generation alone as complete.

## Documentation and research

- [x] Inspect repository, tools and existing assets.
- [x] Create/populate all required global documentation before application code.
- [x] Research current official Next.js metadata/SEO/performance/accessibility guidance.
- [x] Complete article-specific intent and primary-source research.
- [x] Record exact installed dependency versions.

## Foundation and shared UI

- [x] Scaffold App Router, strict TypeScript, Tailwind and shadcn-compatible primitives.
- [x] Configure Poppins/Inter, premium-white tokens and global prose/focus styles.
- [x] Build original Orindle mark, header, Products menu, mobile navigation and footer.
- [x] Build buttons, containers, section headings, accordions and resilient states.
- [x] Add typed product, model, credit-pack and article content models.

## Public pages

- [x] Homepage with all specified sections and four distinct product visuals.
- [x] `/features` and four detailed product routes.
- [x] `/pricing` with exact one-time packs and transparent usage explanation.
- [x] `/models` with date-sensitive selection guidance and no fake availability.
- [x] `/about`, `/contact`, `/faq`.
- [x] `/privacy`, `/terms`, `/credits-policy`; verify no `/refund-policy`.
- [x] `/blog` listing and six substantial dynamic articles.

## SEO and assets

- [x] Unique metadata/canonical/OG for every route and article.
- [x] Sitemap, robots and private-route noindex handoff requirements.
- [x] Organization, SoftwareApplication, Article, BreadcrumbList and eligible Offer JSON-LD.
- [x] Original favicon and social image; update asset inventory.
- [x] Semantic headings, descriptive links and crawlable article body.

## Validation and delivery

- [x] Unit/content integrity tests pass: 11/11.
- [x] TypeScript strict check and ESLint pass.
- [x] Production build passes.
- [x] Playwright navigation, metadata, responsive overflow and accessibility checks pass: 16/16.
- [x] Manual representative-page visual and keyboard review completed.
- [x] No dead internal links, fake transactions, fake social proof or exposed secrets found in the completed audits.
- [x] Documentation/progress/decisions/assets updated with evidence.
- [x] `handoff-prompt2.md` completed for authentication stage.

## Prompt 2 — authentication frontend

### Documentation and research

- [x] Inspect the merged Prompt 1 repository, auth previews, contracts and relevant documentation.
- [x] Research current official Supabase password/OAuth/redirect/SSR guidance, Next 16 routing/Proxy, WCAG/WAI authentication forms and NIST password UX.
- [x] Create `authentication-design.md` and `authentication-flows.md`; update architecture, routes, requirements, accessibility and security baseline before code.
- [x] Clarify staging: Prompt 2 is frontend-only; Prompt 5 owns real Supabase/session behavior.
- [x] Create the Prompt 3 application-shell handoff baseline.

### Implementation

- [x] Build shared auth shell and reusable input/label/checkbox/password/alert components.
- [x] Implement `/login` and `/signup` forms, validation, password visibility, remember-me/terms and planned OAuth feedback.
- [x] Implement `/forgot-password`, `/reset-password`, `/verify-email` and `/auth/callback` presentations.
- [x] Add typed signup/login/logout/reset/verification/OAuth/session/route-protection contracts and preview-only mock adapters.
- [x] Implement all required allowlisted error, loading, cancellation, verification and expiry states without account enumeration or false success.
- [x] Preserve pack display intent, noindex metadata, sitemap exclusion and public visual tokens.

### Validation and delivery

- [x] Unit tests cover validation, state parsing and every mock method's non-operational result.
- [x] Component/E2E tests cover invalid input, mismatch, loading, visibility, keyboard access, OAuth feedback and no-success claims.
- [x] Every auth route and presentation state renders at mobile/desktop widths without overflow or serious axe violations.
- [x] Strict TypeScript, ESLint and production build pass alongside Prompt 1 regressions.
- [x] Inspect representative auth pages visually and update QA/progress/assets/decisions with actual evidence.
- [x] Finalize `handoff-prompt3.md` with exact implemented imports, user-state assumptions and shell requirements.

## Prompt 3 — customer dashboard frontend

### Documentation and research

- [x] Inspect the merged repository, Prompt 3 handoff and previous design/architecture decisions.
- [x] Research current Next.js nested/dynamic routes, shadcn sidebar/AI patterns, AI SDK UI message states and WCAG responsive reflow.
- [x] Research official current model IDs/capabilities for a date-labelled catalogue fixture.
- [x] Create/update dashboard architecture, navigation, shared requirements/contracts/data/routes/design/accessibility/plans/risks and Prompt 4 handoff before application code.

### Shell and shared contracts

- [x] Separate public/auth chrome with a URL-neutral route group and implement the unified noindex `/app` shell.
- [x] Add desktop/mobile navigation, contextual top bar, fixture balance, notifications, demo profile and state presentations.
- [x] Add typed dashboard contracts, documented model registry, shared fixtures, estimates and non-persistent preview adapter.

### Product and workspace experiences

- [x] Implement the intelligent `/app` overview and complete chat/new-conversation/message states.
- [x] Implement Image Studio and Video Studio configuration, history/job states, previews and honest actions.
- [x] Implement website overview, creation, responsive editor and settings routes.
- [x] Implement Projects, Library, History, Credits/Wallet and Settings/Support with useful local interactions.

### Validation and delivery

- [x] Unit/component tests cover fixtures, registry, estimates, mock methods, safe markdown, filters and validation.
- [x] E2E tests cover every route/dynamic ID, shell navigation, product controls, dialogs, states and no-operation claims.
- [x] Verify 320–1440px responsive behavior, keyboard/focus handling and representative axe scans.
- [x] Strict TypeScript, ESLint, unit tests and production build pass alongside Prompt 1/2 regressions.
- [x] Inspect representative desktop/mobile application views and finalize QA/progress/assets/decisions.
- [x] Finalize `handoff-prompt4.md` with actual shell, fixture, backend and administration requirements.

Commercial launch tasks remain explicitly open in `production-readiness.md`; this checklist does not claim real backend services, field performance or legal sign-off.
