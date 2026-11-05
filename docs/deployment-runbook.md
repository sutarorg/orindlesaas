# Deployment and backend setup runbook

Status: **local/preview procedure plus live launch gates**. Prompt 5 did not run migrations, seed/catalog writes, paid providers, credentialed smoke tests, or a live deployment. Do not interpret a successful local build as authorization to run these steps against production.

## Local credential-free verification

1. Install the locked dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` only if needed; do not commit it or add invented credentials.
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run build`.
4. Start the production build on the intended preview host and run Playwright against it. In this sandbox the Chromium executable/library overrides documented in `quality-assurance.md` were required.
5. Run `npx drizzle-kit check` for migration-chain consistency only; this does not execute SQL.
6. Run `npm run env:check` to validate configuration shape without printing secret values. `npm run setup:guided` only prints a checklist.

Missing production integrations must fail closed. A local unconfigured 503 `integration_unavailable` is expected for private APIs and is not a passed authenticated journey.

## Authorized disposable-environment setup order

Use a disposable Supabase/PostgreSQL project and test-mode provider accounts first. Keep migration credentials separate from the runtime role and use only credentials you are authorized to use.

1. **Review and back up:** reconcile `drizzle/0000_initial_backend.sql`, `0001_integrity_and_bootstrap.sql`, and `0002_outstanding_ultimates.sql` with the actual target and existing data. Review the `auth.users` trigger, grants, RLS, append-only triggers, backfills, and single-open-price index. Establish a restorable backup and forward-recovery plan.
2. **Apply schema:** run `npm run db:migrate` only against the explicitly selected database. This is a real schema write and was not run during Prompt 5.
3. **Verify database controls before seeding application use:** execute two-user RLS/ownership tests, direct Data API grant/column checks, append-only trigger tests, and concurrent wallet/idempotency tests. Do not substitute PGlite or transaction fakes for PostgreSQL evidence.
4. **Seed exact packs:** run `npm run db:seed`. It insert-checks Creator/Pro/Studio values and does not overwrite existing rows; reconcile any conflict rather than changing prices through a browser.
5. **Configure Supabase Auth:** set exact redirect URLs, email confirmation/recovery templates and SMTP, Google/GitHub only if used, and TOTP/MFA policy. Verify cookie refresh, callback exchange, sign-out, reset, and account status behavior.
6. **Bootstrap administration deliberately:** there is no default admin, public role grant, or implemented bootstrap script. A security owner must approve an existing user UUID and explicit permission bundle through a reviewed operator migration or future tested tool. Test wrong roles, expired membership, recent AAL2, and audit rollback before using admin actions.
7. **Configure Dodo test mode:** create three one-time products matching exact pack pre-tax USD values, environment-specific server product IDs, and the raw webhook signing secret. Do not attach Dodo credit entitlements. Test signature/replay/mismatch/duplicate fulfillment and receipt outbox behavior with real PostgreSQL.
8. **Configure Gateway and catalog:** set the authorized Gateway credential and run `npm run catalog:sync` as a deliberate external read plus database write. New providers/models remain disabled. Review capabilities and exact prices, configure media operation prices manually from authoritative evidence, then enable only approved entries.
9. **Configure durable jobs and abuse controls:** register the Inngest endpoint/functions, event/signing keys and optional rotation procedure; configure Upstash. Verify outbox recovery, per-user limits, failure/timeout behavior, and no blind charged retry.
10. **Configure storage/email:** use scoped R2 credentials and exact `AI_ALLOWED_ASSET_HOSTS`; verify owner-signed access, bounded downloads, checksum behavior and orphan-object reconciliation. Configure verified Resend sender/support inbox and test support/receipt idempotency and failure states.
11. **Configure website execution:** set E2B and narrowly scoped Vercel preview credentials. Keep `VERCEL_DEPLOY_TARGET=preview`; the service rejects production targets. Test isolation, current-source build eligibility, bounded polling, unknown create outcomes and provider-ID reconciliation. Customer code must never execute on the app server.
12. **Run credentialed acceptance tests:** complete customer and admin journeys, security/authorization negatives, financial reconciliation, accessibility/responsive regressions, dependency/secret review, monitoring/alert tests and operational drills before requesting production approval.

## Production deployment gate

- Obtain explicit target-environment authorization and reviewed PR/release approval.
- Set `NEXT_PUBLIC_SITE_URL` to the verified HTTPS origin and all secrets through encrypted environment-specific settings. Never expose server credentials through `NEXT_PUBLIC_*`.
- Use test evidence from the same schema/application revision. Confirm live Dodo product/key/webhook separation and never reuse test product IDs or signing keys.
- Confirm legal entity/policies, support inbox, finance metric definitions, spending quotas, retention/deletion, backup restoration, incident contacts, alerts and rollback procedures.
- Re-run dependency audit and remediate supported findings; do not use blind `npm audit fix --force` or an untested major Zod override.
- Deploy the application only after database/provider gates pass. Verify headers, canonical/OG, robots/sitemap, private noindex, 404s, auth flows, public CTAs and safe degradation.
- Production website deployment remains disabled by application policy even after the app itself is deployed; changing that requires a separate reviewed code/policy change.

## Recovery and uncertain states

- For a bad application release, use the platform’s documented rollback to the last known-good immutable deployment compatible with the schema.
- For payment/credit incidents, stop the affected operation, preserve verified event/ledger evidence and reconcile through reviewed transactional procedures. Never edit balances from a browser or untracked SQL.
- A provider submission/deployment with unknown acceptance must not be blindly retried. Recover the provider reference first; an error without a Vercel deployment ID is explicitly uncertain and blocks another automatic create.
- R2 is not transactional with PostgreSQL. Reconcile objects uploaded before a database failure and avoid duplicate postprocessing retries; do not claim storage and ledger commit atomically.
- Audit/ledger failure rolls back the local admin/payment mutation. External provider effects require separate reconciliation and cannot be “rolled back” by deleting local evidence.

## Launch communications

Do not announce real signup, checkout, AI generation, email delivery, or website publishing until the corresponding live acceptance gate passes. Queue acceptance is not inbox delivery, checkout return is not payment fulfillment, estimated cost is not actual cost, and a preview deployment is not a production launch.
