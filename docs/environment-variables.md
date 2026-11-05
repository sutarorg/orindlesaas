# Environment variables

Status: **Prompt 5 validated configuration contract**. `.env.example` contains names and non-secret examples only. Copy it to `.env.local`; never commit real credentials. No provider value is invented by the application.

## Public application

| Name | Exposure | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public build-time | Production | Canonical HTTPS origin; provisional `https://orindle.com` for content only |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public build-time | No | Verified support inbox only |
| `NEXT_PUBLIC_SUPABASE_URL` | Public client-safe | Auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client-safe | Auth | Current Supabase publishable key (not a secret/service key) |

Never place `DATABASE_URL`, service-role/secret keys, Dodo/Gateway/R2/Inngest/E2B/Vercel/Upstash/Resend credentials or provider product mappings in `NEXT_PUBLIC_*` variables.

## Server-only integrations

| Name | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Drizzle/migrations/all persistence | Direct PostgreSQL connection; least-privilege runtime role recommended, migration role kept separate operationally |
| `SUPABASE_SERVICE_ROLE_KEY` or current `SUPABASE_SECRET_KEY` | Explicit admin Auth operations only | Never normal customer data access or browser code; configure only if account/session administration needs it |
| `DODO_PAYMENTS_API_KEY` | Checkout/reconciliation | Secret bearer token; prefix must match selected mode |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Dodo webhook | Standard Webhooks signing secret |
| `DODO_PAYMENTS_ENVIRONMENT` | Dodo | `test_mode` by default; `live_mode` only through deliberate production configuration |
| `DODO_PRODUCT_CREATOR_ID`, `DODO_PRODUCT_PRO_ID`, `DODO_PRODUCT_STUDIO_ID` | Checkout/webhook expectation | Environment-specific one-time product IDs; server-only and not shared across test/live |
| `AI_GATEWAY_API_KEY` | AI/catalog/cost | Server secret; Vercel OIDC may be supported by the SDK on Vercel but is not assumed locally |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | R2 | Server-only account/bucket and scoped S3 credentials |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Production jobs | Separate event-write and invocation-signing secrets; optional fallback signing key only during documented rotation |
| `E2B_API_KEY` | Website validation | Server secret; never forwarded into the created sandbox |
| `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` | Website deployment | Narrow server credential/team scope |
| `VERCEL_PROJECT_PREFIX` | Website deployment | Optional safe project-name prefix; default is server-controlled |
| `VERCEL_DEPLOY_TARGET` | Website deployment | `preview` default; `production` requires separate authorized operational change |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Server rate limiting | Required for sensitive production endpoints; no public fallback credentials |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPPORT_EMAIL` | Contact/receipt delivery | Verified sender and support destination; auth email delivery additionally requires Supabase SMTP/template configuration |
| `AI_ALLOWED_ASSET_HOSTS` | Hosted media download | Optional comma-separated exact HTTPS provider hosts; inline provider bytes do not need it |
| `LOG_LEVEL` | Observability | `info` default; safe values only, never enables payload logging |

## Local/test behavior

Local development may use explicit injected fakes in tests and a bounded process-local rate limiter. Production-sensitive routes do not silently select fakes or an unreliable memory limiter. Missing credentials produce `integration_unavailable` or a closed private route as appropriate; they never produce fabricated account, payment, generation, delivery or deployment success.

## Validation

`npm run env:check` validates variable presence groups, URL/enumeration formats, Dodo key/mode consistency and forbidden public-secret patterns without printing secret values. Build scripts do not require live secrets merely to compile. `npm run setup:guided` prints a configuration checklist; it does not create paid resources. See `deployment-runbook.md` for migration, catalog sync, admin bootstrap, webhook and Inngest sync order.
