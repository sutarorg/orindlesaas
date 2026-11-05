# Decisions

## D001 — App Router with server-first content

**Status:** accepted for Prompt 1. Use Next.js App Router, React and strict TypeScript. Keep articles and marketing sections server-rendered; isolate interaction in small Client Components. This supports crawlability and limits client JavaScript.

## D002 — Premium-white editorial system

**Status:** accepted. Pure white is dominant, with off-white surfaces, charcoal text and restrained mint/teal accents. Product colors aid navigation but do not become large gradient washes. Poppins handles display text and Inter body/UI text.

## D003 — Semantic product illustrations over fake screenshots

**Status:** accepted. Build original HTML/CSS/SVG compositions that explain workflows. Label conceptual interface visuals where necessary; do not imply they are production telemetry, customer output or live application screens.

## D004 — Local structured article source

**Status:** accepted for this stage. Typed article data includes slug, SEO fields, dates, author, reading time and structured sections. The same source drives listings, article rendering, metadata, internal links, sitemap and JSON-LD. A CMS can replace the repository later without changing public URLs.

## D005 — No simulated transactions

**Status:** accepted. Account CTAs point to future auth routes only if those routes provide an honest stage message, otherwise to contact/pricing. Purchase buttons never show success. A mock adapter may describe a future integration but cannot claim an email, account or payment was completed.

## D006 — Credit arithmetic

**Status:** accepted. 100 credits = $1 customer-facing usage value. Pack prices map exactly to their listed credits. AI operation credits are later calculated server-side from verified metered cost ×2, with $0.01→2 credits and $1→200 credits as examples. Public copy does not expose provider cost.

## D007 — Model availability language

**Status:** accepted. Model/provider pages distinguish planned workspace access from verified implemented integrations. Prompt 1 has no live AI integration, so catalog language must not imply generation is currently available.

## D008 — Compatibility risk document

**Status:** accepted. Maintain `mistakesthatmayoccurandpriorty.md` as an exact compatibility copy of the correctly spelled primary document.

## D009 — Package selection

**Status:** accepted and validated on 2026-11-05. Exact installed versions are recorded in `Research.md` and pinned in `package.json`/the lockfile. TypeScript 5.9.3 was selected and validated rather than adopting a newer registry version by assumption. Scoped Minimatch 11.0.4 overrides and PostCSS 8.5.32 resolved the observed audit findings; the final audit reports zero vulnerabilities.

## D010 — Progressive, non-hiding motion

**Status:** accepted after browser inspection. Reveal content is visible by default with `initial={false}`. Allowed motion is a small transform keyframe; reduced motion removes the animation without leaving transparent content. This preserves server-rendered reading, no-JavaScript visibility and predictable accessibility scans.

## D011 — Honest noindex auth previews

**Status:** accepted for Prompt 1 only. `/login` and `/signup` are real noindex routes that explain the unavailable service instead of producing dead CTAs or fake success. `/signup?pack=...` may display a recognized pack as intent, but it never starts checkout or grants credits. Prompt 2 replaces these static previews with complete frontend authentication experiences; Prompt 5 owns real authentication behavior.

## D012 — Authentication staging clarified

**Status:** accepted for the current Prompt 2 requirement, superseding the earlier real-auth-in-Prompt-2 plan. Prompt 2 delivers the complete authentication frontend, local validation, typed provider-neutral contracts and explicit mocks. Prompt 5 owns Supabase, OAuth provider redirects, email delivery, callback code exchange, cookies, sessions and server route protection. No auth SDK or secret is added in Prompt 2.

## D013 — Passphrase-oriented password UX

**Status:** accepted after current NIST research. Frontend signup/reset validation uses 15–128 Unicode code points, preserves password whitespace, supports paste/password managers and imposes no arbitrary character-composition rules. Confirmation prevents mismatch; independent visibility controls aid correction. Prompt 5 must align the actual provider/server policy and revalidate all inputs.

## D014 — Allowlisted presentation states

**Status:** accepted. Required server/error designs are inspectable through documented `state`/provider query values parsed against explicit allowlists. Callback/token-like parameters and arbitrary return URLs are ignored. Success-state designs always retain a visible preview disclaimer so they cannot be mistaken for real verification, email or session operations.
