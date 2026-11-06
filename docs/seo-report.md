# SEO and content evaluation report

Status: **production-build technical SEO corpus passed locally; production indexing, Search Console and rich-result eligibility are NOT VERIFIED**. No ranking, AI-search placement or organic-traffic claim is made. Procedure: `seo-test-plan.md`.

## Executed evidence

The local production Chromium suite for the structured-data correction passed **80/80**. Its public-quality corpus derived the expected inventory from the shared product/article registries and covered **21 indexable routes**, including all four product pages and six complete articles.

| Check | Observed result |
|---|---|
| Status/title/description/H1 | Every indexable route returned 200 with one visible H1 and non-empty, unique title and meta description |
| Canonical and social metadata | Canonical and `og:url` matched the configured absolute HTTPS origin; OG title/description, absolute 1200×630 social image and Twitter summary-large-image fields were asserted |
| Sitemap/robots | Parsed sitemap URL set exactly matched the 21-route registry with no duplicates; robots sitemap URL and auth/app/admin disallow boundaries matched |
| Internal navigation | Crawled public anchors, rejected placeholder `href="#"`, requested internal destinations, and resolved same-page and cross-route fragments |
| Structured data | Parsed every JSON-LD block on every indexable route; asserted shared Organization/WebSite entities, home/product SoftwareApplication data, article data/breadcrumbs/word count, and exactly three pricing Product offers |
| Pricing truthfulness | Exact Creator/Pro/Studio names, descriptions, USD prices and `#creator`/`#pro`/`#studio` offer fragments matched visible one-time packs; obsolete “later stage” checkout wording was corrected as QA-009 |
| Unsupported claims | Every indexable route was checked for absence of AggregateRating and Review entities; no rating/review rich-result claim is made |
| Errors/private discovery | Unknown/prohibited routes returned real not-found behavior; auth and private routes are noindex/disallowed as appropriate |
| Lab SEO | Retained Lighthouse matrix reported SEO 100 on home, pricing and article. `/login` reported 66 solely because it is intentionally noindex; that deduction remains visible and the exception cannot apply to indexable routes |

## Content and origin limits

Article assertions verify structured fields and substantive length, not editorial fact-checking, legal approval or search quality. The configured `https://orindle.com` origin is consistently used in the build, but a deployment owner must still verify the real canonical production origin, DNS, HTTPS and host redirects. Local `127.0.0.1` crawl evidence is not production index evidence.

No external structured-data validator, Google Rich Results Test, Search Console property, production crawl, index coverage, field CWV or ranking data was available. Syntax and internal consistency do not guarantee indexing or rich results.

## Decision

**Local technical SEO regression gate: PASS. Production SEO/search outcome gate: NOT EVALUATED.** After an authorized deployment, verify the live canonical origin and status/redirect corpus, submit/inspect the sitemap in the owner-controlled Search Console property, run external structured-data validation where appropriate, and monitor indexing without promising placement or traffic.
