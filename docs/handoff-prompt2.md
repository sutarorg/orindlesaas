# Handoff to Prompt 2 — Authentication

**Prompt 1 status:** complete for the validated public frontend scope on 2026-11-05.  
**Prompt 2 status:** not started. No real authentication, session, cookie, account database or authorization behavior exists yet.

## Inherit without redesign

Use the premium-white Orindle system: white canvas, off-white secondary surfaces, charcoal ink, accessible dark teal `#067a67`, mint highlights and restrained cyan/blue/purple product accents. Poppins display + Inter body, Lucide icons, shadcn-compatible primitives and sparse motion are already configured. Reuse `Container`, `Logo`/`LogoMark`, `Button`, form styling patterns, focus rings and responsive navigation/footer rather than introducing a separate auth theme.

Content must remain visible without JavaScript. The current `MotionReveal` starts visible and adds only a small transform when motion is allowed; do not reintroduce hidden-by-default auth or marketing content. Preserve 44px primary targets, persistent labels, associated errors and keyboard/focus behavior.

## Exact Prompt 1 integration surface

| Area | Current implementation | Prompt 2 action |
|---|---|---|
| Login route | `app/login/page.tsx` exports noindex metadata and renders `<AuthPreview mode="login" />`. | Replace the preview with the researched real login flow; retain an explicit indexing decision. |
| Signup route | `app/signup/page.tsx` awaits `searchParams`, accepts an optional string `pack`, and renders `<AuthPreview mode="signup" packId={packId} />`. It is dynamic and noindex. | Replace preview behavior with real signup; preserve a valid selected pack only as display-safe intent. |
| Shared preview | `components/marketing/auth-preview.tsx` is a Server Component using `getCreditPack`, `formatNumber`, `Container`, `LogoMark` and `Button`. It has no auth form and makes no success claim. | Reuse the visual composition where useful, but remove stage-placeholder copy once real states exist. |
| Public entry points | `components/layout/site-header.tsx` and `components/layout/mobile-nav.tsx` link to `/login` and `/signup`. Product/pricing CTAs also link to `/signup` or `/signup?pack=...`. | Keep URLs stable where possible and add real pending/error/success behavior only from real responses. |
| Pack source | `lib/content/pricing.ts` defines Creator `$19/1,900`, Pro `$49/4,900`, Studio `$99/9,900` and `getCreditPack`. | Treat these as public display content, not proof of payment, entitlement or a server price configuration. |
| Metadata/helper | `lib/site.ts` provides `createMetadata({ noindex: true })` and canonical/OG metadata. | Preserve canonical public pages. All dashboard/private application routes must be noindex and server-authorized. |
| Frontend contracts | `lib/contracts/public-services.ts` contains contact DTOs and a `CheckoutService` preview interface only. | Do not mistake TypeScript interfaces for implemented services. Prompt 2 owns auth, not checkout fulfillment. |
| Environment | `.env.example` contains only `NEXT_PUBLIC_SITE_URL` and optional `NEXT_PUBLIC_CONTACT_EMAIL`. | Add only verified auth variable names/placeholders after current official research; never add secret values. |

There is currently no Supabase dependency, auth middleware, session callback, recovery route, verification handler, `/dashboard` route or auth integration test. The `CheckoutService` type is not wired to the preview. Contact has a separate local non-delivering adapter and must not be represented as transactional email.

## Prompt 2 scope

Implement real Supabase Auth only after researching current official Next.js App Router/Supabase SSR APIs and the actual newly installed versions. Expected flows include login, signup, password recovery/reset and verification states as required by the confirmed Supabase flow. Keep one-time credit packs unchanged; do not add subscriptions.

Official research on 2026-11-05 confirmed that legacy Supabase Auth Helpers are deprecated and current guidance points to `@supabase/ssr`. This is a research lead, not permission to guess client construction, cookie methods, middleware behavior, environment names or redirect URLs. Re-open current official documentation at implementation time and record exact installed versions/sources in `Research.md`.

## Required architecture and security

- Keep public marketing Server Components and existing canonical URLs intact. Isolate auth interactivity in small Client Components and verified server actions/route handlers/clients as appropriate.
- Follow current Supabase SSR session refresh and cookie guidance. Middleware/session refresh is not a substitute for server-side authorization on every private data operation.
- Use strict typed input validation, safe generic auth errors, verified redirect allowlists and appropriate rate limiting/abuse controls. Never put service-role keys, database secrets or privileged admin logic in browser code.
- Auth pages need real loading, empty, success and error states. Never show “account created”, “signed in”, “email sent” or “credits added” unless the corresponding server/provider operation actually succeeded.
- Preserve selected pack intent across auth only as an allowlisted `creator|pro|studio` value. A query parameter must never fulfill an order or grant credits. Payment/webhooks/wallet grants belong to the later payment stage.
- Coordinate the authenticated destination with Prompt 3. `/dashboard` does not exist in Prompt 1; do not redirect successful users to a fake or broken dashboard. Agree and implement an honest destination/handoff before enabling the flow.
- Apply `noindex, nofollow` to private dashboard/projects/assets/history/settings/admin routes and keep them out of the sitemap. Robots rules are not access control.
- Update `architecture.md`, `data-model.md`, `api-contracts.md`, `security-threat-model.md`, `environment-variables.md`, `route-inventory.md` and this handoff before/with implementation.

## Data and wallet boundary

Supabase owns identity only; a signed-in user is not evidence of a purchase or credit balance. Later wallet balances derive from an append-only server ledger. Never accept browser-supplied price, provider cost, credit amount, payment status or user ownership as authoritative. Do not create credit grants during signup unless a separately designed, authorized policy explicitly requires it; Prompt 1 defines no free-credit grant.

## Validation expected in Prompt 2

Add unit validation tests, auth integration tests against a safe test project, Playwright keyboard/flow tests, session/cookie and redirect review, recovery/verification tests, strict typecheck, lint and production build. Test expired/invalid sessions and unauthorized private access. Use safe test credentials/projects only; never test destructive actions against production or request credentials in chat.

Prompt 1's final baseline is: strict TypeScript pass, ESLint pass, 11/11 unit tests, production build pass, 16/16 production E2E tests, zero axe violations across 23 tested routes, and zero broken targets across 105 rendered internal links/fragments. Preserve these checks and extend them for real auth. Record actual new evidence in `progress.md` and `quality-assurance.md` rather than copying this baseline as Prompt 2 validation.
