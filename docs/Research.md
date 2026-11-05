# Research

Access date for all sources below: **2026-11-05**. Research is revalidated when relevant packages or providers change.

## Available tools and skills

The environment provides repository inspection/editing, shell, web research, image generation/search, browser-process and test tools. No separate named UI/UX, accessibility, SEO, security or architecture skill registry is exposed in this session, so no unavailable skill is claimed. The work applies those disciplines directly and validates them with lint, type checks, unit tests, production build and real Chromium inspection. Image generation was available but was not needed: semantic HTML/CSS/SVG explains the product workflows without fake screenshots or embedded interface copy.

## Framework and official technical references

| Topic | Source | Finding applied |
|---|---|---|
| Next.js installation | https://nextjs.org/docs/app/getting-started/installation | Next 16 manual setup, Node >=20.9, TypeScript >=5.1 and current build defaults checked before scaffolding. |
| Next.js Metadata API | https://nextjs.org/docs/app/getting-started/metadata-and-og-images | Static metadata and `generateMetadata` belong in Server Components; file conventions support OG images, sitemap and robots. |
| Next.js project structure | https://nextjs.org/docs/app/getting-started/project-structure | App Router colocation and route segments support feature-organized public pages. |
| Next.js production checklist | https://nextjs.org/docs/app/guides/production-checklist | Optimized fonts, explicit error states and accessibility guidance applied; lint runs separately from build. |
| Next.js ESLint configuration | https://nextjs.org/docs/app/api-reference/config/eslint | Current Next 16 ESLint setup and explicit ESLint 10 support checked rather than inferred. |
| Robots metadata | https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots | `app/robots.ts` returns a typed `MetadataRoute.Robots`; private path disallow rules complement, not replace, `noindex`. |
| Sitemap metadata | https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap | `app/sitemap.ts` returns typed route entries from the same public content source. |
| Font optimization | https://nextjs.org/docs/app/getting-started/fonts | `next/font` self-hosts font assets and avoids runtime third-party font requests. |
| Image optimization | https://nextjs.org/docs/app/api-reference/components/image | Reserve dimensions and provide meaningful alternatives; semantic visuals avoid unnecessary raster payloads. |
| Supabase SSR for the next stage | https://supabase.com/docs/guides/auth/auth-helpers/nextjs?language=ts and https://supabase.com/docs/guides/auth/choosing-a-server-package | Legacy Auth Helpers are deprecated; Prompt 2 must research and install current `@supabase/ssr` APIs rather than copying legacy examples. |
| Core Web Vitals | https://web.dev/articles/vitals | Good 75th-percentile field targets: LCP <=2.5s, INP <=200ms, CLS <=0.1, segmented for mobile and desktop. |
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ | Semantic structure, keyboard access, visible focus, sufficient contrast and reduced-motion support guide implementation. |
| Target size | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | WCAG 2.2 AA target-size minimum is 24x24 CSS px with exceptions; Orindle aims for 44px primary controls. |
| Structured data | https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data | Structured data describes visible truthful content and does not guarantee ranking. |
| Article structured data | https://developers.google.com/search/docs/appearance/structured-data/article | Article markup uses real headline, dates, author and page values. |
| Google Search foundations | https://developers.google.com/search/docs/fundamentals/seo-starter-guide and https://developers.google.com/search/docs/essentials | People-first content, crawlable links and technical foundations applied; no ranking guarantee. |
| AI search guidance | https://developers.google.com/search/docs/ai-optimization-guide | No special AI-search schema or unsupported optimization trick is required. |

## Exact installed runtime and tooling

The following versions were read from the installed tree/lockfile and validated on **2026-11-05**, not inferred from registry “latest” values.

| Tool/package | Installed version |
|---|---|
| Node / npm | 22.22.3 / 10.9.8 |
| Next.js / `eslint-config-next` | 16.4.5 / 16.4.5 |
| React / React DOM | 19.3.1 / 19.3.1 |
| TypeScript | 5.9.3 |
| Tailwind CSS / `@tailwindcss/postcss` / PostCSS | 4.3.4 / 4.3.4 / 8.5.32 |
| Framer Motion | 14.9.1 |
| Lucide React | 1.69.0 |
| Radix Accordion / Dialog / Dropdown Menu / Slot | 1.3.1 / 1.3.1 / 2.2.1 / 1.3.1 |
| Fontsource Inter variable / Poppins | 5.3.0 / 5.3.0 |
| Vitest / Vite / jsdom | 5.1.0 / 8.3.6 / 30.1.3 |
| Playwright / `@axe-core/playwright` | 1.64.1 / 4.14.0 |
| ESLint | 10.14.0 |
| Optional dev-only `@sparticuz/chromium` | 153.0.0 |

TypeScript 7.0.2 appeared during registry research but was not selected merely because it was newer. The installed, compatible TypeScript 5.9.3 passed the repository checks. Scoped Minimatch overrides use 11.0.4; the final `npm audit --audit-level=high` reported zero vulnerabilities.

The packaged Chromium fallback is test tooling only. The normal path remains Playwright's managed Chromium. In this sandbox the CDN browser download failed, so the npm package supplied the binary; its bundled Amazon Linux libraries were extracted and exposed with `LD_LIBRARY_PATH`. Local test launch disables graphics and removes serverless-only single-process flags for stability. No Chromium binary or extracted library is committed to Git.

## Design research and direction

References are used for principles, not copied layouts or assets:

- https://www.nngroup.com/articles/aesthetic-usability-effect/ — polished presentation can support perceived usability, but cannot compensate for unclear flows.
- https://www.nngroup.com/articles/how-users-read-on-the-web/ — scannable headings, concise summaries and front-loaded meaning support reading behavior.
- https://lawsofux.com/hicks-law/ — compact navigation and progressive disclosure reduce unnecessary choice complexity.
- https://lawsofux.com/aesthetic-usability-effect/ — visual consistency and considered spacing support trust.

The implemented direction is editorial premium-white: charcoal typography, fine borders, mint/teal accents and product-specific compositions. Repeated generic card grids, decorative gradients and unsupported social proof were rejected. Browser inspection led to darker accessible teal text, wrapping long CTAs, `minmax(0, 1fr)` article tracks and reveals that never hide content by default.

## Content and provider research

All six article briefs now include search intent, related questions, competitor coverage/gaps, primary sources and changing-capability notes in `blog-content-strategy.md`. Official OpenAI, Anthropic, Google/Gemini and Google Cloud video documentation informs capability language. NIST AI RMF resources support risk-aware small-business guidance; FTC guidance supports avoiding unsubstantiated performance, earnings and refund claims. Competitor articles informed intent and gaps only—not rankings, prices, benchmarks or savings claims.

The six implemented articles use task-based model evaluation rather than a timeless winner, structured visual prompting, shot-based video planning, website launch quality checks and risk-aware content systems. Exact fast-changing model IDs are deliberately not presented as connected Orindle availability.

## Frontend-stage provider boundary

Supabase, Drizzle, Vercel AI Gateway/SDK, R2, Inngest, E2B, Vercel deployment, Dodo Payments, Upstash and Resend remain later-stage integrations. None is integrated in Prompt 1. No provider API field, model ID, webhook field or metered price is guessed. Public CTAs use real local destinations or explicit preview behavior; they do not simulate successful account creation, payment, email delivery or AI generation.
