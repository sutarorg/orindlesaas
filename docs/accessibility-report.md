# Accessibility evaluation report

Status: **automated public-route evaluation passed in the observed browser scope; WCAG 2.2 AA conformance and the accessibility launch gate are NOT MET**. Named assistive technology, authenticated journeys, physical devices, and several manual criteria remain unexecuted. Procedure: `accessibility-test-plan.md`.

## Executed evidence

- Production-build Playwright evaluated all **21 indexable routes** with axe-core using WCAG 2 A/AA, 2.1 AA and 2.2 AA tags. The successful five-project CI matrix in run `42069035875` covered Chromium, Firefox, WebKit, Mobile Chrome emulation and Mobile Safari emulation; no axe violations were reported in those runs.
- The final local pre-font-correction Chromium suite passed **80/80**, including all 21 route-level axe tests. Subsequent font rendering changed no semantics; all five browser projects passed final application CI run `42074366023`.
- Four viewport tests visited every public route at **320, 390, 768 and 1440 CSS px**, asserted no document-level horizontal overflow, checked visible native buttons against 24×24 CSS px minima, and collected page errors.
- Browser journeys exercised mobile-dialog keyboard open/Escape close/focus return, login invalid-field focus, password visibility by keyboard, checkbox Space operation, FAQ expanded state, skip-link behavior, visible controls, labels, headings and reduced-motion content visibility.
- Lighthouse 13.6.0 reported accessibility **100** for the repeated home, pricing, article and login mobile/desktop lab matrix. This is supporting evidence only and does not replace axe or manual review.
- Production anonymous customer/admin/API checks established that private content is not exposed. A login redirect is not positive authenticated accessibility evidence.

## Results and limits

| Method | Observed scope | Result |
|---|---|---|
| axe Playwright | 21 public routes; five managed browser/emulation projects | PASS: zero detected violations in the observed states |
| Keyboard/focus/status | Named public, navigation and authentication interactions above | PASS for scripted interactions only |
| Reflow/target size/page errors | 21 public routes at four widths; additional complex/auth route checks | PASS for scripted assertions |
| Reduced motion | Hero/revealed content and route-level axe setup | PASS for scripted visibility; no claim about every animation preference |
| Lighthouse accessibility | Four routes × two profiles × three trials | 100 in the retained final matrix |
| Authenticated customer/admin states | Real verified identities and representative data | BLOCKED: no hosted Supabase credentials |
| Complete knowledgeable WCAG 2.2 review | Every applicable criterion, including non-color cues, text spacing, 200/400% zoom, focus obscured, dragging, consistent help and accessible authentication | NOT COMPLETE; no manual certification claimed |
| Forced-colors/high-contrast and named screen readers | NVDA/VoiceOver/TalkBack with named OS/browser journeys | BLOCKED/NOT RUN |
| Physical touch, orientation and mobile AT | Named Android/iOS hardware | BLOCKED |

No reproduced accessibility product defect was found by the executed automated corpus. That absence is not proof that no barrier exists. In particular, target-size automation inspected native buttons rather than every link or custom target, and automated reflow does not equal browser zoom, text-spacing or screen-reader review.

## Decision

**Automated accessibility regression gate: PASS in the stated scope. Accessibility launch gate: NOT MET.** Before launch, a knowledgeable reviewer must execute the remaining WCAG 2.2 AA checklist on public and authenticated states, record criterion-level results, test named AT and physical devices, and retest any defect. Automated zero violations must never be presented as full conformance or certification.
