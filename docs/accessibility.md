# Accessibility

Target: WCAG 2.2 AA for the public website.

## Semantics and structure

Use `header`, `nav`, `main`, `article`, `aside` and `footer` appropriately, one H1 per page and logical heading levels. Include a skip link to main content. Lists represent lists; buttons perform actions and links navigate. SVG decorations are hidden from assistive technology; informative visuals have concise text alternatives or adjacent equivalent explanations.

## Keyboard and focus

All menus, accordions, forms and CTAs work by keyboard. Focus indicators use a high-contrast ring and are not removed. Mobile navigation returns focus to its trigger on close, handles Escape and does not leave hidden links focusable. Anchor targets have scroll margin. No keyboard traps or hover-only information.

## Visual

Normal text contrast targets 4.5:1 and large text 3:1. Mint is not used for small text on white; dark teal carries text. Body text remains readable at 200% zoom and with increased spacing. Touch targets aim for 44px, exceeding WCAG 2.2's 24px AA minimum where practical. Color is never the only availability/error signal.

## Motion and interaction

Respect `prefers-reduced-motion`; avoid autoplaying media and parallax. Animation never delays reading or navigation. Form errors are associated with inputs and announced appropriately. Loading states retain accessible names and do not repeatedly announce decorative changes.

## Content

Use plain language, descriptive link text, meaningful alt text and captions/transcripts if real media is later introduced. Article tables have headers. External links are identifiable in prose where context is not sufficient; opening new tabs is avoided.

## Prompt 1 review evidence

On 2026-11-05, ESLint and Playwright accessible-name/keyboard tests passed, including mobile Escape close and focus return, FAQ state, visible labels and reduced motion. Axe reported zero violations across all 23 rendered public/auth-preview routes for the selected WCAG 2/2.1/2.2 A/AA tags in tested Chromium states. Representative visual review covered mobile, tablet and desktop. Contrast and reduced-motion defects found during inspection were fixed and retested.

Automated scans cannot certify full WCAG conformance. Real screen readers, a complete tab-order audit, 200% zoom/reflow, high-contrast/forced-colors modes and real-device testing remain launch-stage work. See `quality-assurance.md` for exact scope and results.
