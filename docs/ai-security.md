# AI integration security

Status: **security contract for the planned dynamic catalogue/routing/sync work; existing Prompt 5 controls remain the baseline**. Hosted verification is still absent.

## Trust boundaries

- Gateway responses are external input even over TLS. Validate envelope, sizes, types, IDs, decimals, and response limits before persistence.
- Browser model IDs and operation values are untrusted. Browser-declared providers, capabilities, compatibility, prices, credits, eligibility, and raw provider options are never authoritative.
- The direct Drizzle role may bypass RLS. Every customer query still needs verified ownership and every admin query/mutation needs explicit permissions.
- Generated text/media/source and provider-hosted URLs remain untrusted; existing R2, SSRF, website source, E2B, and preview-only deployment boundaries are unchanged.

## Credential and metadata handling

`AI_GATEWAY_API_KEY` is server-only. Authenticated catalogue and generation requests use the existing Gateway module; no key or Authorization header reaches logs, browser DTOs, raw audit JSON, or client bundles. Public and authenticated/availability responses must not share a public cache key. Raw metadata is allowlisted for storage and redacted for presentation.

Customer catalogue DTOs exclude upstream price, admin notes, eligibility internals, sync errors, and unsupported categories. Actual generation cost and provider operation references remain server/admin-only. Admin raw metadata views require `catalog:read`; usage cost requires `usage:read`.

## Mutation and API controls

Catalogue estimate/generation and admin mutations retain bounded JSON, Zod validation, same-origin checks for cookie authentication, verified active profile, scoped rate limits, safe error envelopes, and no-store responses. Admin actions additionally require explicit permission, recent AAL2/TOTP, reason, expected state, idempotency, and transactional audit. Sync execution never occurs with a database transaction open.

Use bounded page sizes, search length, filter enums, and stable ordering for all registry/admin APIs. Do not add duplicate public admin read endpoints merely to support client filtering; server components/query services can provide the same permission-filtered projections.

## Submission and routing abuse

The server resolves the exact model/product/options/price before dispatch. Unknown or unsupported categories cannot be relabeled as Chat/Image/Video/Websites. Arbitrary Gateway fallback/provider ordering, region, service tier, tool use, and provider options are not accepted from customers. New discoveries never auto-enable.

Paid SDK retries stay disabled and the existing atomic submission claim remains mandatory. Read-only generation lookup/catalogue retries are distinct from paid generation and must be bounded. An uncertain submission never triggers another model, provider, or job attempt.

## Database protections

The additive migration must preserve RLS and existing grants, keep internal price observations/sync runs out of public Data API access, and protect historical catalogue/financial rows from accidental deletion. JSONB is not a validation substitute: services validate shape and size before writes. Check enabled rows have a valid product route and prices/usage remain non-negative.

## Security test focus

Test cross-user/role/permission access, stale step-up, CSRF/origin, rate limits, oversized/deep JSON, control characters and very long IDs, duplicate/conflicting entries, unknown types, decimal/exponent/overflow inputs, cache separation, unsupported options, unsupported model enablement, missing current price, browser price/capability forgery, sync idempotency, audit rollback, and uncertain paid submission.

No live offensive testing, unrestricted model calls, real-money activity, or production destructive migration is authorized by this document.
