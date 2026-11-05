# Handoff to Prompt 6 — QA, security and launch preparation

Prompt 6 should audit the integrated product against actual requirements and evidence rather than generating new claims. Re-run strict typecheck, lint, unit/integration/E2E tests, accessibility and responsive review, security abuse cases and production build. Verify all public metadata/sitemap/robots and every private route's server authorization/noindex.

Review payment reconciliation, credit ledger invariants, AI metering, asset/project ownership, background-job retries, sandbox/deployment isolation and email/rate-limit behavior. Validate legal entity/contact details, statutory consumer-rights language and model/provider availability with owners. Measure performance with lab and, when available, real 75th-percentile field data.

Update `production-readiness.md`, `deployment-runbook.md`, `progress.md` and risk documents with unresolved P0/P1 findings. Production launch, destructive database operations and live provider charges require explicit authorization. Do not mark launch ready solely because the build passes.
