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

## Prompt 3 dashboard requirements

- The mobile sidebar is a labelled modal dialog with Escape/overlay close, focus return and close-on-navigation. Desktop collapse retains accessible names/tooltips for icon-only links.
- Top-bar menus, notifications, model selectors, dialogs, tabs and device-mode controls use native or Radix keyboard semantics. Focus is not hidden behind sticky bars.
- Dynamic conversation/website content has one H1 and meaningful breadcrumb labels. Unknown IDs show a workspace-safe not-found view rather than empty anonymous content.
- Message streaming/status regions announce only meaningful state changes; partial fixture text is not repeatedly announced. Stop, regenerate and copy have stable names and honest results.
- Code is rendered as text, never raw HTML. Code blocks and message bodies wrap or use scoped scrolling without causing page-level two-dimensional scrolling.
- File inputs have visible labels and local-only selection feedback; no upload progress is fabricated. Media has useful alt text and full-screen dialogs have accessible titles/descriptions.
- Queued/processing/completed/failed states use icon and text. Static progress bars expose accurate fixture values and never auto-advance. A still frame is not announced as a playable video.
- Website page/section/editor controls remain reachable at 320px. Preview resizing does not remove access to settings, save/publish feedback or code controls.
- Filter/search results and no-results states use polite announcements where useful. Delete/account-deletion requests require clear confirmation and do not report completion.
- Test every application route at 320, 390, 768, 1024 and 1440px, plus keyboard drawer/menu/dialog operation and axe scans of representative product/editor/error states. Real screen-reader, forced-colors and 200/400% zoom review remain separate limitations.

## Prompt 4 administration requirements

- Use native tables with real headers/captions and ordinary tabbable controls. Do not add `role="grid"` unless the full composite directional-keyboard model is implemented and tested.
- Wide tables use a named keyboard-focusable scroll region; filter/search controls have persistent labels, result counts are announced politely and pagination has explicit names/state.
- Charts include readable units, a concise textual summary and an expandable values table. Status and chart series never rely on color alone or hover-only tooltips.
- Global search, mobile navigation, notifications, profile menus, detail/edit dialogs and two-step confirmations support keyboard operation, Escape and logical focus return.
- Privileged actions associate reasons/errors with fields, focus invalid input where appropriate and review the exact target/consequence before confirmation. Initial/final focus does not favor destructive completion.
- Dynamic no-operation/audit-preview feedback uses one appropriate status region and says no real user/payment/provider/job/package/preference/audit/credit change occurred as applicable.
- Long identifiers, money and diagnostics remain readable at 320px and with text scaling. Customer code/files/secrets are excluded rather than merely visually hidden.
- Test every admin route at 320, 390 and 1440px, every route with axe, keyboard drawers/dialogs/forms, filtered empty states and actual unknown-route 404 statuses. Real screen-reader, forced-colors, 200/400% zoom and real-device reviews remain separate limits.

## Prompt 1 review evidence

On 2026-11-05, ESLint and Playwright accessible-name/keyboard tests passed, including mobile Escape close and focus return, FAQ state, visible labels and reduced motion. Axe reported zero violations across all 23 rendered public/auth-preview routes for the selected WCAG 2/2.1/2.2 A/AA tags in tested Chromium states. Representative visual review covered mobile, tablet and desktop. Contrast and reduced-motion defects found during inspection were fixed and retested.

Automated scans cannot certify full WCAG conformance. Real screen readers, a complete tab-order audit, 200% zoom/reflow, high-contrast/forced-colors modes and real-device testing remain launch-stage work. See `quality-assurance.md` for exact scope and results.
