# Security threat model

## Prompt 1/2 assets and trust boundaries

The public site exposes only static content and public configuration. The main current risks are misleading integration states, unsafe links/dynamic HTML, canonical host poisoning and future secret leakage. Typed article content is trusted source code; do not render arbitrary HTML with `dangerouslySetInnerHTML`.

| Threat | Impact | Mitigation |
|---|---|---|
| XSS through article/contact content | Session/user compromise in later stages | Structured React content, no raw HTML; server validation and output encoding later |
| Malicious return/checkout URL | Phishing/open redirect | No return-url flow now; later allowlist paths and validate provider HTTPS URLs |
| Contact spam/abuse | Email cost/reputation | No live form now; later Upstash limits, honeypot, validation and abuse monitoring |
| Secret in client bundle | Provider/payment compromise | No secrets in this stage; server-only modules and env review later |
| Fake payment/account success | User deception and support risk | Honest CTAs and mock states; webhook-only payment completion later |
| Canonical host injection | SEO poisoning | Static config and `metadataBase`, not untrusted request host |
| Dependency vulnerabilities | Site/build compromise | Lockfile, audit, updates and minimal dependencies |

## Prompt 2 authentication frontend threats

| Threat | Impact | Prompt 2 mitigation | Prompt 5 requirement |
|---|---|---|---|
| Account enumeration through signup/reset copy | Privacy leakage and targeted attacks | Generic reset result; “may already be registered” signup presentation; no account lookup exists | Map provider outcomes to safe copy and preserve non-enumerating reset behavior |
| Mock success mistaken for real auth | User deception and unsafe downstream assumptions | Mock returns only `preview`; persistent no-session/no-email/no-account notices | Success only after real server/provider confirmation |
| Arbitrary OAuth/email redirect | Phishing/open redirect | Ignore `next`, code and token-like parameters; no redirects in this stage | Exact production redirect allowlists and safe relative-path validation |
| Password handling/persistence | Credential exposure | No network/storage/logging; local React state only; paste/autofill retained; no composition rules | TLS, current Supabase SDK, server/provider policy, no raw password logs |
| Raw token/code/provider error disclosure | Session/token compromise or information leakage | Callback ignores and never echoes these parameters | Exchange server-side, redact logs and map errors to safe codes |
| Client-side route guard treated as authorization | Private data exposure | `requireRouteAccess` mock explicitly unavailable; no private data/routes | Verified server claims plus per-object authorization; Proxy is not sufficient |
| OAuth cancellation/provider failure | Confusing recovery or false provider status | Planned buttons report no contact/redirect; cancellation is an explicit preview | Handle provider callback errors safely without exposing payloads |
| Rate-limit/email abuse | Cost, harassment and service degradation | No live endpoints or email delivery | Appropriate provider/server limits, generic responses and monitoring |
| Session expiry/cookie forgery | Account takeover or confusing logouts | Session states are presentational only; no cookies created | Current Supabase SSR refresh, verified claims and secure cookie behavior |

No Supabase package, auth cookie, session token, OAuth client secret, email service or real route-protection behavior is introduced in Prompt 2. Frontend validation is a UX control only and must be repeated server-side at integration.

## Prompt 3 dashboard frontend threats

| Threat | Impact | Prompt 3 mitigation | Prompt 5 requirement |
|---|---|---|---|
| Fixture workspace mistaken for private account data | User deception and unsafe authorization assumptions | Persistent demo notice, fixture-typed records, no session or ownership claim | Verified server identity and per-object authorization before real data |
| Mock generation/payment/save/publish/deletion success | False charges, lost work or destructive misunderstanding | Adapter returns preview/unavailable, `persisted: false`, zero credits changed | Success only from verified idempotent server results |
| XSS through markdown, code or website preview | Script/session compromise | Constrained typed markdown blocks, text-only code, no raw HTML/script execution | Sanitize/validate and isolate untrusted generated code in a researched sandbox |
| Malicious upload/reference file | Malware, data leakage or storage abuse | Local file-name selection only; no upload/storage/object URL requirement | Type/size validation, scanning as appropriate, ownership and signed storage URLs |
| Fake job progress/streaming/stop | User believes compute is running or cancelled | Static labelled states, no timers, stop affects local preview only | Real job/status transport and explicit server cancellation semantics |
| Browser-controlled balance/quote/status | Credit/payment fraud | Fixture estimates labelled non-authoritative; no ledger mutation | Server-issued quotes, verified metering and transactional ledger |
| Model registry drift or invented IDs | Failed calls and misleading availability | Central date-labelled registry from official docs; `catalog-fixture` status | Revalidate server/gateway registry and allowlist configured models |
| Dynamic ID data exposure or fabrication | Unauthorized object access or misleading content | Allowlisted fixture lookup and not-found for unknown IDs | Server ownership checks on every object request |
| Arbitrary preview/publish URL | Phishing or unsafe navigation | No deployed fixture URL; no arbitrary redirect | Validated server-issued URLs and isolated deployment controls |

No real private data, model calls, uploads, storage, payment, ledger, deployment or account mutation is introduced in Prompt 3. Fixture ownership-shaped fields are presentation data only.

## Future high-priority boundaries

- **Auth:** secure Supabase cookies, server session verification, authorization per object, admin separation and no trust in client profile claims.
- **Payments:** verify Dodo webhook signatures against raw payload using current official docs; idempotency by provider event/payment ID; never grant credits from browser redirect.
- **Credits:** transactionally append ledger/deduct with sufficient balance, concurrency controls and server price versions. Never trust browser metering.
- **AI/media:** allowlisted server model IDs, output/input limits, malware/content scanning as appropriate, short-lived signed R2 URLs and object ownership checks.
- **E2B/deployment:** isolate untrusted generated code, restrict network/secrets, timeouts/quotas and prevent arbitrary Vercel project/team targeting.
- **Jobs/webhooks:** authenticate Inngest/provider events, enforce idempotency and safe retries.
- **Rate limiting:** per user and IP where suitable; fail safely without making Redis a single point of unexpected public-site failure.

## Security review rule

Exact payment webhook fields, SDK methods and signing configuration must be researched during Prompt 5; none are guessed here. Production security testing includes authorization bypass, replay, concurrency, validation and secret scanning. No destructive test against live production data without explicit authorization.
