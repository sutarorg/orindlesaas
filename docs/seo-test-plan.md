# Technical SEO and content verification plan

Status: **production-build technical crawl executed; production indexing/Search Console remains unavailable**. Results are in `seo-report.md`. The goal is crawlable, truthful, useful content. No ranking, indexing, rich-result, AI-search placement, or organic-traffic outcome is guaranteed by these tests.

## Inventory and metadata

Build the expected indexable set from the shared route/article registry: home, features and four products, pricing, models, blog and six articles, about, contact, FAQ, privacy, terms, and credits policy. For every route assert:

- HTTP 200 on production HTML, one visible H1, unique meaningful title and meta description;
- self-referencing absolute canonical using the verified configured HTTPS origin, with no untrusted Host derivation;
- appropriate Open Graph type/title/description/URL/image and Twitter card fields;
- substantive server-rendered content and descriptive internal anchors;
- no staging/query/host duplicate canonical or placeholder metadata.

Auth, `/app`, `/admin`, API, error, and unknown routes use appropriate noindex/denial behavior and are absent from the sitemap. Noindex/robots are discovery controls, never authorization.

## Sitemap, robots, and status codes

1. Parse `sitemap.xml` as XML; compare its URL set exactly with the eligible registry, including all six articles and no duplicates/private/prohibited paths.
2. Verify robots status, sitemap absolute URL, explicit auth/app/admin disallows, and no accidental public-route disallow.
3. Verify unknown article/product/route and `/refund-policy` return real 404, not a 200 soft 404 or streaming-shell false success.
4. Check canonical/OG/sitemap origins all match the same verified production origin. Local test origins are labelled and not production SEO evidence.

## Structured data

Parse every `application/ld+json` block and validate:

- global Organization/WebSite and eligible SoftwareApplication describe the real platform;
- Article headline, description, dates, author, canonical, and visible article body match;
- BreadcrumbList items match visible navigation and URLs;
- Creator/Pro/Studio Offers match visible one-time USD prices/credits and each fragment resolves to one visible pack;
- no AggregateRating, Review, fake award/stock/availability, subscription, or unsupported model/provider claim.

Run an external structured-data validator only if accessible and record its version/results separately; successful syntax/eligibility does not promise a rich result.

## Six-article content quality gate

For every launch article verify distinct search intent, direct answer, original practical examples, semantic H2/H3, TOC anchors, useful tables/lists/workflows, relevant internal next steps, authoritative external references, rights/limitations/human review where applicable, and a natural non-deceptive product CTA.

Reject thin sections, keyword stuffing, reworded repetitive articles, invented benchmarks/rankings/prices/savings/customer results, stale exact model availability presented as current, broken internal links, and metadata inconsistent with visible content. Date-sensitive model guidance requires a recorded review cadence.

## Link and rendering crawl

- Extract all internal hrefs and fragments from production HTML; request each unique route and verify target IDs.
- Check no dead controls or JavaScript-only body dependency for article content; server HTML contains the substantive article.
- Inspect image alt/dimensions, social image content type/size, favicon, font/resource failures, and canonical robots consistency.
- External links are reviewed for destination relevance without high-volume crawling or presenting third-party availability as guaranteed.

## Post-deployment and measurement limits

Production launch additionally requires verified domain/HTTPS, Search Console ownership, sitemap submission/inspection, canonical/index coverage review, real field performance monitoring, and content revalidation. Those are currently blocked without deployment/owners. Do not fabricate indexing, field CWV, ranking, or Search Console evidence.
