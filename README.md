# Orindle

**Everything AI. One Platform.**

Orindle Chat, Image Studio, Video Studio and Websites, with a premium-white public site, Supabase authentication, owner-scoped customer workspace, permission-checked administration, and server integrations for Drizzle/PostgreSQL, Dodo Payments, Vercel AI Gateway, Cloudflare R2, Inngest, E2B, Vercel preview deployments, Upstash and Resend. Built with Next.js App Router, React, strict TypeScript, Tailwind CSS, Radix/shadcn-compatible primitives and Lucide.

> **Status:** Prompt 6 available-scope local QA and remediation are complete through application revision `4244b69`. Previous CI run `42084593285` passed all nine jobs; subsequent PR run `42086200854` failed mobile TBT and desktop-Chromium installation, so replacement final-HEAD CI is pending. Hosted providers, physical-device/AT, field monitoring, staging recovery and owner approvals remain **not verified**. Release and production readiness are **NO-GO**; see `docs/handoff-final.md`.

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

For browser tests, install the desired Playwright engines, then run `npm run test:e2e` (all five projects) or `-- --project=chromium`. Without `PLAYWRIGHT_BASE_URL`, Playwright builds and starts/reuses the local server. To test an existing production build, run `npm run start` in a separate terminal and set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`.

```bash
npx playwright install chromium firefox webkit
npm run test:e2e
```

`npm run test:integration` requires an explicitly disposable PostgreSQL `DATABASE_URL` and `QA_DATABASE_DISPOSABLE=1`; never point it at shared or production data. `npm run test:performance` audits an already-running production server and retains JSON/HTML reports in `performance-results/`. See `docs/quality-assurance.md` for the optional npm-packaged Chromium fallback and `docs/handoff-final.md` for the verified CI evidence.

## Final verification evidence — 2026-11-06

- **26 files, 126/126 unit/component/security tests**
- **80/80 local production Chromium tests**; all five managed browser projects passed the previous green CI run, with replacement final-HEAD checks pending
- Strict TypeScript, ESLint, Drizzle migration-chain check and Next 16.4.5 production build with **45 generated pages** pass
- Seven disposable PostgreSQL 16 integration tests pass migrations/seed, grants/RLS and concurrency/replay cases
- Exact-`4244b69` local Lighthouse matrix passes **24/24** after the home/mobile LCP and public-hydration corrections; JSON/HTML reports are retained
- Previous green CI [`42084593285`](https://github.com/sutarorg/orindlesaas/actions/runs/42084593285) passes **all nine jobs** with browser, coverage, PostgreSQL and performance artifacts
- Subsequent PR run [`42086200854`](https://github.com/sutarorg/orindlesaas/actions/runs/42086200854) remains a retained **failure**; replacement final-HEAD CI is pending

These results do not prove hosted Supabase, Dodo, AI metering, R2, Inngest, E2B, Vercel, Upstash or Resend behavior, physical-device/AT accessibility, field CWV, indexing or operational recovery. No live payment or production deployment occurred. See [`docs/handoff-final.md`](docs/handoff-final.md) for exact revisions, evidence and residual NO-GO gates, and [`docs/README.md`](docs/README.md) for the full documentation map.
