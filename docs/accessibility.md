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

## Prompt 2 authentication requirements

- Login/password flows support browser and third-party password managers, standard autocomplete tokens and copy/paste. Do not add CAPTCHA, puzzles, disabled paste or forced one-time-code transcription (WCAG 2.2 SC 3.3.8).
- Every input has a persistent label and programmatic name. Hints/errors are connected with `aria-describedby`; invalid controls use `aria-invalid`. Placeholder text is never the only instruction.
- On failed submit, show a concise form-level alert and field-specific correction guidance, then focus the first invalid control. Do not validate aggressively on every keystroke; password length guidance may update without announcing a security score.
- Show/hide password is a native button with an accessible name that changes between “Show password” and “Hide password,” plus `aria-pressed`. It must not move focus or clear the input.
- Busy controls retain a stable accessible name and expose `aria-busy`/disabled state as appropriate. Mock results use a polite status region; errors use an alert without repeated announcements.
- Native links handle signup/login/recovery navigation. OAuth and visibility controls work with Enter/Space. Consent and remember-me use native checkbox semantics and never ship prechecked.
- Error, success-preview and expiry states use icon + text, not color alone. Mobile forms maintain 44px targets and no horizontal overflow.

Prompt 2 validation must include unit validation/component tests, keyboard/password-visibility E2E, mobile/desktop visual inspection and axe scans for every auth route and allowlisted state. Actual screen-reader and 200% zoom testing remain separately recorded limitations.

## Prompt 2 review evidence

On 2026-11-05, 24/24 unit/component tests and 40/40 production Playwright tests passed. Auth-specific browser coverage verified first-invalid focus, keyboard password visibility and checkbox operation, loading/results, all required state designs and no auth-like storage keys. Thirteen auth route/state axe scans reported zero violations for selected WCAG 2/2.1/2.2 A/AA tags. Nine auth routes/states passed overflow checks at 320, 390 and 1440px, and four representative states were visually inspected.

Nested live-region duplication was removed during final review so each mock result has one status/alert region. Automated checks do not establish screen-reader compatibility or WCAG certification; real assistive-technology and 200% zoom review remain open.

## Prompt 1 review evidence

On 2026-11-05, ESLint and Playwright accessible-name/keyboard tests passed, including mobile Escape close and focus return, FAQ state, visible labels and reduced motion. Axe reported zero violations across all 23 rendered public/auth-preview routes for the selected WCAG 2/2.1/2.2 A/AA tags in tested Chromium states. Representative visual review covered mobile, tablet and desktop. Contrast and reduced-motion defects found during inspection were fixed and retested.

Automated scans cannot certify full WCAG conformance. Real screen readers, a complete tab-order audit, 200% zoom/reflow, high-contrast/forced-colors modes and real-device testing remain launch-stage work. See `quality-assurance.md` for exact scope and results.
