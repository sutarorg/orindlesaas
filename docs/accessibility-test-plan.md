# WCAG 2.2 AA accessibility verification plan

Status: **automated browser/keyboard/reflow scope executed; complete manual WCAG and named-AT review remains blocked; target, not certification**. Observed results are in `accessibility-report.md`. WCAG 2.2 is the normative target. W3C explicitly notes that no tool alone determines accessibility; axe, Lighthouse, and browser assertions are combined with knowledgeable manual review and named assistive technology when available.

## Route/state sample

The complete public launch set and all six articles are in scope, not only representative pages. Include every auth route and form state, 404/error states, mobile/desktop navigation, contact feedback, and every customer/admin route and meaningful state once test identity/data is available. Credential-free redirects do not count as authenticated accessibility evidence.

## Automated browser checks

For every route/state:

- Run current axe Playwright with WCAG 2/2.1/2.2 A/AA tags; retain JSON, rule IDs, impacted nodes, browser/route/viewport, and revision.
- Require zero serious/critical violations and review every moderate/minor result rather than hiding rules or broadly disabling checks.
- Assert one visible H1, logical landmarks, unique page title, valid labels/names/roles, native table semantics, valid ARIA references, and image alternatives.
- Check browser console/page errors and horizontal page overflow at target widths.

Automated zero means **zero detected violations in that state**, not full conformance.

## Manual WCAG 2.2 AA checklist

| Area | Review |
|---|---|
| Perceivable | Text/non-text alternatives, meaningful sequence, headings/lists/tables, sensory characteristics, orientation, contrast, non-text contrast, resize/reflow 320px/400%, text spacing, images of text, media alternatives if real media exists |
| Operable | Full keyboard and no trap, skip link, focus order/visible/not obscured, pointer gestures/cancellation, target size 24px criterion plus 44px product aim, drag alternatives where present, timeouts/motion/autoplay |
| Understandable | Language/title/link purpose/headings/labels, consistent navigation/identification, instructions, errors/suggestions/prevention, redundant entry, accessible authentication, status messages |
| Robust | Valid name/role/value, native controls before ARIA, states/properties updated programmatically, no incomplete ARIA grid pattern |

Record applicable success-criterion IDs for defects and explicitly mark not-applicable rationale (for example, no real audio/video). Do not mark untested criteria passed.

## Keyboard and focus script

1. From the address bar, Tab to the skip link, activate it, and continue through header/products/mobile navigation, main content, and footer.
2. Open/close menus, accordions, dialogs, drawers, tabs, model/device controls, and confirmations with Enter/Space/Escape and expected arrow behavior where a composite widget claims it.
3. Verify focus is visible, not obscured by sticky UI, contained only for true modals, returned to the invoker, and moved to the first invalid field on failed forms.
4. Check status/filter/loading/error announcements use one suitable live region without repeated streaming chatter.
5. Ensure no hidden menu/control remains tabbable and no hover/pointer-only operation lacks a keyboard alternative.

## Visual, zoom, motion, and cognitive checks

- Test 200% and 400% browser zoom, 320 CSS px reflow, increased text spacing, long titles/IDs/prices/errors, and browser minimum font settings.
- Check normal text 4.5:1, large text 3:1, meaningful non-text UI 3:1; color is never the only status/error cue.
- Emulate reduced motion and confirm reveals remain visible without transforms/autoplay/parallax; animation never blocks reading.
- Review plain-language instructions, persistent labels/hints, password-manager/paste support, no CAPTCHA/puzzle/transcription requirement, unchecked consent, and accessible error recovery.
- Inspect forced-colors/high-contrast mode, 24px targets/spacing and 44px primary controls, pointer cancellation, and touch exploration.

## Assistive-technology matrix

Currently unexecuted and **Blocked until named tools/testers are available**:

- NVDA + current Firefox or Chrome on Windows for public/auth and critical customer journey.
- VoiceOver + Safari on macOS/iOS for navigation, forms, dialogs, dynamic status, tables, and website preview.
- TalkBack + Chrome on Android for mobile navigation/forms/status where a device is available.
- Keyboard-only and, where available, switch/voice-control review for pointer alternatives.

Record AT/browser/OS versions, exact spoken/focus behavior, route, test account type, and evidence. Do not claim screen-reader compatibility from DOM assertions.

## Defect and exit rules

A keyboard trap, inaccessible critical workflow, missing name/role on a critical control, untrusted preview access to app credentials, or unreadable critical content is P0/P1 according to impact and blocks launch. All serious/critical automated findings and known critical manual barriers must be fixed and retested in the original state plus responsive regressions. Final reporting lists residual untested AT/criteria and never calls the product “WCAG certified.”
