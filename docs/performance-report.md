# Performance evaluation report

Status: **repeated key-route Lighthouse lab gate passed after QA-010 correction; field Core Web Vitals and private/provider performance are not available**. Final detailed local matrix: application revision `3c0f0f5c6bff7dbb6bc3baa552b62be3263de51d`, **24/24 PASS**. Final CI status is indexed in `handoff-final.md`.

## Method and environment

- `npm run test:performance` / Lighthouse **13.6.0**, three cold-load trials for each route/profile: **24 complete JSON + HTML reports**; no best-run selection.
- Production Next.js server on local Linux x64, Node **22.22.3**, HeadlessChrome **153.0.8010.0**. Independent CI performance jobs passed in runs `42067360809` and `42069035875`; run `42071353363` later failed its performance job on the pre-QA-010 application revision. The corrected final application run `42074366023` passed performance and retained an approximately 14 MB `performance-lab` artifact.
- Simulated mobile profile: 150ms RTT, approximately 1.6Mbps throughput, 4× CPU slowdown, 412×823 emulation. Desktop uses Lighthouse's desktop preset. Full per-run settings are in each JSON report.
- The harness retains every trial, calculates medians/ranges, and exits nonzero on any unreviewed budget failure. Reports are retained in ignored `performance-results/`, outside Playwright's cleanup path; CI uploads that directory as `performance-lab`.

## Reproduced LCP failure and correction

Before the correction, a full local matrix on the structured-data revision failed home/mobile: LCP trials were **3,347.7ms, 3,328.2ms and 919.1ms** (median **3,328.2ms**, performance median **92**), while FCP remained about 920ms. This was a genuine budget failure, not discarded as noise. The late body-font swap could trigger a new largest-text paint after the initial contentful paint.

QA-010 changed only Inter from `display: "swap"` to `display: "optional"`, preventing a late swap while retaining the local font and fallback. The corrected code passed a complete 24-audit retest and then the repeated revision-labelled matrix below. This is scoped lab evidence, not proof of field LCP.

## Final observed local medians

| Route | Profile | Performance (range) | A11y | Best practices | SEO | LCP ms | CLS | TBT ms | Requests / transfer | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | Mobile | 100 (99–100) | 100 | 100 | 100 | 917.5 | 0 | 74 | 26 / 386,218 B | PASS |
| `/` | Desktop | 100 (100–100) | 100 | 100 | 100 | 278.2 | 0 | 0 | 34 / 409,554 B | PASS |
| `/pricing` | Mobile | 99 (99–100) | 100 | 100 | 100 | 913.3 | 0 | 117 | 27 / 373,022 B | PASS |
| `/pricing` | Desktop | 100 (100–100) | 100 | 100 | 100 | 260.5 | 0 | 0 | 36 / 404,270 B | PASS |
| `/blog/gpt-vs-claude-vs-gemini` | Mobile | 100 (99–100) | 100 | 100 | 100 | 913.6 | 0 | 79 | 24 / 379,545 B | PASS |
| `/blog/gpt-vs-claude-vs-gemini` | Desktop | 100 (100–100) | 100 | 100 | 100 | 257.9 | 0 | 0 | 34 / 406,186 B | PASS |
| `/login` | Mobile | 100 (99–100) | 100 | 100 | 66 | 768.1 | 0 | 51 | 27 / 444,269 B | PASS with reviewed noindex exception |
| `/login` | Desktop | 100 (100–100) | 100 | 100 | 100 | 220.6 | 0 | 0 | 41 / 488,172 B | PASS with reviewed noindex exception |

Every indexable route met SEO 100. `/login` is intentionally noindex; every login trial's sole SEO deduction was `is-crawlable`. Its score remains visible and the exception cannot apply to an indexable route.

## Resource and diagnostic review

- Across the eight route/profile groups, median observed resources ranged from **24–41 requests** and **373,022–488,172 transferred bytes** in this local profile.
- No third-party request origin was observed. Fonts and site assets were served by the application origin.
- All groups met median performance ≥90, accessibility/best-practices ≥95, indexable SEO ≥95, LCP ≤2.5s, CLS ≤0.1 and TBT ≤200ms budgets.
- Mobile LCP medians were **768.1–917.5ms**, desktop **220.6–278.2ms**; mobile TBT medians **51–117ms**, desktop **0ms**.
- An earlier harness-budget error treated intentional noindex `/login` like an indexable page. It was corrected without hiding its SEO 66, and the full matrix was rerun. Separately, Playwright had deleted Lighthouse output under `test-results/`; the dedicated artifact directory and CI path now preserve reports (TEST-006).

## Limits and remaining gates

TBT is not INP. These are simulated lab results, not a production speed guarantee or real-user p75 data. No separate scripted critical-interaction long-task trace, authenticated/admin performance run, live AI/provider latency measurement, or privacy-approved RUM/dashboard/alert configuration has been produced. Field LCP/INP/CLS, Search Console and provider-invoice/latency evidence remain unavailable.

## Decision

**Repeated public-route Lighthouse and observed-resource gate: PASS locally and in final application CI run `42074366023`. Overall performance/field-monitoring launch gate: NOT MET.** A local 99–100 score does not substitute for interaction, private/provider, field-CWV or operational monitoring evidence.
