# Handoff to Prompt 2 — Authentication frontend

**Status:** complete for the requested frontend-only scope on 2026-11-05.

**Branch:** `arena/f2c65e27-orindlesaas`, based on merged Prompt 1 PR #1 (`dfd8cb8`).

**Deferred:** Prompt 5 owns real Supabase Auth, OAuth redirects, email delivery, callback code exchange, cookies, sessions and server route protection.

## Implemented integration surface

| Area | Implemented behavior |
|---|---|
| `/login` | Noindex server page with allowlisted invalid-credential, network-failure, OAuth-cancelled and session-expired presentations. Client form validates email/password, supports password visibility and remember-me, and returns an explicit no-session preview result. |
| `/signup` | Noindex server page with name/email/password/confirmation/terms validation, passphrase guidance, independent visibility controls, OAuth UI and sign-in navigation. Allowlisted `?pack=creator|pro|studio` displays intent only. |
| `/forgot-password` | Noindex email validation and generic preview result. No reset request/email and no account-existence disclosure. |
| `/reset-password` | Noindex new-password/confirmation validation and an expired-link state with real recovery navigation. No password update or recovery session. |
| `/verify-email` | Noindex required/success/expired presentations and resend validation. Success copy explicitly says no email was verified; resend sends nothing. |
| `/auth/callback` | Noindex processing/error/cancellation presentation. It does not read code/token/next parameters, exchange codes, redirect or create sessions. |
| Discovery | All six routes are excluded from `app/sitemap.ts`; `app/robots.ts` disallows them. This is discovery control, not authorization. |

The old `components/marketing/auth-preview.tsx` was removed. Public header/mobile navigation and pricing pack URLs remain stable.

## Shared implementation imports

- `components/auth/auth-shell.tsx`: responsive premium-white shell and desktop brand/product aside.
- `components/auth/login-form.tsx`, `signup-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `verification-form.tsx`: local-only interactive flows.
- `components/auth/auth-form-field.tsx`, `password-input.tsx`, `password-guidance.tsx`, `auth-alert.tsx`, `auth-state-panel.tsx`, `oauth-buttons.tsx`: reusable accessible UI.
- `components/ui/input.tsx`, `label.tsx`, `checkbox.tsx`: shared native-control primitives.
- `components/brand/provider-icons.tsx`: inline Google/GitHub symbols; no remote brand assets.
- `lib/contracts/authentication.ts`: provider-neutral signup, login, logout, reset/update, verification/resend, OAuth/callback, session and route-access contracts.
- `lib/auth/validation.ts`: pure validation and Unicode password-length guidance.
- `lib/auth/preview-states.ts`: allowlisted state/provider/pack parsing and safe copy.
- `lib/mocks/authentication-preview.ts`: the only Prompt 2 adapter; returns preview/unavailable results only.

`MockAuthenticationAdapter` accepts an optional delay for tests. The exported browser adapter uses a 350ms local delay so loading feedback is inspectable. It performs no network request, cookie/storage write, console logging, email operation or provider redirect.

## UX and security decisions

The password guide is 15–128 Unicode code points, with a longer 20+ character passphrase target, paste/autofill/password-manager support and no arbitrary composition rules. Passwords are not trimmed or persisted. Terms and remember-me are unchecked by default. Failed validation associates errors with fields and focuses the first invalid control.

All mock success-like designs retain visible preview wording. Reset copy is generic whether or not an account exists. Signup says an email “may already be registered” rather than confirming an account. Arbitrary return URLs and token-like callback parameters are ignored. `getSession()` returns unavailable/no user and `requireRouteAccess()` returns unavailable; neither can authorize private data.

Current official Supabase, Next 16, WCAG/WAI and NIST sources are listed in `Research.md`. Revalidate them in Prompt 5 before implementing real server behavior; do not copy legacy Auth Helpers or treat Proxy as complete authorization.

## Final validation evidence

- Strict `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test:unit`: **7 files, 24/24 tests** (13 new authentication tests plus Prompt 1 regressions).
- `npm run build`: pass on Next 16.4.5; query-aware auth pages render on demand.
- Production Playwright: **40/40 tests**, including 24 authentication tests and all 16 public-site regressions.
- Auth axe scans: **13 routes/states, zero violations** for the selected WCAG 2/2.1/2.2 A/AA tags in Chromium.
- Responsive assertions: nine auth routes/states at 320, 390 and 1440px, **27/27 combinations without page overflow**.
- Visual inspection: login at 1440px, signup with Pro intent at 390px, verification success at 1280px and callback error at 390px; clean hierarchy, readable controls and honest preview notices observed.

Automated checks are not a WCAG certification. Real screen-reader, 200% zoom and real-device review remain later launch checks. No real authentication, email delivery, authorization, payment or deployment is claimed.

## Next handoff

`handoff-prompt3.md` contains the application-shell, user-state, navigation, shared workspace, security and validation requirements. Prompt 3 may build explicitly mocked shell presentations but must not treat the unavailable mock session as authorization or expose private data.
