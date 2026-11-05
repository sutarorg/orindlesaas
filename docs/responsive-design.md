# Responsive design

## Mobile-first rules

Start at 320px with a single-column reading flow, 20px gutters and no fixed-width artwork. Use fluid type and `minmax(0, 1fr)` in grids. Interactive targets aim for at least 44×44px. Navigation disclosure does not obscure the current focus and can be closed with Escape. Product visuals use intrinsic aspect ratios and shrink without clipping meaningful content.

## Test widths

| Class | Widths to inspect | Expected behavior |
|---|---|---|
| Narrow mobile | 320, 360 | No overflow; compact header; stacked CTAs where needed |
| Standard mobile | 390, 430 | Comfortable hero and pricing; readable article measure |
| Tablet | 768, 834 | Expanded grids where useful; mobile/desktop nav threshold verified |
| Laptop | 1024, 1280 | Full navigation and editorial two-column sections |
| Large desktop | 1440, 1920 | Content remains bounded; no excessively long lines |

## Component adaptation

- Header: Products disclosure and CTA simplify before links become crowded; mobile menu is a client island.
- Hero ecosystem: desktop connected composition becomes stacked or 2×2 only when labels remain legible; no tiny scaled-down desktop screenshot.
- Product chapters: alternating desktop layouts all follow logical copy-first DOM order on mobile.
- Pricing: cards stack on mobile, may use 3 columns from desktop; pack price/credits remain adjacent.
- Tables: use a labelled horizontal scroll region only when content cannot reflow without losing meaning; page itself never scrolls horizontally.
- Article: TOC precedes body on mobile and may become a slim sticky rail on wide screens; anchor scrolling respects sticky header and reduced motion.
- Footer: columns collapse to 2 and then 1 based on available width.

## Media and layout stability

Explicit dimensions/aspect ratios prevent CLS. Fonts use fallbacks with similar metrics. No content depends on hover. Test 200% zoom and long titles. Use `overflow-wrap` for URLs and examples.

## Validation evidence

On 2026-11-05, Playwright asserted `document.documentElement.scrollWidth <= window.innerWidth` on `/`, `/pricing`, `/models`, `/features/ai-image-generator` and `/blog/gpt-vs-claude-vs-gemini` at 320, 390, 768, 1024 and 1440px: all 25 combinations passed. Narrow CTA/table defects found by this test were corrected with wrapping and constrained grid tracks rather than hiding page overflow.

Representative visual inspection covered the homepage at 1440 and 390px, full mobile pricing at 390px, desktop article at 1440px, models at 768px and Image Studio at 390px. Product visuals remained readable and content followed the intended stacking order. Additional 360/430/834/1280/1920 widths, 200% zoom and real-device testing remain launch-stage checks; no untested width is claimed as manually inspected.
