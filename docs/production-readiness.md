# Production readiness

This checklist covers a real commercial launch, not just Prompt 1 acceptance. Current status: **not production ready** because the repository is frontend-only and core services are intentionally absent.

## Public website gate

- [x] All required routes/content/SEO checks pass — final build, 16 E2E tests and 105-link audit passed on 2026-11-05 (`quality-assurance.md`).
- [x] Representative accessibility/keyboard and responsive visual review completed; zero violations in the tested axe states across 23 routes. Full AT, 200% zoom and real-device coverage remain explicitly open below/in `assumptions-and-open-questions.md`.
- [ ] Verified production origin, support contact and legal entity details replace assumptions.
- [ ] Qualified legal review of Privacy, Terms and Credits Policy.
- [ ] All provider/model availability statements verified against launch configuration.
- [ ] Real field Core Web Vitals monitored after sufficient traffic; lab checks alone not treated as compliance.

## Account and application gate (later stages)

- [ ] Supabase Auth sessions, recovery, verification and authorization tests.
- [ ] Private dashboard/admin routes enforce server authorization and noindex.
- [ ] Drizzle migrations, backups, retention/deletion and R2 ownership/signed access reviewed.
- [ ] AI model prices/catalog configured server-side and actual metering reconciled.
- [ ] Wallet ledger is transactional, auditable and concurrency-safe.
- [ ] Dodo checkout/webhooks verified, idempotent and tested without browser-trusted fulfillment.
- [ ] Inngest retries/idempotency and E2B/Vercel sandbox/deployment limits tested.
- [ ] Upstash abuse controls and Resend delivery/suppression handling configured.

## Operational gate

- [ ] Monitoring, alerts, request correlation, incident contacts and rollback tested.
- [ ] Dependency/secret scanning and security review completed.
- [ ] Rate limits, spending quotas and provider outage/degradation UX verified.
- [ ] Support process for statutory rights, disputes and legally required remedies documented.
- [ ] Backup restoration and reconciliation drill performed with authorization.
- [ ] Production deployment explicitly authorized; no destructive action taken by default.

## Evidence rule

Every checked item needs linked test/runbook evidence and a date. Marketing polish does not compensate for missing payment, identity, ledger or security controls.
