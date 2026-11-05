# Handoff to Prompt 5 — Backend, AI, payments and integrations

Prompt 5 connects the frontend contracts to real server services: Supabase PostgreSQL/Auth, Drizzle, Vercel AI Gateway/SDK, Cloudflare R2, Inngest, E2B, Vercel API, Dodo Payments, Upstash Redis and Resend. Research current official APIs, installed SDK versions, model IDs and payment webhook fields before coding; do not use this planning document as API verification.

Non-negotiable rules: browser never determines provider cost or final credits; packs/model prices are server-configured; payment fulfillment follows verified idempotent webhooks rather than redirects; credit ledger mutations are transactional and concurrency-safe; internal costs/secrets never reach the client. Use the 100 credits = $1 display-value rule and proposed 2× verified metered AI cost without exposing cost.

Preserve all public SEO and private noindex/authorization requirements. Implement rate limits, origin/CSRF defenses where applicable, signed media access, job idempotency, sandbox isolation and safe errors. Test webhook replay, insufficient balance, concurrency, authorization bypass and provider failure. No live production deployment or destructive migration without explicit authorization.
