# Security of the OpenRouter integration

## `OPENROUTER_API_KEY`

- Server-only, read through `lib/server/env.ts`, never prefixed `NEXT_PUBLIC_`.
- Never sent to a browser, embedded in a client bundle, written to a log line or included in an error
  message. `makePublicError` strips provider detail before anything reaches a customer.
- Never used as an identifier. Logs reference generation IDs, not keys.
- Optional for public reads (`publicRead: true`), so catalogue discovery and QA do not require it —
  which also means the key's absence cannot be diagnosed by whether discovery works.

## Client-side routing is impossible by construction

There is no API surface that accepts a provider, provider slug, routing plan or `max_price` from a
request. Routing is assembled server-side from approved database rows (`openrouter-routing.md`). A
malicious client cannot pin a cheap provider to under-bill, or an expensive one to cause loss.

## Stored content

Generated images are validated against their magic bytes before storage, not merely base64-decoded
(`openrouter-image.md`). Without that check a provider response could store an HTML document under an
image extension, which a browser would later render from Orindle's origin. Downloads are byte-capped.

## Paid-call safety

- No automatic retry of an uncertain paid generation; `maxRetries: 0`, `streamRetries: 0`.
- `retryableReadOnly` is named so a paid path cannot plausibly reach for it.
- `max_price` bounds upstream spend to the quoted amount.
- `402` from OpenRouter means the **Orindle** account is out of credit; the public message must not
  suggest the customer's balance is empty.

## Catalogue and approval

Discovered models are created disabled and unapproved. Sync cannot enable or approve anything, so a
compromised upstream catalogue cannot make a model sellable by itself. Enabling requires an approved,
priced endpoint (`openrouter-admin.md`).

## Historical data

Legacy `gen_` IDs are never reinterpreted as OpenRouter IDs, and historical settlements keep their
`provider` and `costSource` labels. Attribution of past charges is preserved rather than rewritten.

## Outstanding

The hosted database has not had `0005` applied, and row level security has only been verified on a
disposable cluster. Hosted RLS behaviour under real Supabase roles is unverified.

## Related

- `openrouter-errors.md`, `openrouter-routing.md`, `openrouter-admin.md`
