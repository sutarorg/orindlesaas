# Handoff to Prompt 3 — Application shell and shared workspace

Status: **complete handoff for the frontend application shell**. Prompt 2 implements six authentication routes, accessible forms and typed preview contracts only. Real Supabase sessions, server authorization and persistent workspace data remain later work; Prompt 5 owns the real auth/session integration.

## Inherit the design system

Use the existing premium-white canvas, `#f7f9f8` soft surfaces, `#151918` ink, `#4f5d58` body, `#64716c` muted text, `#dfe7e3` borders, `#067a67` teal actions, `#bdf5dd` mint highlights and restrained product accents. Poppins is the display face, Inter is body/UI. Reuse `Container`, `Logo`, `Button`, shared input/label/checkbox primitives, auth alerts, focus rings and responsive behavior. Do not introduce a dark application theme or a separate admin visual language.

Application density may be higher than marketing, but targets remain keyboard accessible, touch friendly and readable. Content must not depend on opacity-hidden reveals. Keep exactly four products: Orindle Chat, Orindle Image Studio, Orindle Video Studio and Orindle Websites.

## Application shell requirements

Design a centralized workspace shell with:

- Clear product/workspace navigation, a consistent page title area and a useful primary action for the current context.
- Shared entry points for projects, assets, usage history, wallet/credits and settings. Do not create separate wallets or disconnected asset libraries per product.
- Responsive desktop navigation and a keyboard-safe mobile disclosure with Escape/focus return.
- User-state area that can represent loading, unavailable, signed-out and explicitly mocked signed-in previews without claiming a real session.
- Loading, empty, error, expired-session and unauthorized presentation states. Empty states should explain the next useful action rather than fabricate projects/assets.
- `noindex, nofollow` metadata on every private application route and exclusion from the public sitemap. Robots rules are not access control.

Suggested frontend routes remain `/dashboard`, `/projects`, `/assets`, `/history` and `/settings`; finalize the route inventory before coding. Do not create `/admin` merely for visual symmetry. Admin separation requires a later explicit role/authorization design.

## User-state assumptions and limits

Prompt 2's mock `getSession` returns an unavailable session with no user. There is no Supabase package, auth cookie, provider token, account database or authorized `/dashboard` destination yet.

Prompt 3 may define a separate, clearly labelled application-shell fixture for visual states, but it must not:

- Call a fixture an authenticated/authorized session.
- Persist a mock user or use it to expose real private data.
- Infer admin role, wallet ownership or entitlement from browser state.
- Claim route protection exists because a client component hides content.

Real private-data protection must be enforced on the server in Prompt 5 using current Supabase SSR guidance. Current official guidance for Next.js 16 uses `proxy.ts` for token refresh and verified claims for server checks; Proxy alone is not a complete authorization solution. Re-research at implementation time rather than copying this note as code.

## Authentication integration surface

Prompt 2 documents and implements these frontend files:

- `lib/contracts/authentication.ts`: provider-neutral signup, login, logout, password reset/update, email verification, OAuth, callback, session and route-access types.
- `lib/mocks/authentication-preview.ts`: explicit preview-only adapter; no successful auth/session results.
- `lib/auth/validation.ts`: local email/name/password/confirmation/terms validation.
- `lib/auth/preview-states.ts`: allowlisted presentation-state parsing and safe copy.
- `components/auth/`: shared shell, forms, password controls/guidance, OAuth buttons and state panels.
- Routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auth/callback`.

The callback is presentation only and performs no code exchange. Prompt 5 replaces it with the appropriate researched server route. Preserve safe internal navigation, but do not accept arbitrary `next` URLs.

## Shared workspace contracts

Define display-safe DTOs for projects, assets, usage and wallet presentation before building views. All real balances, usage history and entitlements must later be server-issued. The browser cannot set provider cost, operation price, deduction, purchase status, credit grant or ownership. A selected credit pack remains display intent only until verified payment fulfillment.

Later shared entities include projects, assets, conversations, generations, website projects, wallets, append-only credit ledger entries, credit purchases, usage events, model price versions and background jobs. Every object needs an owning user/workspace and server authorization. Do not expose internal provider cost, secret object keys, unrestricted deployment identifiers or raw webhook/provider payloads.

## UX and accessibility requirements

- Preserve one H1 per view, logical landmarks/headings, visible labels, associated errors and meaningful empty/action copy.
- Test keyboard navigation, mobile menus, forms, loading announcements, focus placement and session-expired recovery.
- Use real HTML labels and original semantic diagrams; no fake screenshots, fake customer activity or invented usage numbers.
- Keep responsive layouts at 320, 390, 768, 1024 and 1440px without page overflow. Tables use labelled horizontal regions only where necessary.
- No artificial countdowns, fake online presence, deceptive checkboxes or “secure” claims unsupported by implemented controls.

## Prompt 2 verified baseline

Prompt 2 passed strict TypeScript, ESLint, 24/24 unit/component tests, production build and 40/40 production Playwright tests. Thirteen auth route/state axe scans reported zero violations; 27 mobile/desktop auth overflow combinations passed. Representative desktop/mobile auth states were visually inspected. These results cover frontend behavior only, not real sessions, server authorization or private data.

## Validation and documentation expected

Before implementation, update `architecture.md`, `data-model.md`, `api-contracts.md`, `route-inventory.md`, `page-requirements.md`, `security-threat-model.md`, `testing-strategy.md` and this handoff with actual Prompt 2 behavior. Add unit/component/E2E tests for shell states and navigation while retaining Prompt 1/2 regressions. Run strict TypeScript, ESLint, unit tests, production build, responsive/axe browser checks and visual inspection.

Record actual evidence in `progress.md` and `quality-assurance.md`. Do not mark real authentication, authorization, persistence, payments or deployment complete until the corresponding real integration and tests exist.
