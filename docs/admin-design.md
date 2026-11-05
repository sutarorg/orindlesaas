# Admin visual and UX design

Status: **accepted for Prompt 4 implementation**. The interface is operational software, not a marketing dashboard or a dark command-center theme.

## Experience idea: calm operational control

The admin should answer three questions quickly: **What needs attention? Where is the evidence? What is the safest next action?** Dense information is organized through alignment, hierarchy and progressive disclosure rather than crowded cards, tiny text or constant alerts.

The same premium-white Orindle identity continues: white/soft surfaces, charcoal type, fine cool-gray borders and dark teal actions. Admin distinguishes itself with a slightly wider sidebar, compact metric typography, tabular numerals, structured toolbars and restrained status colors—not a separate brand.

## Layout and hierarchy

- 264px persistent desktop sidebar with grouped task navigation; accessible drawer below `lg`.
- 68px top navigation plus a concise persistent demo-operations banner.
- Main workspace uses 16px mobile, 24px tablet and 28–32px desktop gutters, bounded around 1680px.
- Page headers use a compact operational eyebrow, 28–36px title, one-sentence purpose and at most one primary contextual action.
- Overview starts with four decision metrics, followed by compact secondary metrics, two meaningful charts and an exception queue. Avoid twelve equal-emphasis cards.
- Data pages use a titled panel with a nearby toolbar, results and pagination. Details open in focused dialogs instead of adding every field to the row.

## Data density and typography

Inter handles table/UI text; Poppins is reserved for page titles and key figures. Body/table text remains 13–15px with readable line height; never reduce operational text to 10px for density. Numeric columns use tabular numerals and right alignment; names/status remain left aligned. Identifiers use wrapping or safe truncation with a detail view, not tiny horizontal text.

Metric cards contain a plain-language label, fixture value, unit/range and a short definition. No trend arrow or percentage is added without a meaningful verified comparison. Large financial values show USD explicitly. Credits include the word “credits” in context.

## Tables and toolbars

- Native table semantics, visible column headers and a caption/accessible name.
- Consistent row alignment, subtle dividers, 48–56px typical row targets and status text plus icon/color.
- Search first, then a small set of relevant filters and one clear/reset action. Avoid more than two emphasized toolbar buttons.
- Result count explains filtered totals. Pagination sits below the table with previous/next controls and current page.
- Row actions use descriptive labels such as “View Maya Chen” or “Review PAY-…” rather than unlabeled ellipsis-only controls.
- Wide tables use a named keyboard-focusable horizontal region. The page never relies on clipped columns or hover to reveal essential information.
- Empty states say whether the fixture is empty or filters matched nothing and offer reset.

Do not use ARIA grid roles for ordinary operational tables. Native controls remain in the normal tab order; this avoids promising unimplemented arrow-key grid behavior.

## Status and attention

Status vocabulary is consistent: Active/Enabled/Completed/Fulfilled use dark teal; Queued/Pending/Review use amber-brown; Running/Processing use blue-teal; Failed/Suspended/Disputed use dark red; Neutral/Not connected uses gray. Every badge includes text, and icons are decorative when duplicated.

Alerts are reserved for actionable exceptions. The demo notice is informative rather than danger-styled. Fixture failures are labelled as examples and never presented as an active Orindle incident.

## Charts and metric definitions

Use two series at most per chart, direct labels where practical and a compact legend when needed. Axis labels show dates and units. Bars begin at zero; missing data remains a gap. No smoothed speculative trend, decimal-float money or misleading dual-axis comparison.

Each chart includes a concise textual takeaway that describes the fixture without claiming company performance, plus a native `<details>` values table. Range labels explicitly say “7/30/90 demo days” and the fixture as-of date.

A visible metric-definition panel distinguishes:

- Captured successful fixture payments (“Total revenue” required label, qualified as demo).
- Customer usage value from credit deductions.
- Provider cost fixtures.
- Gross contribution before other operating expenses.
- Failed generation cost and unreconciled usage.

## Dialogs and safe actions

Detail dialogs prioritize summary, status and safe references, with tabs/sections for related purchase/usage history. Destructive or privileged actions use a two-step flow:

1. Enter/validate configuration and substantive reason.
2. Review target, requested consequence and reason; confirm the preview.

The least destructive action remains easy to reach. Radix supplies focus containment, Escape and focus return; long dialogs use a meaningful title and internal scrolling. Feedback is a polite status region. It states exactly what did **not** happen: no user/provider/payment/job/package/preference changed, no audit persisted and zero credits changed as applicable.

Credit adjustments show signed amount, target, category/reference and reason in the review. The resulting audit preview is visually separate from historical fixture audit entries and marked “not persisted.”

## Responsive behavior

Metric grids move from four/two columns to one; charts stack; navigation becomes a drawer; filters become full-width; detail grids become single-column. Tables retain semantics in scoped scroll regions rather than converting every cell into an unlabeled card. At 320px, long IDs wrap, buttons remain reachable and the document has no horizontal overflow.

## Accessibility and content

One H1, logical H2 sections, skip link, visible labels/instructions, native selects/inputs, 44px key targets and visible focus. Result counts and no-operation feedback use appropriate status announcements without repeated chatter. Icons never carry sole meaning. Charts have equivalent values; no hover-only tooltip is required.

Copy uses operational language without blame or ambiguity: “Review failed fixture payment,” “No results match these filters,” “Preview confirmed—no provider configuration changed.” Never say “live,” “healthy,” “revenue is up,” “refund completed,” “credits added” or “audit logged” about Prompt 4 fixtures.
