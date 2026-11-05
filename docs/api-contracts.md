# API contracts

Prompt 1 implements no network backend. These contracts define later integration boundaries, not available endpoints.

## Public content and checkout handoff

```ts
type PublicCreditPack = {
  id: 'creator' | 'pro' | 'studio';
  name: string;
  priceUsd: 19 | 49 | 99;
  credits: 1900 | 4900 | 9900;
};

type CheckoutIntentRequest = { packId: PublicCreditPack['id'] };
type CheckoutIntentResponse = { checkoutUrl: string } | { error: { code: string; message: string } };
```

The browser sends only a pack ID. The server looks up active server-configured pack pricing, creates the provider checkout and returns a validated HTTPS checkout URL. It never accepts browser-supplied price, credits, internal cost or success status. Payment completion is established only by verified idempotent server webhooks.

## Contact handoff

```ts
type ContactRequest = { name: string; email: string; topic: string; message: string; website?: string };
type ContactResponse = { accepted: true; reference: string } | { accepted: false; error: { code: string; message: string } };
```

`website` is a honeypot. The future server validates lengths/formats, rate limits, sanitizes output and sends through Resend. `accepted` means accepted for delivery, not guaranteed inbox delivery. Until this exists, UI says no message was sent.

## AI usage handoff (Prompt 5)

```ts
type UsageQuote = { operationId: string; estimatedCredits: number; expiresAt: string };
type GenerationAccepted = { jobId: string; status: 'queued' };
```

A quote is informational and server-issued. Final deduction uses actual verified metered usage and the applicable server price version. The client cannot set credits, provider cost or model markup. Generation responses are job handles, not fabricated output.

## Authentication frontend contract (Prompt 2)

`lib/contracts/authentication.ts` is the provider-neutral boundary for the following operations:

```ts
interface AuthenticationService {
  signUp(request: SignUpRequest): Promise<AuthenticationResult>;
  signIn(request: SignInRequest): Promise<AuthenticationResult>;
  signOut(): Promise<AuthenticationResult>;
  requestPasswordReset(request: PasswordResetRequest): Promise<AuthenticationResult>;
  updatePassword(request: PasswordUpdateRequest): Promise<AuthenticationResult>;
  requestEmailVerification(request: EmailVerificationRequest): Promise<AuthenticationResult>;
  completeEmailVerification(request: AuthCallbackRequest): Promise<AuthenticationResult>;
  beginOAuth(request: OAuthRequest): Promise<OAuthStartResult>;
  completeOAuthCallback(request: AuthCallbackRequest): Promise<AuthenticationResult>;
  getSession(): Promise<SessionSnapshot>;
  requireRouteAccess(request: RouteAccessRequest): Promise<RouteAccessResult>;
}
```

Request DTOs contain only the required display-safe fields: name/email/password/confirmation/terms for signup; email/password/remember-me for login; email for reset/resend; new password/confirmation for update; provider + intended operation for OAuth; and an allowlisted internal path for future route access. Callback DTOs define optional code/next values for the future server adapter, but the Prompt 2 page/mock does not read, store or log them.

`AuthenticationResult` is a discriminated union of future `success`, safe `error` and current `preview` results. The mock returns only `preview`, with `session: null`. OAuth has a separate future `redirect` result whose URL must be validated server-side; the mock never returns it. Errors use safe codes such as `invalid_credentials`, `network_failure`, `verification_expired`, `reset_expired`, `oauth_cancelled` and `session_expired`, not raw provider messages.

`SessionSnapshot` distinguishes authenticated (future display-safe user/expiry), anonymous, expired and unavailable states. The mock returns unavailable without a user. `RouteAccessResult` distinguishes future allowed/denied/expired outcomes from current unavailable; an unavailable/mock result is not permission to render private data.

Prompt 5 must map current Supabase responses to these safe UI contracts in server-appropriate adapters, revalidate all inputs, align password policy and never serialize auth tokens, raw provider payloads or secrets. Frontend validation is not authoritative.

## Common error envelope

Future endpoints use a safe error code/message, request correlation ID and appropriate HTTP status. Do not leak stack traces, provider payloads, secrets or internal cost. Mutations require CSRF/origin defenses as applicable, authentication, authorization, validation, rate limits and idempotency.

## Mock adapter rule

Local adapters are typed and prefixed/labelled as mocks. They may return `unavailable` or `preview` states for UI development, never `purchased`, `accountCreated`, `creditsAdded` or `messageSent` without a real server result.
