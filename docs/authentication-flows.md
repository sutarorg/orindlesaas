# Authentication flows

Status: **implemented Prompt 2 presentation/frontend contract; no live authentication**. Prompt 5 must replace mock adapters and the callback presentation page with current researched Supabase SSR behavior.

## Route and state inventory

| Route | Default purpose | Inspectable presentation states |
|---|---|---|
| `/login` | Email/password login UI, remember-me choice, recovery and OAuth options | `?state=invalid-credentials`, `?state=network-failure`, `?state=oauth-cancelled&provider=google`, `?state=session-expired` |
| `/signup` | Name/email/password/confirmation, terms and optional pack intent | `?state=already-registered`, `?state=verification-required`, `?pack=pro` |
| `/forgot-password` | Generic reset-request form | Local invalid-email state; submitted-preview result after valid local input |
| `/reset-password` | New-password/confirmation form | `?state=expired`; local weak-password and mismatch states |
| `/verify-email` | Verification-required explanation and resend preview | `?state=success`, `?state=expired` (both explicitly labelled as previews) |
| `/auth/callback` | Static callback presentation only | `?state=error`, `?state=cancelled`; no code exchange or session creation |

All query values are allowlisted. Unknown values fall back to the default presentation. The callback page does not read or echo `code`, `token`, `token_hash`, `next` or provider error parameters.

## Login

1. Render email and current-password fields, visibility control, optional remember-me, recovery link and planned Google/GitHub buttons.
2. On submit, validate required email format and password presence locally. Invalid email focuses the email field; empty password focuses the password field.
3. Call `mockAuthenticationService.signIn`. The mock waits only to make the loading presentation inspectable and returns `status: "preview"`.
4. Show: local validation passed; **no login request was sent, no remember-me preference was stored and no session was created**.
5. Invalid-credentials, network-failure, OAuth-cancellation and session-expired designs are available only through the documented allowlisted preview URLs. They do not identify whether an email is registered.

Future invalid-credential copy should remain generic: “Those details didn’t work. Check your email and password, or reset your password.” It should not reveal which field matched an account.

## Signup

1. Accept name, email, new password, password confirmation and unchecked terms acceptance. Preserve only allowlisted `creator|pro|studio` pack intent for display.
2. Validate name, email, 15–128-code-point password, matching confirmation and terms locally. Show password-length guidance without composition rules.
3. Call `mockAuthenticationService.signUp`; show that no account was created, no verification email was sent and no pack purchase/credit grant occurred.
4. The already-registered presentation says the email **may** already be registered and offers login/reset paths; it does not confirm account existence or authentication methods.
5. Verification-required presentation directs the reader to the verification route but explicitly notes that this frontend did not send an email.

## Forgot and reset password

- Forgot password validates email locally and returns the same generic preview regardless of whether an address could exist. It never says an inbox exists or an email was sent.
- The future production response can explain that, **if** the account is eligible, reset instructions will be sent. Supabase documents that reset requests do not reveal whether an account exists; preserve that behavior.
- Reset password validates the new password and confirmation, then returns a no-update preview. The expired presentation links back to forgot-password for a new request.
- Prompt 5 must verify the recovery session/callback using current Supabase SSR guidance before allowing password update. A public new-password form alone is not proof of recovery authorization.

## Email verification

- Default: verification-required instructions and an email resend-preview form. No email is sent or stored.
- Success: demonstrates the visual hierarchy for a confirmed verification while explicitly stating that no email was verified in the preview.
- Expired: offers a resend path without claiming the old link was actually checked.
- Prompt 5 must implement actual token/code verification in a researched server route and map outcomes to safe UI states. Do not render raw token hashes or provider payloads.

## OAuth

1. Google or GitHub button invokes `beginOAuth` on the mock with the provider and intended operation.
2. The result states that no provider was contacted, no consent screen opened, no redirect occurred and no account was accessed.
3. Cancellation presentation offers both OAuth retry and email alternatives without blame.
4. Prompt 5 must configure provider callbacks and exact redirect allowlists, use PKCE/server code exchange as applicable and never follow an arbitrary `next` URL.

## Callback

`/auth/callback` is intentionally a **page placeholder**, not a Route Handler. It shows a static processing presentation and recovery links without exchanging a code, writing cookies or redirecting. Prompt 5 should replace this placeholder with the appropriate researched `route.ts` implementation rather than assuming a page and handler can coexist at the same path.

## Logout, session and route protection contracts

These have typed frontend contracts but no operational UI in Prompt 2:

- `signOut` returns a preview and clears no cookie/local storage because none was created.
- `getSession` returns an unavailable snapshot with no user; it never invents an authenticated user.
- `requireRouteAccess` returns an unavailable access result. It is not a guard and cannot protect data.
- Session-expired copy is only a presentation state. Prompt 3 may use explicit mock user states for application-shell design but must not call them authorized sessions or expose real private data.

## Safe result convention

The mock returns only `preview` results. Future adapters may return typed success/error results, but raw provider messages, stack traces, tokens and account-existence details must not pass directly to the UI. Success copy is allowed only after the corresponding real server/provider operation succeeds.
