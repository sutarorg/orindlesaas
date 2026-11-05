# Authentication design

Status: **implemented and validated for Prompt 2 on 2026-11-05**. Real Supabase authentication, provider redirects, email delivery, cookies and session handling remain Prompt 5 work.

## Experience goals

Authentication should feel like a natural continuation of the public Orindle website: calm, precise, trustworthy and uncomplicated. The interface reduces decisions without hiding important consequences. It does not use security theatre, artificial urgency, prechecked consent, fake provider activity or claims such as “bank-grade security.”

## Shared visual architecture

All auth routes reuse the root public header/footer, local Poppins/Inter fonts and existing tokens. A shared `AuthShell` provides:

- A white rounded workspace bordered with `line`, on a `soft` page background.
- A restrained charcoal desktop aside with the original Orindle mark, real HTML wordmark, a concise one-account/four-product explanation and four labelled product modes.
- A white form column with a back-to-website link, one H1, short supporting copy and a persistent frontend-preview notice.
- A single-column mobile layout without the decorative aside. Form controls remain at least 44px high, with 20px mobile gutters and no horizontal overflow.
- No separate auth color theme, glass treatment, generated photography, fake dashboard imagery or unnecessary animation.

The shell is informative rather than a trust badge. “One account. Four products.” describes the intended workspace; it does not claim an account or connected service already exists.

## Planned component boundaries

```text
components/auth/
  auth-shell.tsx                 Server-rendered shared composition
  auth-alert.tsx                 Typed info/error/success-preview messaging
  auth-form-field.tsx            Label, hint, error and described-by wiring
  password-input.tsx             Client visibility control; paste/autofill retained
  password-guidance.tsx          Length-based passphrase guidance, not a security score
  oauth-buttons.tsx              Planned Google/GitHub UI with explicit preview feedback
  login-form.tsx                 Local validation + mock login adapter
  signup-form.tsx                Local validation + mock signup adapter
  forgot-password-form.tsx       Generic reset-request preview
  reset-password-form.tsx        New-password validation preview
  verification-form.tsx          Verification resend preview and state panels
  auth-state-panel.tsx           Allowlisted presentation states
components/ui/
  input.tsx                      Shared input styling
  label.tsx                      Shared label styling
  checkbox.tsx                   Shared native checkbox styling
lib/
  contracts/authentication.ts    Provider-neutral auth/session/route-access contracts
  mocks/authentication-preview.ts Delayed, explicitly non-operational mock adapter
  auth/validation.ts             Pure local validation helpers
  auth/preview-states.ts         Allowlisted state/query parsing and safe copy
```

Pages remain Server Components where possible. They await request-time `searchParams`, allowlist presentation values and pass simple props into small Client Components. No auth secret, token, code or raw provider error is rendered or logged.

## Form design

- Every field has a persistent visible label, appropriate `name`, `id`, `type`, `inputMode` and `autoComplete` values. Placeholder examples never replace labels.
- Required fields are programmatically required and the form has concise instructions before entry.
- Validation runs on submit, errors appear beside their fields, `aria-invalid`/`aria-describedby` expose relationships and focus moves to the first invalid control. Editing clears that field's error without erasing helpful guidance.
- A form-level alert communicates mock completion or allowlisted presentation errors. Loading uses the existing button with a spinner and stable accessible name; the current action is disabled to prevent duplicate preview submissions.
- Email is trimmed for validation. Password whitespace is preserved. No password, remember-me preference or terms timestamp is persisted by the mock.
- Browser/password-manager autofill and paste remain enabled. Login uses `current-password`; signup/reset uses `new-password`; name/email use their standard tokens.

## Password UX

Current NIST SP 800-63B-4 guidance informs a frontend policy of **15–128 Unicode code points** for a password used as a single authentication factor. A short passphrase is suggested; there are no arbitrary uppercase, lowercase, number or symbol composition rules. Length is counted with Unicode code points rather than UTF-16 units. Prompt 5 must enforce a compatible server/provider policy and re-check current guidance.

Signup and reset include confirmation to prevent accidental mismatches, plus independent show/hide controls. Guidance reports length progress (“15 characters required”, “20+ is a useful longer-passphrase target”) rather than claiming a password is uncrackable or assigning a misleading security percentage.

## OAuth and consent

Google and GitHub remain planned options because they offer alternatives to password recall and are documented Supabase providers. Buttons say “Continue with Google/GitHub,” retain native keyboard behavior and call only the typed mock. Feedback states that no provider was contacted, no redirect occurred and no account was accessed. No provider logo implies a live integration.

Signup terms acceptance is unchecked by default and required before local preview completion. Login includes Terms/Privacy references without adding another consent checkbox. Remember me is optional, unchecked and labelled for private devices; this stage stores no preference.

## Preview-state presentation

Allowlisted `state` query values make server/error designs inspectable without inventing a backend. Every such page retains an explicit “component preview” notice. Verification-success and reset-request designs never claim an actual email was verified or sent. Invalid `state`, `provider`, `code`, `next` and token-like parameters are ignored; arbitrary return URLs are never followed.

## Accessibility and conversion acceptance

- Logical tab order, visible focus, native controls, 44px targets and keyboard-operable visibility/OAuth actions.
- Respectful errors that say what happened and how to proceed without disclosing account existence.
- No CAPTCHA, puzzle, countdown, disabled paste or forced password transcription.
- Authentication loading, validation, unavailable, cancellation and expiry states preserve layout stability.
- All auth routes use `noindex, nofollow` metadata and stay out of the sitemap. Noindex is presentation guidance, not route protection.
