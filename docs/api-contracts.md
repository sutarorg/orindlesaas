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

## Common error envelope

Future endpoints use a safe error code/message, request correlation ID and appropriate HTTP status. Do not leak stack traces, provider payloads, secrets or internal cost. Mutations require CSRF/origin defenses as applicable, authentication, authorization, validation, rate limits and idempotency.

## Mock adapter rule

Local adapters are typed and prefixed/labelled as mocks. They may return `unavailable` or `preview` states for UI development, never `purchased`, `accountCreated`, `creditsAdded` or `messageSent` without a real server result.
