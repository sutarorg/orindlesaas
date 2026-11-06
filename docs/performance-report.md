# Performance evaluation report

Status: **exact-revision local lab gates pass after the TEST-007 hydration remediation; the replacement final-HEAD CI retest is pending**. Field Core Web Vitals and private/provider performance remain unavailable. Final detailed local matrix: application revision `4244b6962a1506316e559efaa4ef8436c61c0f47`, **24/24 PASS**. Overall release readiness remains **NO-GO**.

## Method and environment

- `npm run test:performance` / Lighthouse **13.6.0**, three cold-load trials for each route/profile: **24 complete JSON + HTML reports**; no best-run selection.
- Production Next.js server on local Linux x64, Node **22.22.3**, HeadlessChrome **153.0.8010.0**. Simulated mobile uses 150ms RTT, approximately 1.6Mbps throughput, 4× CPU slowdown and 412×823 emulation. Desktop uses Lighthouse's desktop preset. Full per-run settings are in each JSON report.
- The harness retains every trial, calculates medians/ranges, and exits nonzero on any unreviewed budget failure. Reports are retained in ignored `performance-results/`, outside Playwright's cleanup path; CI uploads that directory as `performance-lab`.
- The earlier exact-`3c0f0f5` reports are archived under `performance-results/archive-3c0f0f5/`; the current root summary and reports carry `4244b6962a1506316e559efaa4ef8436c61c0f47`.

## Reproduced LCP failure and earlier correction

Before QA-010, a full local matrix on the structured-data revision failed home/mobile: LCP trials were **3,347.7ms, 3,328.2ms and 919.1ms** (median **3,328.2ms**, performance median **92**), while FCP remained about 920ms. The late body-font swap could trigger a new largest-text paint after the initial contentful paint.

QA-010 changed Inter from `display: "swap"` to `display: "optional"`, preventing a late swap while retaining the local font and fallback. The corrected code passed two complete 24/24 local matrices and the performance job in run `42074366023`. This remains scoped lab evidence, not proof of field LCP.

## TEST-007: retained CI failures and hydration remediation

- Run `42082108844` failed `/pricing` mobile at median **TBT 202ms** versus the unchanged 200ms budget (performance 97, LCP 912.8ms, CLS 0, SEO 100). Six additional same-application local pricing/mobile audits passed with TBT **45.5–59ms**; those local passes did not erase the CI failure.
- Run `42084593285` on `cd6775b` subsequently passed all nine jobs. Creating PR #6 triggered a fresh `pull_request` run, `42086200854`, on the same commit. That run failed again: home/mobile median TBT **228ms**, pricing/mobile **240ms**, and article/mobile **208ms**. Per-trial annotations preserved every value. Desktop Chromium installation also exhausted its bounded retry, so no desktop-Chromium test result is claimed from that run.
- The repeated failures showed that the earlier green run was not sufficient evidence of a stable margin. Application revision `4244b69` removes unnecessary public hydration: static button-links are server-rendered, the Products disclosure uses the native Popover API, mobile navigation uses a small native-dialog controller, FAQs use named native `<details>`, and public reveals are CSS-only. Richer authenticated admin/dashboard Radix interactions are unchanged.
- The budget, route/profile corpus and three-trial median rule are unchanged. The exact-`4244b69` matrix below passes 24/24. The replacement final-HEAD CI run must also pass before TEST-007 can be closed for the observed lab scope.

## Final observed local medians — exact `4244b69`

| Route | Profile | Performance (range) | A11y | Best practices | SEO | LCP ms | CLS | TBT ms | Requests / transfer | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | Mobile | 100 (99–100) | 100 | 100 | 100 | 917.4 | 0 | 81.7 | 23 / 313,175 B | PASS |
| `/` | Desktop | 100 (100–100) | 100 | 100 | 100 | 265.4 | 0 | 0 | 31 / 336,478 B | PASS |
| `/pricing` | Mobile | 99 (99–100) | 100 | 100 | 100 | 915.7 | 0 | 92 | 24 / 297,899 B | PASS |
| `/pricing` | Desktop | 100 (100–100) | 100 | 100 | 100 | 258.8 | 0 | 0 | 33 / 331,954 B | PASS |
| `/blog/gpt-vs-claude-vs-gemini` | Mobile | 100 (100–100) | 100 | 100 | 100 | 912.8 | 0 | 73 | 21 / 304,427 B | PASS |
| `/blog/gpt-vs-claude-vs-gemini` | Desktop | 100 (100–100) | 100 | 100 | 100 | 255.8 | 0 | 0 | 31 / 332,526 B | PASS |
| `/login` | Mobile | 100 (93–100) | 100 | 100 | 66 | 938.6 | 0 | 51.5 | 24 / 369,120 B | PASS with reviewed noindex exception |
| `/login` | Desktop | 100 (100–100) | 100 | 100 | 66 | 258.5 | 0 | 0 | 38 / 413,748 B | PASS with reviewed noindex exception |

Every indexable route met SEO 100. `/login` is intentionally noindex; every login trial's sole SEO deduction was `is-crawlable`. Its score remains visible and the exception cannot apply to an indexable route.

One login/mobile trial had simulated LCP **3,179ms** even though the group's three-trial median was **938.6ms** and passed the median budget. The same trial's observed trace LCP was **186ms** (observed FCP 145ms), so this was not evidence of a second late observed paint. The outlier remains in the JSON/HTML reports and in the visible performance range; it was not deleted or replaced.

## Resource and diagnostic review

- Across the eight route/profile groups, median observed resources ranged from **21–38 requests** and **297,899–413,748 transferred bytes**. The three public audited routes each dropped three requests and approximately **73–75KB** versus the retained `3c0f0f5` medians; login dropped three requests and approximately **75KB**.
- Pricing/mobile median TBT changed from **117ms to 92ms**, and article/mobile from **79ms to 73ms**. Home/mobile changed from **74ms to 81.7ms**, within the observed run-to-run variance; no across-the-board TBT improvement is claimed.
- No third-party request origin was observed. Fonts and site assets were served by the application origin.
- All groups met median performance ≥90, accessibility/best-practices ≥95, indexable SEO ≥95, LCP ≤2.5s, CLS ≤0.1 and TBT ≤200ms budgets.
- Mobile LCP medians were **912.8–938.6ms**, desktop **255.8–265.4ms**; mobile TBT medians **51.5–92ms**, desktop **0ms**.
- An earlier harness-budget error treated intentional noindex `/login` like an indexable page. It was corrected without hiding its SEO 66, and the full matrix was rerun. Separately, Playwright had deleted Lighthouse output under `test-results/`; the dedicated artifact directory and CI path now preserve reports (TEST-006).

## Limits and remaining gates

TBT is not INP. These are simulated lab results, not a production speed guarantee or real-user p75 data. No separate scripted critical-interaction long-task trace, authenticated/admin performance run, live AI/provider latency measurement, or privacy-approved RUM/dashboard/alert configuration has been produced. Field LCP/INP/CLS, Search Console and provider-invoice/latency evidence remain unavailable.

## Decision

**Exact-`4244b69` local Lighthouse/resource gate: PASS, 24/24. Replacement final-HEAD CI gate: OPEN pending the current PR run. Overall performance/field-monitoring launch gate: NOT MET.** A local 99–100 score does not substitute for interaction, private/provider, field-CWV or operational monitoring evidence.
