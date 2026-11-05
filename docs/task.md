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

Commercial launch tasks remain explicitly open in `production-readiness.md`; this checklist does not claim real backend services, field performance or legal sign-off.
