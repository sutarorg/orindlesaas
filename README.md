# Orindle

**Everything AI. One Platform.**

Orindle Chat, Image Studio, Video Studio and Websites, with a premium-white public site, Supabase authentication, owner-scoped customer workspace, permission-checked administration, and server integrations for Drizzle/PostgreSQL, Dodo Payments, Vercel AI Gateway, Cloudflare R2, Inngest, E2B, Vercel preview deployments, Upstash and Resend. Built with Next.js App Router, React, strict TypeScript, Tailwind CSS, Radix/shadcn-compatible primitives and Lucide.

> **Status:** Prompt 5 source implementation and credential-free local validation are complete. Live infrastructure is **not verified**: no migration, seed/catalog write, paid provider call, real deployment or credentialed customer/admin journey was run. This repository is not commercially production ready until the gates in `docs/handoff-prompt6.md` pass.

## Develop locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Public pages and fail-closed unconfigured behavior can be reviewed without secrets. Real account, workspace, payment, generation, storage, email and deployment operations require authorized environment-specific credentials and an applied schema. Never commit `.env.local` or place server secrets in `NEXT_PUBLIC_*` variables.

Useful safe checks:

```bash
npm run env:check       # validates configuration shape; does not print secrets
npm run setup:guided   # prints a checklist; contacts no provider
npx drizzle-kit check  # migration-chain/static consistency only
```

`npm run db:migrate`, `npm run db:seed`, and `npm run catalog:sync` perform real database and/or external operations. Do not run them against shared or production infrastructure without explicit authorization and the reviewed procedure in `docs/deployment-runbook.md`.

## Validate

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Or run the same static/unit/build sequence with `npm run check`.

For browser tests, install Playwright Chromium once, then run `npm run test:e2e`. Without `PLAYWRIGHT_BASE_URL`, Playwright starts/reuses the local dev server. To test a production build, run `npm run start` in a separate terminal and set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`.

```bash
npx playwright install chromium
npm run test:e2e
```

See `docs/quality-assurance.md` for the optional npm-packaged Chromium fallback used in this sandbox.

## Final local evidence — 2026-11-05

- **21 files, 106/106 unit/component/security tests**
- **50/50 production Playwright tests**: 17 public, 24 authentication, 5 workspace authorization and 4 admin authorization
- Strict TypeScript and ESLint pass
- Drizzle migration-chain check passes; no SQL was executed
- Next 16.4.5 production build passes with **45 generated pages**

These results do not prove live Supabase, PostgreSQL/RLS/concurrency, Dodo fulfillment, AI metering, R2, Inngest, E2B, Vercel, Upstash or Resend behavior. See [`docs/handoff-prompt6.md`](docs/handoff-prompt6.md) for the implemented boundaries, setup order, credential blockers and required release tests, and [`docs/README.md`](docs/README.md) for the full documentation map.
