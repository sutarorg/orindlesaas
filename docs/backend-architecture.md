# Backend architecture

Status: **Prompt 5 design checkpoint completed before backend implementation on 2026-11-05**. Implementation claims are recorded in `progress.md` and `handoff-prompt6.md`, not inferred from this design.

## Monolith boundaries

Orindle remains one Next.js 16 App Router deployment. Server-only modules are divided by responsibility rather than by network microservices:

- `lib/server/env`: runtime environment validation and explicit capability checks.
- `lib/server/http`: versioned API envelopes, request IDs, body limits, Origin/CSRF checks and safe errors.
- `lib/server/auth`: Supabase SSR clients, verified identities, route guards and admin step-up checks.
- `lib/server/db`: Drizzle schema, connection ownership, transaction helpers and migrations.
- `lib/server/credits`: the only write path for wallets, reservations and append-only ledger entries.
- `lib/server/payments`: server pack lookup, Dodo Checkout Sessions and verified webhook fulfillment.
- `lib/server/ai`: model/capability/price registries, AI Gateway calls, usage lookup and generation state.
- `lib/server/jobs`: transactional outbox and Inngest functions for media, websites, email and reconciliation.
- `lib/server/storage`: R2 object keys, generated writes, bounded owner reads and short-lived signed download URLs.
- `lib/server/websites`: source validation, E2B build validation and scoped Vercel deployment.
- `lib/server/admin`: permission-filtered queries, current-state mutations and append-only audit.
- `lib/server/email`: Resend delivery with stable idempotency keys and safe delivery state.

Route handlers compose these modules. React components never receive service-role keys, direct database connections, raw webhook bodies, provider operation secrets, unrestricted object keys or internal AI costs.

## Request and data flow

1. Proxy refreshes Supabase cookie material using the current SSR contract. It is not the authorization boundary.
2. A Server Component or route handler verifies the user with `getUser()` where current revocation status matters, or verified claims where the documented guarantee is sufficient. Every private query also includes the verified user ID.
3. Versioned JSON endpoints runtime-validate content type, body size and input with Zod. Cookie-authenticated mutations also pass same-origin checks and server-side rate limits.
4. Services authorize the operation and object before mutation. Direct PostgreSQL access is treated as privileged even when RLS is enabled.
5. Financial writes run in one database transaction. External AI, email, storage and deployment calls never run while a database transaction is open.
6. Long work is committed as a generation plus an outbox record before Inngest is notified. An outbox sweep repairs missed notification without repeating a provider generation.
7. Responses use display-safe DTOs and a request correlation ID. Logs contain structured safe codes and IDs, never secrets, prompts, files, generated source, raw payment events or stack traces.

## Financial consistency boundary

A local PostgreSQL transaction can atomically cover a wallet, its ledger, a generation/reservation and an audit/outbox record. It cannot roll back a Dodo payment, AI generation, R2 write, email or Vercel deployment. Those systems are connected through stable business IDs, idempotent read/write operations, durable outbox states and compensating ledger entries. A provider timeout after submission is **unknown**, not failed; code must reconcile rather than blind-retry.

## Credit authority

Orindle owns the authoritative wallet and ledger. Dodo is used for one-time payment collection, not simultaneous automatic entitlement/meter deductions. This avoids double fulfillment and asynchronous remote-balance races. Purchased credits have no application-created expiry.

A reservation moves estimated credits from available to reserved in one ledger transaction. Settlement uses verified AI Gateway cost and actual usage. Over-reservation is released; an actual charge above available funds enters an explicit reconciliation state rather than producing a negative wallet or silently undercharging. Pre-provider validation fails before job dispatch where possible; the current worker does not auto-release after a possibly submitted call. Post-submission failure records actual cost where evidence is available. Compensation/reversal kinds exist for controlled future workflows, but no automatic compensation or browser cancellation policy is exposed.

## Model and price authority

The server allowlist contains only model IDs and capabilities found in current official AI Gateway/AI SDK documentation. A setup sync reads the authenticated Gateway catalog and writes versioned price data; it does not invent prices. Generation rejects an unknown, disabled, capability-incompatible or unpriced model. Browser input is a model ID and operation options only.

Final deduction is `ceil(actual_metered_ai_cost_usd × 200)`. AI costs are stored as non-negative decimal nanodollars and converted with integer arithmetic. Estimated cost, estimated credits, actual Gateway cost and final credits are separate fields. No profitability or fixed-margin claim follows from the markup rule.

## Website trust boundary

AI output is data until validated. Paths, file counts, byte sizes, HTML/CSS/JS shape and dependencies are checked server-side. The application server never imports, evals, requires or executes generated source. E2B receives only generated source and a fixed build recipe—never production Supabase, Dodo, R2, Inngest, Vercel, Resend or Gateway credentials.

Vercel deployment uses a server-generated project name within a configured team and name prefix. The only accepted target is `preview`; the current service rejects `production` even if it is supplied in environment configuration. Generated code cannot choose a team, existing project, environment variables, arbitrary domain or deployment target.

## Configuration and degradation

Missing credentials are explicit integration states, not fixtures or fake successes. Public content remains available. Private routes fail closed. Provider-dependent mutations return `integration_unavailable` with a safe request ID. Current local tests use injected fakes and credential-free production smoke behavior; no isolated PostgreSQL test database was available. Real PostgreSQL remains a launch gate. Fakes are never selected by a browser parameter or silently used in production.

## Dynamic AI Gateway ecosystem — design only, 2026-11-06

The next AI stage extends the modules above; it does not add another provider, registry, wallet, pricing engine, or scheduler. `ai-provider-architecture.md` is the controlling design. The existing Gateway module will add validated REST discovery and lossless generation lookup because the installed SDK metadata transform filters unknown model types and returns generation cost as a JavaScript `number`.

Discovery-owned metadata is separate from admin enablement/compatibility and immutable price evidence. One server resolver in `lib/server/ai/models.ts` must validate model/provider presence and enablement, product compatibility, exact operation parameters, model limits, and current quote eligibility for Chat, Image Studio, Video Studio, and Websites. All returned model types are retained; unsupported and unknown categories have no customer route.

Catalogue sync uses the existing catalog-sync module and Inngest boundary, external reads outside DB transactions, one atomic changeset, run leases/history/audit, and missing—not deleted—historical rows. New discoveries remain disabled. Actual settlement continues through the existing credits ledger and uses losslessly parsed Gateway generation evidence. Source A is now preserved and verified as 166 unique IDs in 28 namespaces; the documentation/source gate is complete, while implementation remains a separate phase. See `handoff-ai-integration.md`.
