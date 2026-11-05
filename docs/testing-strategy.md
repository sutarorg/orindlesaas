# Testing strategy

## Unit and content integrity (Vitest)

- Credit packs exactly match names, integer USD prices and credits; 100-credit display-value arithmetic examples are correct.
- All six article slugs are unique, required sections/SEO fields exist and internal article references resolve.
- Route inventory/content routes contain no `/refund-policy` and no duplicate paths.
- Metadata/JSON-LD helpers emit correct canonical URLs and truthful types without ratings.
- Utility and any mock adapter behavior returns explicit unavailable/preview states.

## Component and accessibility

Use Testing Library where useful for accessible names, accordion `aria-expanded`, menu keyboard behavior and form labels/errors. ESLint includes JSX accessibility rules. Playwright + axe checks key pages for serious violations; automated results do not replace manual review.

## End-to-end (Playwright)

- Header navigation, Products disclosure, mobile menu, footer and all internal CTA destinations.
- All public routes return successfully; unknown article and unknown route show not-found UI.
- Each article renders H1, contents, substantive body and related links; sitemap contains all articles.
- Contact/purchase behavior never reports unperformed success.
- Keyboard focus, Escape close/focus return, skip link and reduced-motion preference.
- No horizontal overflow at 320, 390, 768, 1024 and 1440 on representative complex routes.
- Metadata/canonical/OG tags and JSON-LD visible in rendered HTML.

## Prompt 2 authentication tests

- Pure validation: valid/invalid email, name, 15/128-code-point boundaries (including Unicode), mismatch and required terms; passwords are not trimmed.
- Preview-state parsing: every documented state/provider/pack is allowlisted; unknown state, code, token and arbitrary next values are ignored.
- Mock contract: every method returns preview/unavailable only, no authenticated user, redirect, account/email/password success or storage side effect.
- Components: labels/autocomplete, field errors/descriptions, first-invalid focus, terms/remember-me native toggles, show/hide password accessible name and preserved value.
- E2E: all six auth routes, login/signup validation and loading, generic reset result, verification/expiry/callback states, planned OAuth feedback and no false success.
- Accessibility/responsive: keyboard-only completion, visible focus, mobile 320/390px layouts, desktop 1440px, and axe scans for every auth route plus error/success-preview states.
- Regression: Prompt 1 routes, pricing handoff and public navigation remain intact; new auth routes are noindex and absent from sitemap.

## Prompt 3 dashboard tests

- Fixture/registry integrity: unique IDs, exact packs, documented model IDs, valid cross-references, fixture labels and no unexpected production URLs/secrets.
- Preview adapter: every method returns preview/unavailable, `persisted: false`, `creditsChanged: 0` and no job/payment/save/publish/deletion success.
- Pure helpers: deterministic image/video/website estimates, active navigation/breadcrumbs, library/project/history filters and website/settings validation.
- Markdown/components: headings/lists/code render safely, raw HTML remains text, copy reports actual clipboard result, and stop/regenerate only alter labelled local preview state.
- Shell E2E: every `/app` route and allowlisted dynamic ID, unknown-ID not-found, active navigation, mobile drawer Escape/focus return, notification/profile menus and noindex/robots/sitemap.
- Product E2E: chat empty/error/streaming/composer, image configuration/gallery/dialog, video job states/retry, website creation/editor device modes/settings and all non-operation feedback.
- Workspace E2E: local project/library/history filters, empty results, transaction/project/asset details, destructive confirmations and settings validation.
- Responsive/accessibility: every workspace route at 320, 390 and 1440px, with complex public routes additionally covering 768 and 1024px; keyboard menus/dialogs/editors and axe scans for every workspace route.
- Regression: Prompt 1 public and Prompt 2 authentication suites remain green after `(site)` chrome separation. No fixture action creates network requests, auth storage, payment/job success or deployed URLs.

## Build and static checks

Run exact installed-package `tsc --noEmit`, ESLint, unit tests and production build. Check for unsafe `any`, accidental secrets, dead links and large client bundles. Build success alone is not functional sign-off.

## Manual visual/UX review

Inspect homepage, pricing, one feature page, blog listing/article and contact at target widths. Review tab order, 200% zoom, contrast, reduced motion, content accuracy and all external links. Real-device screen readers and field Core Web Vitals remain launch-stage requirements unless actually performed.

## Evidence

`progress.md` and `quality-assurance.md` record commands, dates, outcomes and unresolved limitations. Do not mark an item tested if its test could not run.
