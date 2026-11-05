# Security threat model

## Prompt 1 assets and trust boundaries

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
