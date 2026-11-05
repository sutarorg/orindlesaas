# Admin architecture

Status: **accepted for Prompt 4 frontend implementation on 2026-11-05**. This stage creates an explicitly labelled operations demo only. It implements no authentication, authorization, database queries, provider health checks, payment operations, credit mutations, deployment access or persistent audit log.

## Stage and trust boundary

`/admin` is a separate noindex shell, not a customer-sidebar item and not a protected production admin. Every record is fictional fixture data. Every mutation-like control submits an intent to a local preview adapter that cannot return operational success.

Prompt 5 must place verified server identity, deny-by-default role/permission checks, per-object authorization, field-level redaction, runtime validation, idempotency, step-up authentication and append-only auditing around every real operation. A hidden link, browser role, noindex directive or fixture route is not access control.

## Route and chrome architecture

```text
app/
  layout.tsx                    shared metadata/fonts/body only
  (site)/                       unchanged public/auth chrome
  app/                          unchanged customer demo shell
  admin/
    layout.tsx                  noindex AdminShell
    page.tsx                    operations overview
    users/page.tsx
    models/page.tsx
    providers/page.tsx
    model-pricing/page.tsx
    credit-packages/page.tsx
    payments/page.tsx
    transactions/page.tsx
    usage/page.tsx
    jobs/page.tsx
    websites/page.tsx
    adjustments/page.tsx
    settings/page.tsx
    error.tsx                   safe admin error presentation
    not-found.tsx               admin-safe not-found presentation
    [...not-found]/page.tsx     real 404 for unmatched admin paths
```

No admin-root `loading.tsx` is planned: the Prompt 3 streaming-404 defect must not be repeated. Any future loading boundary requires production status-code regression tests. `app/robots.ts` disallows `/admin/`; the public sitemap remains unchanged. These are discovery controls only.

## Frontend folders

```text
components/admin/
  admin-shell.tsx             sidebar, mobile drawer, top navigation and demo notice
  admin-search.tsx            local cross-resource fixture discovery
  ui.tsx                      page headers, panels, badges, notices and preview feedback
  data-table.tsx              semantic table region and pagination primitives
  confirm-action-dialog.tsx   reasoned two-step non-persistent action confirmation
  trend-chart.tsx             accessible SVG chart plus equivalent values
  ...feature workspaces       local filters, detail/edit dialogs and preview intents
lib/
  contracts/admin.ts          display-safe DTOs, permissions and mutation intents
  admin/
    fixtures.ts               fictional deterministic operational records
    navigation.ts             route groups, active matching and breadcrumbs
    format.ts                 UTC/date/money/credit formatting
    metrics.ts                range filtering and documented metric calculations
    permissions.ts            proposed route/action permission maps only
  mocks/admin-preview.ts      no-operation admin adapter
app/admin/                    route composition and metadata
```

Pages remain Server Components by default. Client boundaries own local query/filter/page state, menus, dialogs, selected fixture details and preview submissions. There is no global store, browser persistence, network request or server-secret environment variable.

## Data flow

1. A Server Component imports explicitly typed fixtures and composes the route.
2. A feature Client Component receives display-safe records or imports framework-free fixture helpers.
3. Search/filter/sort/pagination operate only on the local fixture collection. Filter changes reset pagination; empty results explain recovery.
4. A detail dialog displays an allowlisted DTO. It never renders raw prompts, customer files/code, access tokens, secret object keys or webhook payloads.
5. An administrative action collects required fields and a reason, then presents a review step.
6. `mockAdminService` returns `status: "preview" | "unavailable"`, `persisted: false`, `auditPersisted: false`, `paymentChanged: false` and `creditsChanged: 0`.
7. Credit-adjustment previews may return a separate ephemeral `auditPreview` for interface review. It is labelled non-persistent and is not an operational audit record.

Local draft edits may change form state before cancellation. They must not silently rewrite the canonical fixture collection or imply a server save.

## Financial and operational calculations

Money uses integer USD cents; credits use integers. Formatting is deterministic and uses UTC for fixture dates. The `100 credits = $1 customer-facing usage value` rule means one credit corresponds to one cent of usage value, not one cent of received revenue.

- **Total revenue (demo label):** sum of successful fixture payment amounts in the selected range. It is not actual received revenue, recognized accounting revenue or a company performance claim.
- **Provider cost:** restricted illustrative cost fields. Production values must come from reconciled provider metering/invoices.
- **Customer usage value:** credits deducted ÷100, expressed in USD; distinct from cash receipts.
- **Gross contribution:** customer usage value minus provider cost. It excludes payment fees, infrastructure, support, tax, refunds and other operating expenses; it is not net profit or a complete accounting gross-profit measure.
- **Failed generation cost:** provider-cost fields attached to failed fixture jobs/usage events, including zero-cost failures where applicable.
- **Unreconciled usage:** explicitly flagged fixture usage, never inferred from a missing browser value.

The UI always shows fixture range, currency and definitions. No trend percentage or performance claim is required.

## Tables, charts and responsive architecture

Use native `<table>`, `<th scope="col">`, captions and ordinary tabbable controls. Do not apply `role="grid"` without implementing the complete composite keyboard model. Wide tables live in a named, keyboard-focusable scroll region; the page itself must not overflow. Pagination exposes item counts, previous/next controls and polite result summaries. Filter controls remain visible or move into labelled wrapping regions rather than becoming hover-only.

Charts are lightweight SVG/HTML, with readable axis/unit labels, a concise text summary and an expandable native data table. Bar comparisons start at zero; missing values remain gaps. No charting dependency is needed for the fixed operational trends.

At wide desktop the sidebar is persistent and tables use available width. Below `lg`, navigation becomes a Radix modal drawer with Escape, overlay close and focus return. Metric grids collapse, toolbars wrap and detail dialogs fit the viewport. At 320px all actions and table regions remain reachable.

## Admin operation boundary

`AdminService` defines preview intents for account status/session actions, provider/model availability, model pricing, credit packages, payment reconciliation, job retry, dispute review, credit adjustment and admin preferences. Requests contain fixture IDs and operator-entered intent only. Browser values are never authoritative prices, balances, payment states, permissions or audit evidence.

Prompt 5 replaces these with server endpoints only after revalidating current provider/database APIs. Real responses must be runtime-validated display-safe DTOs with safe error codes and correlation IDs. Operational success copy requires a confirmed server result.

## Validation requirements

Preserve all public/auth/customer regressions. Add unit tests for fixture integrity, metric formulas, navigation, pagination/filter helpers and every mock result. Add browser tests for all 13 routes, global search, mobile navigation, filter/pagination/empty states, detail dialogs, two-step confirmations, required adjustment reasons, non-persistent audit previews, unknown-route 404s, noindex/robots/sitemap and absence of operational success claims.

Run strict TypeScript, ESLint, unit tests, production build, production Playwright, every-admin-route axe and 320/390/1440px overflow checks, internal-link audit and representative visual review. Record observed results in `progress.md` and `quality-assurance.md`; do not infer security or production readiness from fixtures.
