# Production readiness

This checklist covers a real commercial launch, not just frontend or local backend acceptance. Current status: **not production ready**. Prompt 5 implementation and local checks are complete (106/106 unit tests, 50/50 production Playwright tests, strict checks and a 45-page build), but no live migration, RLS/concurrency test, credentialed provider journey, or production deployment has occurred. Source code and fakes are not operational proof.

## Public website gate

- [x] Required public routes/content/SEO regressions pass — Prompt 5 production build and 17 public E2E tests passed on 2026-11-05; the earlier frontend-stage 105-link audit is retained in `quality-assurance.md`.
- [x] Representative accessibility/keyboard and responsive visual review completed; zero violations in the tested axe states across 23 routes. Full AT, 200% zoom and real-device coverage remain explicitly open below/in `assumptions-and-open-questions.md`.
- [ ] Verified production origin, support contact and legal entity details replace assumptions.
- [ ] Qualified legal review of Privacy, Terms and Credits Policy.
- [ ] All provider/model availability statements verified against launch configuration.
- [ ] Real field Core Web Vitals monitored after sufficient traffic; lab checks alone not treated as compliance.

## Account and application gate (implemented locally; live evidence still required)

- [ ] Supabase Auth sessions, recovery, verification and authorization tests.
- [ ] Private dashboard/admin routes enforce server authorization and noindex.
- [ ] Admin roles/permissions are least-privilege, deny-by-default and tested for route/action/object/field bypass; no real admin fixture is treated as protection.
- [ ] High-impact admin operations require step-up, idempotency, current-state checks and append-only attributable audit; audit failure cannot report success.
- [ ] Drizzle migrations, backups, retention/deletion and R2 ownership/signed access reviewed.
- [ ] AI model prices/catalog configured server-side and actual metering reconciled.
- [ ] Wallet ledger is transactional, auditable and concurrency-safe.
- [ ] Dodo checkout/webhooks verified, idempotent and tested without browser-trusted fulfillment.
- [ ] Inngest retries/idempotency and E2B/Vercel sandbox/deployment limits tested.
- [ ] Upstash abuse controls and Resend delivery/suppression handling configured.

## Operational gate

- [ ] Monitoring, alerts, request correlation, incident contacts and rollback tested.
- [ ] Admin financial metric definitions, provider-cost reconciliation, redacted diagnostics and customer-code/deployment field restrictions reviewed by engineering/finance/security owners.
- [ ] Dependency/secret scanning and security review completed.
- [ ] Rate limits, spending quotas and provider outage/degradation UX verified.
- [ ] Support process for statutory rights, disputes and legally required remedies documented.
- [ ] Backup restoration and reconciliation drill performed with authorization.
- [ ] Production deployment explicitly authorized; no destructive action taken by default.

## Evidence rule

Every checked item needs linked test/runbook evidence and a date. Marketing polish does not compensate for missing payment, identity, ledger or security controls.
