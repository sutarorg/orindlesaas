# AI admin management

Status: **design for extending the existing real admin workspace and `/api/v1/admin/actions`; no new admin subsystem or endpoint family**. Current pages are bounded to 100 rows but need richer dynamic filters and controls.

## Providers

The Providers page should show exact namespace, display name, discovered/model counts, present/missing state, last seen, and enabled state. The existing `set_provider_enabled` action remains the enablement mutation. Enabling a provider does not enable its models or prove health. Sync never changes this setting.

## Models

The Models page should support bounded server-side search/filtering by exact ID, namespace, catalogue type, product compatibility, discovery state, price state, and enabled state. A detail view separates:

- exact identity and raw safe Gateway metadata;
- discovered candidate assessment;
- reviewed product compatibility and parameter policy;
- current/historical price and observation state;
- admin enablement and safe audit history.

Add an audited `set_model_compatibility` action to the existing discriminated admin-action contract. It requires `catalog:manage`, recent AAL2/TOTP, substantive evidence/reason, expected revision, and idempotency. Validate JSON strictly per product; arbitrary provider options and unknown top-level fields are rejected.

The existing `set_model_enabled` action must call the same central eligibility resolver and refuse enablement when provider, presence, compatibility, or current quote requirements fail. Disabling remains available to stop new work; existing jobs retain historical IDs.

## Pricing

Extend the existing price-version panel rather than adding another pricing screen/engine. It must display exact decimal strings and dimensions without float formatting. Admin can create a reviewed estimate version from a supported schema with expected current price ID and immutable audit. Sync observations remain read-only evidence. Manual active/future versions are not overwritten by sync.

No UI can edit a historical interval, actual usage cost, or settled credit amount. Invalid/incomplete formulas remain unquotable and cannot be enabled.

## Catalogue sync

Add a `run_catalog_sync` action through the existing admin action route with mode `full` or `incremental`, reason, and idempotency. It uses `catalog:manage` and step-up. The service orchestrates idempotency/run claims and external discovery **outside** a database transaction, then invokes the one catalog-sync transaction. A lost admin response can be recovered by run ID/key without starting a duplicate writer.

The sync view should list run ID, trigger, status, started/finished actor, snapshot hash, discovered/inserted/updated/missing/skipped/price counts, and safe error summary. Raw response bodies and credentials are not stored or displayed. Scheduled runs use the same service and appear in the same history.

## Usage and reconciliation

Usage remains a restricted read view with bounded filters for model, product, user/job ID, source, reconciliation state, and time. Actual cost is admin-only under `usage:read`. There is no browser editor for actual cost and no blind charged-job retry. Existing scheduled recovery may be inspected; any future manual metering refresh must use stored evidence and a separately permissioned audited action, never resubmission.

## Common mutation controls

Every mutation retains content-type/body limits, same-origin validation, verified active admin permission, recent step-up where required, rate limiting, current-state/optimistic checks, scoped idempotency, safe errors, and an audit row committed with the local mutation. UI confirmation does not replace server checks. Permission failure returns no restricted record payload.

## Responsive/accessibility requirements

Preserve the current premium-white admin design and native tables. Long exact IDs wrap or scroll within labelled regions; filters have labels and result counts; mutation status/errors are announced; controls remain keyboard usable at 320px. Do not replace native tables with an incomplete ARIA grid or hide critical state behind color alone.
