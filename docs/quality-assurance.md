# Quality assurance

## Stage gates

1. **Documentation baseline:** all 35 Markdown files exist and are nonempty; architecture, design, routes and contracts were populated before application code.
2. **Foundation:** exact dependencies installed; strict TypeScript, ESLint, brand tokens and shared layout pass inspection.
3. **Content/routes:** every required page and six substantial articles resolve; `/refund-policy` and unknown slugs return the custom 404.
4. **Experience:** representative mobile/tablet/desktop inspection, keyboard navigation, reduced motion and honest preview states verified in Chromium.
5. **SEO:** unique metadata, canonical/OG, sitemap/robots and truthful JSON-LD checked in rendered production pages; Offer fragments resolve to visible pack cards.
6. **Validation:** typecheck, lint, unit tests, production build and Playwright checks pass. Extended axe and internal-link audits pass. Remaining launch-only limits are listed below.

## Prompt 1 QA log — 2026-11-05

| Check | Result | Actual evidence |
|---|---|---|
| Documentation inventory | Pass | 35/35 `docs/*.md` files nonempty; useful handoff and risk documents retained. |
| `npm run typecheck` | Pass | Strict `tsc --noEmit`; no errors. |
| `npm run lint` | Pass | ESLint 10.14.0; no warnings or errors in the final run. |
| `npm run test:unit` | Pass | 4 test files, 11/11 tests: content/link/pack integrity, metadata, FAQ and contact preview. |
| `npm run build` | Pass | Next 16.4.5 production build; 29-page static-generation phase, six SSG article paths, four SSG product paths and dynamic `/signup`. |
| `npm run test:e2e` against production | Pass | 16/16 Chromium tests: all routes/H1s, custom 404s, metadata/JSON-LD, sitemap, menus, pack handoff, contact, FAQ, responsive overflow, axe and reduced motion. |
| Responsive overflow | Pass | `/`, `/pricing`, `/models`, one product page and one article at 320, 390, 768, 1024 and 1440px; 25 combinations, no page-level horizontal overflow. |
| Extended axe audit | Pass | 23 routes (21 indexable routes plus noindex login/signup previews), zero violations for `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` in the tested Chromium states. |
| Rendered internal-link audit | Pass | 105 unique internal URL/fragment targets collected from all 23 rendered routes; zero non-200 targets and zero missing fragment IDs. |
| Representative visual review | Pass with noted limits | Inspected homepage at 1440px and 390px, full mobile pricing at 390px, desktop article at 1440px, models at 768px and Image Studio at 390px. Repeated review after the motion fix showed all content visible. |
| `npm audit --audit-level=high` | Pass | Zero vulnerabilities reported on 2026-11-05. |
| Secret-pattern source scan | Pass | No private-key, service-role or live-key patterns found in `app`, `components`, `lib`, `tests` or `docs`; `.env.example` contains public placeholders only. |

Automated axe results are not a WCAG certification. They cover the tested DOM/viewport states, not every possible interaction or assistive technology.

## Defects found and corrected during browser QA

- The first npm-packaged Chromium launch lacked NSPR/NSS shared libraries. Extracting the package's bundled `al2023` libraries and setting `LD_LIBRARY_PATH` resolved the environment failure. Serverless GPU/single-process flags were then removed for local test stability.
- Article-card opacity and muted accent text produced contrast failures. Opacity was removed from meaningful labels and teal text was darkened to `#067a67`.
- Long CTA min-content widths and an article table expanded narrow grids. Buttons may now wrap, article tracks use `minmax(0, 1fr)`, and wide tables remain inside labelled horizontal scroll regions.
- Initial opacity-based reveals could remain transparent when reduced motion became active after hydration. Reveals now start visible (`initial={false}`), use only a small transform keyframe for motion and have no reduced-motion animation. A regression test checks every homepage reveal has opacity 1 and no transform.
- Pricing Offer URLs used `/pricing#creator`, `#pro` and `#studio` before matching element IDs existed. The visible pack articles now own those IDs and an E2E test verifies every fragment.
- A test selector matched both “Pro” and “Products”; it now uses an exact accessible-name match. Sitemap validation uses the request fixture rather than rendering XML in Chromium.

## Browser execution used in this sandbox

The production server ran with `npm run start` on `0.0.0.0:3000`. The standard local path is `npx playwright install chromium` followed by `npm run test:e2e`. The CDN download was unavailable here, so the optional dev-only npm Chromium package was used:

```bash
node -e "(async()=>{const c=require('@sparticuz/chromium'); await c.executablePath(); await c.inflate('node_modules/@sparticuz/chromium/bin/al2023.tar.br')})()"
LD_LIBRARY_PATH=/tmp/al2023/lib \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
npm run test:e2e
```

These are test-environment settings, not application runtime requirements. No browser binary or shared library is stored in the repository.

## Honest frontend behavior reviewed

- Contact submission performs local validation and explicitly states that no message was sent or stored.
- Pack selection opens `/signup?pack=...`; it does not start checkout, take payment or grant credits.
- Login/signup pages are noindex previews with no submit form and no account-success claim.
- No AI generation, database write, email delivery, deployment or real authentication exists.
- No testimonials, customer logos, ratings, savings claims, scarcity or fabricated model availability appears.

## Remaining validation and launch limits

- Real screen-reader/assistive-technology testing, full 200% zoom/reflow review and real-device testing remain launch-stage work.
- Lighthouse/throttled lab profiling and representative 75th-percentile field Core Web Vitals were not run; no CWV compliance claim is made.
- External primary-source links were reviewed during research, but this audit does not guarantee their future availability. Internal links were fetched and checked.
- Final production hostname, verified support inbox, legal entity/governing law and qualified policy review remain unresolved.
- The site is not commercially production ready because auth, database, payments, ledger, AI, email, monitoring and deployment controls intentionally belong to later stages.

## Release tolerance

Any P0/P1 risk, broken required route, failing required check or deceptive transaction state blocks stage completion. Minor content polish may be documented only if it does not undermine requirements.
