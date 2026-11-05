# Admin navigation and information architecture

Status: **accepted for Prompt 4 frontend implementation**. All routes are noindex fixture views, not protected production pages.

## Global shell

The admin has its own 264px desktop sidebar, compact top navigation and max-width operations workspace. Public/customer headers and wallets never render inside it. A persistent banner states: illustrative operations data, no live connection and no saved administrative changes.

The top bar contains a mobile navigation trigger, breadcrumbs, local admin search, fixture notifications and a demo admin profile menu. The profile menu links to Admin Settings and the public site; sign-out preview explicitly reports that no session exists.

## Navigation groups

### Command

| Label | Route | Purpose |
|---|---|---|
| Overview | `/admin` | Range-aware fixture metrics, operational trends and exception links |
| Users | `/admin/users` | User discovery, details and account-action previews |

### AI operations

| Label | Route | Purpose |
|---|---|---|
| AI Models | `/admin/models` | Capability/modality catalogue and availability previews |
| Providers | `/admin/providers` | Integration/health fixtures and provider configuration previews |
| Model Pricing | `/admin/model-pricing` | Versioned provider-cost/customer-credit pricing previews |
| AI Usage & Costs | `/admin/usage` | Usage value, provider cost, contribution and reconciliation views |
| Generation Jobs | `/admin/jobs` | Cross-product queue/status/diagnostic fixtures |
| Website Projects | `/admin/websites` | Safe project and deployment metadata |

### Revenue operations

| Label | Route | Purpose |
|---|---|---|
| Credit Packages | `/admin/credit-packages` | Exact public packs and configuration previews |
| Payments | `/admin/payments` | Payment/webhook/fulfillment lookup |
| Transactions | `/admin/transactions` | Purchase/usage/adjustment reference ledger |
| Adjustments & Disputes | `/admin/adjustments` | Reasoned credit/dispute intents and audit previews |

### System

| Label | Route | Purpose |
|---|---|---|
| Admin Settings | `/admin/settings` | Local display/notification previews and proposed access model |

Navigation order follows operator tasks rather than duplicating the customer sidebar. Context links connect exceptions and detail records to their operational home without adding more global items.

## Search and breadcrumbs

Global search is local-only across fixture navigation, users, models, payment IDs and job IDs. Results link to the appropriate route with an allowlisted `q` query used to initialize that page's filter. It does not query a database or imply private-data access. Empty search offers clear recovery and Escape dismisses local results.

Breadcrumbs come from the admin navigation registry. Current pages use `aria-current="page"`; only the current crumb is required on narrow screens. Raw query values never become headings or links.

## Filters and date controls

Overview and Usage expose labelled fixture ranges. Data views put search/filter controls directly above their results, expose active values and provide a clear/reset action. Filtering resets to page one. Pagination appears below results with an item summary and previous/next buttons. No infinite scroll hides operational records or footer controls.

## Mobile behavior

Below `lg`, a Radix dialog provides the sidebar with a visible title, close button, Escape/overlay handling, focus containment/return and close-on-navigation. Toolbars wrap into full-width labelled controls. Tables remain semantic in named keyboard-focusable scroll regions; key detail summaries may stack outside the table. Dialogs fit `100dvh`, scroll internally and preserve access to Cancel/review actions.

## Route and state rules

- All 13 routes inherit `noindex, nofollow` and admin demo chrome.
- `/admin/*` unmatched paths use an admin catch-all and return a real 404.
- Query `q` is a presentation filter only. Unknown values produce ordinary no-results, not fabricated records.
- No route reads auth codes, roles or tokens from the URL.
- Robots disallows `/admin/`; sitemap contains public routes only. Neither is authorization.

## Future protected navigation

Prompt 5 should derive available destinations from server-issued permissions while still enforcing every route/action server-side. A hidden menu item is a convenience, not a security boundary. Unauthorized real routes must not serialize restricted records before a client denial screen is shown.
