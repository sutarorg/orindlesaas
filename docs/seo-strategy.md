# SEO strategy

## Search positioning

Orindle's topic cluster addresses the practical problem of moving between AI conversation, images, video and websites without losing context. The objective is useful, intent-matched content and technically accessible pages—not guaranteed rankings or keyword density.

## Technical implementation

- Root `metadataBase`, title template, default description, Open Graph and Twitter card metadata.
- Unique title and description per static page; `generateMetadata` for article slugs.
- Canonical absolute URLs from one site URL helper.
- `app/sitemap.ts` enumerates all public static and article routes; no future private routes.
- `app/robots.txt` generated through `app/robots.ts`, with sitemap URL and disallow guidance for authentication and future private paths.
- Server-rendered semantic article content, descriptive anchors, breadcrumb navigation and crawlable internal links.
- Truthful JSON-LD: Organization/WebSite globally, SoftwareApplication where accurate, Article + BreadcrumbList on articles, Product/Offer only for visible one-time packs without ratings/reviews.
- Custom not-found page and no fabricated thin slug pages.

## Private route requirements

Prompt 2 applies `noindex, nofollow` to `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` and `/auth/callback`; all are excluded from the sitemap and disallowed in robots. Prompt 3 applies the same rule to every `/app` demo-workspace route and disallows `/app/`; these routes remain outside the sitemap. Future admin routes require the same discovery discipline plus separate authorization. Authentication/authorization remains mandatory before real private data; noindex and robots rules are not security.

## Content and on-page

One search intent per article, direct early answer, clear H2/H3 headings, original examples and internally linked next steps. Use natural variations rather than repeated exact-match keywords. Each article has a unique SERP title and meta description. Feature pages link to relevant guides and guides link back to features/pricing.

## Structured-data limits

No aggregate ratings, reviews, unverified awards or unsupported price claims. SoftwareApplication describes Orindle at a platform level; Offer values reflect visible one-time credit packs. Eligibility and display in search results are not guaranteed.

## Measurement after launch

Verify rendered tags, sitemap/robots, canonical host, index coverage and structured-data syntax. Use real Search Console and field performance data after deployment. Track useful engagement without invasive or unconsented analytics. Revalidate date-sensitive model content on a documented cadence.
