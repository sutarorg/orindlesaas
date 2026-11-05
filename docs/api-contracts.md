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

## Dashboard frontend contract (Prompt 3)

`lib/contracts/dashboard.ts` defines the provider-neutral workspace boundary. The fixture adapter returns `DashboardPreviewResult` for every mutation-like operation:

```ts
type DashboardPreviewResult = {
  status: "preview" | "unavailable";
  message: string;
  persisted: false;
  creditsChanged: 0;
};

interface DashboardService {
  generate(request: GenerationIntentRequest): Promise<DashboardPreviewResult>;
  saveProject(request: SaveProjectRequest): Promise<DashboardPreviewResult>;
  deleteAsset(request: AssetActionRequest): Promise<DashboardPreviewResult>;
  downloadAsset(request: AssetActionRequest): Promise<DashboardPreviewResult>;
  purchaseCredits(request: PurchaseCreditsRequest): Promise<DashboardPreviewResult>;
  updateSettings(request: UpdateSettingsRequest): Promise<DashboardPreviewResult>;
  requestAccountDeletion(request: AccountDeletionRequest): Promise<DashboardPreviewResult>;
  saveWebsite(request: SaveWebsiteRequest): Promise<DashboardPreviewResult>;
  publishWebsite(request: PublishWebsiteRequest): Promise<DashboardPreviewResult>;
}
```

`GenerationIntentRequest` is a discriminated chat/image/video/website intent containing only user-entered configuration and a registry model ID. It has no provider key, authoritative credit price or callback URL. The mock never creates a job or output. `quoteGeneration` is a separate pure fixture estimator returning `kind: "fixture"`; it is not an endpoint or server quote.

Future chat transport maps provider UI message parts to display-safe text/code/file parts and explicit submitted/streaming/ready/error states. Stop/regenerate require real server semantics; client disconnect alone is not represented as cancelled generation. File uploads later require validated type/size, scanning as appropriate, ownership and signed storage URLs.

Future project/asset/wallet/settings/website endpoints must verify identity and per-object authorization, runtime-validate inputs and return safe DTOs. The server issues model availability and quotes, calculates final metered credits, handles idempotent payment fulfillment and controls publish/deployment. Browser fixture values are never accepted as balance, payment, ownership, progress or entitlement evidence.

## Administration frontend contract (Prompt 4)

`lib/contracts/admin.ts` defines the display-safe operations boundary. `AdminPreviewResult` returns only `preview`/`unavailable`, `persisted: false`, `auditPersisted: false`, `paymentChanged: false` and `creditsChanged: 0`. It cannot represent a successful real administration operation.

`AdminService` covers account status/session intent, provider/model configuration, model pricing, credit packages, payment reconciliation, credit adjustment, dispute review, job retry and admin preferences. Requests carry fixture IDs and operator-entered intent/reason only. Credit adjustment additionally requires category, ticket/reference, signed non-zero integer amount and an explicit confirmation step; its optional `auditPreview` is always non-persistent.

Future admin queries are server-bounded and permission-filtered. Future mutations require verified current admin membership, explicit route/action/field/object permissions, step-up evidence where required, runtime validation, idempotency, current-state checks and an attributable audit event. Raw provider/payment errors, secrets, customer prompts/files/code and unrestricted deployment identifiers never enter these DTOs.

`admin-data-contracts.md` defines the operational records and financial formulas; `admin-permissions.md` defines proposed permission bundles. Neither document is evidence that those controls exist.

## Common error envelope

Future endpoints use a safe error code/message, request correlation ID and appropriate HTTP status. Do not leak stack traces, provider payloads, secrets or internal cost. Mutations require CSRF/origin defenses as applicable, authentication, authorization, validation, rate limits and idempotency.

## Mock adapter rule

Local adapters are typed and prefixed/labelled as mocks. They may return `unavailable` or `preview` states for UI development, never `purchased`, `accountCreated`, `creditsAdded` or `messageSent` without a real server result.
