# Environment variables

## Prompt 1/2

| Name | Exposure | Required | Purpose / default |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public build-time | Production | Canonical absolute origin; provisional fallback `https://orindle.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public build-time | No | Only set to a verified support inbox; absent contact UI must not invent one |

`.env.example` exists with non-secret public placeholders only. Copy it to `.env.local` for local configuration. Local frontend development requires no secrets. Prompt 2 adds no Supabase/OAuth variables and installs no auth SDK. Never place private API keys in `NEXT_PUBLIC_*` variables.

## Later-stage variables (documented, not implemented)

| Name | Exposure | Stage | Purpose |
|---|---|---|---|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Public client-safe values only as documented | 5 | Supabase browser/server auth clients; verify current publishable-key naming at integration |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | 5+ | Restricted administrative tasks only; never browser |
| `DATABASE_URL` | Server secret | 5+ | Drizzle/PostgreSQL connection |
| `AI_GATEWAY_API_KEY` | Server secret | 5 | Vercel AI Gateway |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Server secrets/identifiers | 5 | Media storage |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Server secrets | 5 | Background jobs |
| `E2B_API_KEY` | Server secret | 5 | Website sandbox |
| `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` | Server secrets | 5 | Website deployment |
| `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY` | Server secrets | 5 | Checkout/webhook verification |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Server secret | 5+ | Rate limiting |
| `RESEND_API_KEY` | Server secret | 5+ | Transactional email |

Exact variable names must be checked against current official provider documentation at integration time; this list is a planning contract, not confirmation of provider API fields. Secrets live in the deployment platform's encrypted settings, never Git or docs.
