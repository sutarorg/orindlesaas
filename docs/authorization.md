# Authentication and authorization

Status: **Prompt 5 server enforcement implemented locally; live Supabase/PostgreSQL verification remains open**. Route visibility, noindex, fixture roles and hidden buttons are not security controls.

## Verified sessions

Supabase SSR uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; these are the only Supabase values intended for public client configuration. Secret/service keys and direct database URLs remain server-only. Next.js 16 uses `proxy.ts` to refresh cookie material and preserve the latest response cookies/cache headers.

Server code never trusts `getSession()` for authorization. The implemented guard uses Supabase `getClaims()` for verified JWT claims and then checks the current active database profile on every private request; this retains the documented token-revocation limits of claim verification. Session DTOs contain ID/email/display name/verification/expiry, never access or refresh tokens.

Password signup/login/logout, signup resend, recovery and password update use current Supabase methods. Email confirmation is required by deployment policy. Recovery callback establishes a verified recovery session before update. Google/GitHub OAuth is optional and only enabled after exact provider/redirect configuration. All `next` values are safe relative paths; callback codes are neither logged nor serialized.

## Customer object authorization

Every private route and service derives `userId` from the verified session. Repository queries include ownership for the target and parent objects, including dynamic conversation/project/generation/asset/website routes. A foreign or missing object returns the same safe not-found response where practical. Database RLS is defense in depth, not a substitute for these predicates on direct privileged connections.

Account status is checked for generation, checkout and settings mutations. Administrative membership cannot be supplied through user metadata, a request field, a cookie or a client fixture.

## Admin permissions

Authorization loads a current active, unexpired server-owned membership and intersects its explicit permissions with the action/field/object requirements. Unknown permissions have no effect. Deny by default applies to every admin route and direct endpoint.

Permissions follow `admin-permissions.md`: separate user management, catalog, pricing, payment reconciliation, credit adjustment, disputes, usage cost, job retry, websites, settings and audit. `admin:read` alone does not expose all datasets. Provider costs require `usage:read`; prompts/files/source and unrestricted identifiers are not made available by any default read bundle.

## Step-up and high-impact actions

Implemented high-impact admin mutations require AAL2 plus a Supabase TOTP `amr` timestamp within 10 minutes (60-second future-skew tolerance) and a current membership; a browser boolean is never accepted. Missing/stale/malformed step-up evidence returns 403 `step_up_required` before mutation. Payment reconciliation, session invalidation, dispute resolution and post-submission charged-job retry are not exposed as implemented admin mutations.

Each mutation also requires a substantive reason, bounded idempotency key, expected current state/version where applicable and an append-only audit event in the same transaction. Audit failure rolls back the local mutation. External provider reconciliation is performed only with verified provider records and stable operation IDs.

## Session invalidation and bootstrap

Session invalidation is not currently exposed as an admin operation; adding it requires the Supabase server admin API, authorization/step-up, audit and credentialed tests. Initial admin membership likewise has **no implemented bootstrap script or default admin**: a security owner must approve and apply an explicit existing-user UUID/permission bundle through a reviewed operator migration or a future tested bootstrap tool. There is no public role-assignment or self-escalation path.

## Required negative tests

Required launch tests cover anonymous, wrong user, non-admin, wrong permission, expired membership, missing/stale AAL2, stale object version, replayed idempotency with changed payload and direct endpoint access. Local unit/browser tests currently cover the credential-free and mocked-claim subsets. Real RLS role/claim switching, privileged direct-connection owner predicates, concurrent stale-state/replay behavior and credentialed admin journeys remain unexecuted launch gates, not passed tests.
