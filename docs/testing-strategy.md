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

## Build and static checks

Run exact installed-package `tsc --noEmit`, ESLint, unit tests and production build. Check for unsafe `any`, accidental secrets, dead links and large client bundles. Build success alone is not functional sign-off.

## Manual visual/UX review

Inspect homepage, pricing, one feature page, blog listing/article and contact at target widths. Review tab order, 200% zoom, contrast, reduced motion, content accuracy and all external links. Real-device screen readers and field Core Web Vitals remain launch-stage requirements unless actually performed.

## Evidence

`progress.md` and `quality-assurance.md` record commands, dates, outcomes and unresolved limitations. Do not mark an item tested if its test could not run.
