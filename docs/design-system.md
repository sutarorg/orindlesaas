# Design system

## Tokens

| Role | Value | Usage |
|---|---|---|
| Canvas | `#ffffff` | Main background |
| Soft surface | `#f7f9f8` | Alternate sections |
| Subtle surface | `#f1f5f3` | Wells and code/example backgrounds |
| Ink | `#151918` | Headings and primary text |
| Body | `#4f5d58` | Paragraphs |
| Muted | `#64716c` | Supporting text; contrast checked in axe browser audits |
| Border | `#dfe7e3` | Hairlines and dividers |
| Mint | `#bdf5dd` | Brand fills and highlights |
| Mint strong | `#76dfae` | Selected states, not small body text |
| Teal | `#067a67` | Accessible links/actions on white and tinted surfaces |
| Teal dark | `#075f51` | Hover states |
| Cyan | `#e4f6f7` | Chat accent surface |
| Blue | `#e8f0fc` | Websites accent surface |
| Purple | `#f0eafb` | Video accent surface |
| Error | `#b42318` | Errors |
| Focus | `#067a67` | 2–3px visible focus ring with offset |

## Typography

Poppins is the display face; Inter is body/UI. Both are loaded through `next/font` with sensible fallbacks and only needed weights. Use fluid `clamp()` display sizes, approximately 48–76px homepage hero desktop and 40px narrow mobile, 30–48px section titles, 18–20px lead copy, 16px body and 14px labels. Article body targets 18px/1.75 and 65–75 characters per line. Never embed meaningful page or interface text in AI-generated/raster artwork; the deterministic social-card image is a social-metadata exception, not a substitute for HTML content.

## Spacing and layout

Base spacing unit 4px; common steps 8, 12, 16, 24, 32, 48, 64, 80, 112. Content max width 1200–1280px; reading measure 680–760px. Mobile gutters 20px, tablet 32px, desktop 40px. Section vertical rhythm 72px mobile / 112px desktop. Avoid placing every item in a rounded container.

## Shape, border and elevation

Use 10–16px radii for controls/cards and 20–24px only for major product artboards. Default cards use borders rather than shadows. Shadows are sparse and low-contrast for floating navigation or layered product visuals. Pills are reserved for statuses/tags, not every heading.

## Components

- **Button:** primary dark teal/ink or teal, secondary white bordered, tertiary text link. Minimum 44px height for key actions, visible hover/active/focus/disabled states.
- **Link:** descriptive text; underline offset in prose; icon arrows are decorative.
- **Section heading:** small uppercase/ruled eyebrow, strong H2, concise optional lead.
- **Product visual:** semantic HTML/CSS/SVG with accessible summary and decorative children hidden where redundant.
- **Accordion:** native button semantics, `aria-expanded`, associated panel and keyboard access.
- **Form:** persistent visible labels, helpful hints, field-level errors and honest pending/success copy.
- **Badge:** text plus color; never color-only status.
- **Table:** real headers, caption where useful, responsive overflow labelled for keyboard users.

## Iconography and assets

Lucide icons use consistent 1.75–2px strokes and are decorative when text duplicates meaning. Original logo is a geometric four-part mark paired with real HTML/SVG wordmark. No emoji icons.

## Motion

Framer Motion provides only a small transform reveal in the current public site; menu/accordion transitions remain brief. Default 160–240ms UI feedback; no perpetual decorative motion. Reveals start visible, and CSS/Framer reduced-motion handling removes nonessential transforms. Content remains visible without JavaScript.

## Responsive behavior

Mobile-first single column; product visuals stack after copy. At 768px navigation and selected two-column layouts expand. At 1024px editorial splits and four-part ecosystem can use full composition. Pricing becomes three columns only when each remains readable. See `responsive-design.md` for acceptance widths.

## Dashboard extension

The application retains the same tokens and typography; no dark admin theme is introduced. Desktop sidebar width is 248px expanded and 76px icon-collapsed. Top-bar controls remain at least 44px where practical. Main content uses 16px mobile, 24px tablet and 32px desktop gutters with a readable maximum width for overview/workspace pages; editor canvases may use the available width without widening text controls.

Dashboard-specific primitives:

- **Page header:** compact eyebrow/breadcrumb, 28–36px Poppins H1, concise description and one contextual primary action.
- **Panel:** white background, `line` border, 14–18px radius and little/no shadow. Use panels for meaningful regions, not every small statistic.
- **Status badge:** icon/text plus color for fixture, queued, processing, completed, failed, draft and published states.
- **Model selector:** native labelled select with provider, capability and fixture-availability details; Auto is clearly a routing option.
- **Composer/editor:** visible label, generous multiline area, attachment/action row and honest pending/preview feedback.
- **Empty/error state:** concise title, explanation and recovery action; never fabricated filler activity.
- **Data display:** desktop tables with real headers; mobile cards or a labelled scroll region where table semantics are necessary.
- **Dialog/drawer:** labelled title, close control, Escape/focus handling and destructive confirmation where required.

Fixture labels use neutral/dark text with an info icon, not a warning-heavy visual treatment. Demo balances and progress never acquire the appearance of verified live data through copy alone.

## Administration extension

Admin retains the same color/font/focus tokens and adds a 264px desktop sidebar, compact operational header and data-dense workspace. Numeric columns use tabular numerals and right alignment; identifiers wrap safely. Status colors reuse accessible dark teal, amber-brown, blue-teal, gray and error tokens with text labels.

Admin-specific primitives:

- **Metric:** plain label, fixture value, unit/range and concise definition; no unsupported trend percentages.
- **Toolbar/results:** visible search/filter labels, filtered item count, reset action and bottom pagination.
- **Operational table:** native headers/caption, consistent alignment and named keyboard-focusable overflow region; no incomplete ARIA grid.
- **Trend figure:** readable units/axes, direct series labels or compact legend, concise summary and equivalent values table.
- **Detail/review dialog:** safe DTO summary, focused task, internal scrolling, Escape/focus return and two-step confirmation for privileged intents.
- **Preview audit event:** actor/action/target/reason/time with a persistent non-persistent label, visually distinct from operational success.

See `admin-design.md` for hierarchy and content rules.
