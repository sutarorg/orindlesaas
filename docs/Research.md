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
| Supabase SSR for the next stage | https://supabase.com/docs/guides/auth/auth-helpers/nextjs?language=ts and https://supabase.com/docs/guides/auth/choosing-a-server-package | Legacy Auth Helpers are deprecated; Prompt 5 must research and install current `@supabase/ssr` APIs rather than copying legacy examples. |
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

## Prompt 2 authentication UX and routing research

Research performed **2026-11-05**, before authentication application code. Supabase packages were not installed and no provider integration was made.

| Topic | Official source | Finding applied to the frontend contract |
|---|---|---|
| Supabase password auth | https://supabase.com/docs/guides/auth/passwords | Hosted email confirmation is configurable/default-on; SSR uses PKCE. Reset requests deliberately do not reveal whether an account exists. Reset and signup emails require real email infrastructure; this stage cannot claim delivery. |
| Supabase general configuration | https://supabase.com/docs/guides/auth/general-configuration | Email confirmation behavior is a project setting, so verification UI must handle required/success/expired states without assuming a fixed backend configuration. |
| Supabase auth testing | https://supabase.com/docs/guides/auth/testing-auth-flows | Local/test email behavior and rate limits differ from hosted projects. Prompt 5 must use safe local/test projects rather than fake delivery in the public frontend. |
| Google OAuth | https://supabase.com/docs/guides/auth/social-sign-in/auth-google | OAuth requires real provider setup, allowlisted redirects and a server code-exchange step for PKCE. Google UI is retained as planned only. |
| GitHub OAuth and sign-out | https://supabase.com/docs/guides/auth/social-sign-in/auth-github | GitHub has equivalent provider/callback requirements; its official guide also documents real sign-out. GitHub UI remains a mock with no redirect. |
| Redirect URLs | https://supabase.com/docs/guides/auth/redirect-urls | Email/OAuth redirect targets must match configured allowlists; exact production paths are preferred. Arbitrary `next` URLs are not accepted by the presentation layer. |
| Supabase SSR for Next.js | https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs | Current guidance uses `@supabase/ssr` + `supabase-js`, cookie-based sessions and Next 16 `proxy.ts` for refresh. Server protection uses verified claims; do not trust cookie reads or Proxy alone. Implementation is deferred to Prompt 5. |
| Next.js page `searchParams` | https://nextjs.org/docs/app/api-reference/file-conventions/page | In the installed Next 16 line, page `searchParams` is a Promise/request-time API. Server pages await it and allowlist only presentation-state values. |
| Next.js Route Handlers | https://nextjs.org/docs/app/api-reference/file-conventions/route | Real future callback work belongs in a verified Route Handler; the Prompt 2 `page.tsx` is only a placeholder and does not exchange codes. |
| Next.js 16 Proxy | https://nextjs.org/docs/app/getting-started/proxy | Middleware is now called Proxy. Proxy can help with request handling but is not a complete session-management or authorization solution. |
| WCAG 2.2 Accessible Authentication | https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html | Password-manager autofill and copy/paste are valid mechanisms to reduce cognitive burden. No CAPTCHA, puzzle, transcription requirement or disabled paste is introduced; planned OAuth offers an alternative once connected. |
| WAI form instructions | https://www.w3.org/WAI/tutorials/forms/instructions/ | Persistent labels and instructions associated through `aria-describedby` are required; placeholder text is not a label. |
| WAI validation and notifications | https://www.w3.org/WAI/tutorials/forms/validation/ and https://www.w3.org/WAI/tutorials/forms/notifications/ | Client validation improves UX but does not replace future server validation. Errors need clear correction guidance, field association, prominent notification and first-invalid-focus behavior. |
| NIST SP 800-63B-4 | https://pages.nist.gov/800-63-4/sp800-63b.html | Current final guidance requires 15 characters for a password used as a single factor, permits at least 64, supports printing characters/spaces/Unicode and requires password-manager/autofill support. Orindle adopts a 15–128 Unicode-code-point frontend guide with no composition rules; Prompt 5 must align server policy. |

The staging in the earlier handoff has been clarified by the current requirement: **Prompt 2 is frontend-only; Prompt 5 owns actual Supabase authentication and session handling**. The research above informs contracts and UX only; no Supabase method, environment variable, callback field or cookie behavior is implemented by assumption.

## Prompt 3 dashboard, AI UI and responsive research

Research performed **2026-11-05**, before dashboard application code. No AI SDK, Monaco, provider SDK or backend package was installed.

| Topic | Official source | Finding applied to Prompt 3 |
|---|---|---|
| Next.js layouts/pages | https://nextjs.org/docs/app/getting-started/layouts-and-pages | Nested layouts preserve shared UI and support isolated dashboard chrome. Dynamic route params are Promises and are awaited. A URL-neutral `(site)` group separates public/auth chrome from `/app`. |
| Next.js dynamic segments | https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes | Conversation/website params are request values requiring typed lookup and not-found behavior; arbitrary IDs must not fabricate fixture content. |
| shadcn/ui sidebar | https://ui.shadcn.com/docs/components/base/sidebar | Current composition separates provider, header/content/footer, grouped menus, inset and trigger. Orindle applies the same responsibilities with existing primitives rather than importing a generic admin theme. |
| shadcn/ui AI Elements | https://ui.shadcn.com/docs/ai-elements/base/prompt-input and https://ui.shadcn.com/docs/ai-elements/base/model-selector | Prompt input and model selection are distinct task components with attachments/actions and registry-driven model information. The dashboard builds these patterns with native accessible controls. |
| AI SDK UI chatbot | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot | Current UI messages use typed `parts`; statuses distinguish submitted, streaming, ready and error. Stop and regenerate are separate actions, and attachments require explicit file handling. Prompt 3 mirrors state distinctions locally without installing/calling the SDK. |
| AI SDK UI stream resumption | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams | Aborting a client stream is not necessarily cancelling real generation. Prompt 5 must use an explicit server stop operation where supported; Prompt 3 stop only changes a labelled local preview. |
| WCAG 2.2 reflow | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | Content and functionality must remain available at 320 CSS px without two-dimensional page scrolling, except genuinely two-dimensional regions. Dashboard panels stack/switch views and tables use scoped accessible treatment. |
| OpenAI model registry | https://platform.openai.com/docs/models | `gpt-6.1-sol` and `gpt-image-2.5-sunburst` are documented current IDs at research time. They appear only as catalogue fixtures, not connected Orindle availability. |
| Anthropic model registry | https://docs.anthropic.com/en/docs/about-claude/models/overview and https://docs.anthropic.com/en/api/models-list | `claude-opus-5-5` is documented with current Claude capabilities; registry display avoids claiming provider access. |
| Gemini text/image registries | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash and https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image | `gemini-3.8-flash` and `gemini-3.1-flash-image` are documented IDs with typed modality/context information. Capabilities are presentation data only. |
| Gemini video registry | https://ai.google.dev/gemini-api/docs/models/gemini-omni-flash | `gemini-omni-1.1-flash` is the current documented video ID; official guidance describes text/image/video input, video output and 3–10s/360p–4K constraints. The fixture duration/resolution options follow these documented bounds without submitting jobs. |

Model IDs and capabilities are date-sensitive research, not live Orindle availability. Prompt 5 must query/revalidate the actual provider/gateway registry and server configuration before integration. Credit estimates in Prompt 3 are deterministic fixture illustrations, not provider prices or server quotes.

## Prompt 4 administration UX, tables, accessibility and authorization research

Research performed **2026-11-05**, before admin application code. No table/chart/RBAC/database package was installed and no live admin endpoint exists.

| Topic | Official source | Finding applied to Prompt 4 |
|---|---|---|
| Native table vs ARIA grid | https://www.w3.org/WAI/ARIA/apg/patterns/table/ and https://www.w3.org/WAI/ARIA/apg/patterns/grid/ | A table is static tabular structure; a grid is a composite widget requiring author-managed directional focus. Orindle uses native tables and ordinary tabbable controls rather than claiming incomplete grid keyboard behavior. |
| Table headers and relationships | https://www.w3.org/WAI/tutorials/tables/ | Real `th`/`td` structure, column scope and captions preserve context for assistive technology. Wide admin tables keep these semantics inside named scroll regions. |
| Sortable table state | https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/ | If column sorting is added, the sorted header owns the appropriate `aria-sort`; visual icons alone are insufficient. Prompt 4 may use explicit labelled sort controls instead. |
| Modal focus and destructive actions | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ | Dialogs contain focus, close with Escape and return focus to their invoker. For difficult-to-reverse actions, initial/final focus should favor the least destructive choice. Radix primitives plus two-step review implement this direction. |
| Status announcements | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | Search/filter result counts and no-operation feedback use programmatic status messages without unnecessary focus changes. |
| Accessible complex visuals | https://www.w3.org/WAI/tutorials/images/complex/ | Charts need concise descriptions and structured equivalents where values/relationships matter. Admin charts include text summaries and expandable data tables. |
| Data-table anatomy | https://carbondesignsystem.com/components/data-table/usage/ | Title/description, nearby toolbar, consistent headers/rows, progressive detail disclosure and bottom pagination organize resource-heavy admin views. |
| Table/toolbar responsive behavior | https://www.patternfly.org/components/table/design-guidelines/ and https://www.patternfly.org/components/toolbar/design-guidelines/ | Tables fit structured row/column data; actions stay at the end, filters stay near results, filtered item counts remain visible and mobile toolbars collapse/wrap without losing actions. |
| Chart axes and missing data | https://carbondesignsystem.com/data-visualization/axes-and-labels/ | Comparison bars start at zero, time increments stay consistent and unavailable periods remain labelled gaps rather than interpolated success. |
| Chart legends and labels | https://carbondesignsystem.com/data-visualization/legends/ | Direct labels and clear language reduce visual association work; legends are used only when multiple series require them and do not disappear on mobile. |
| Admin accessibility review | https://www.patternfly.org/accessibility/overview/ and https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | Keyboard parity, visible focus, non-color status cues, scalable text, status messages and 320px reflow are route-level acceptance checks, not library assumptions. |
| Least-privilege administration | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | Proposed admin roles are server-enforced permission bundles with least privilege, deny-by-default and per-operation/object tests. Client visibility is never authorization. |
| Audit and operational logging | https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html | Privileged audit events need attributable actor/action/target/outcome context, careful redaction and access-controlled storage; operational and security logs have different purposes. Prompt 4 shows only non-persistent audit previews. |

The chosen IA groups Command, AI operations, Revenue operations and System around operator tasks. This avoids duplicating the customer shell, limits toolbar actions and uses global fixture search/breadcrumbs for wayfinding. Financial visualizations are qualified as deterministic demo data throughout; research does not supply or justify any Orindle performance claim.
