# Performance evaluation report

Status: **key-route Lighthouse lab gate passed; field Core Web Vitals and private/provider performance are not available**. Evidence revision: `7ba4bc7dcf31e80c93a402f63f54b3fc4d6805c2` (application code unchanged by the subsequent artifact-path-only correction).

## Method and environment

- `npm run test:performance` / Lighthouse **13.6.0**, three cold-load trials for each route/profile: **24 complete JSON + HTML reports**.
- Production Next.js server on local Linux x64, Node **22.22.3**, HeadlessChrome **153.0.8010.0**; independent CI performance jobs also passed in runs `42067360809` and `42069035875`.
- Simulated mobile profile: 150ms RTT, approximately 1.6Mbps throughput, 4× CPU slowdown, 412×823 emulation. Desktop uses Lighthouse's desktop preset. Full per-run settings are in each JSON report.
- No best-run selection: the harness retains every trial, calculates medians/ranges, and exits nonzero on any unreviewed budget failure.
- Reports are retained in ignored `performance-results/`; this dedicated path prevents Playwright startup from deleting Lighthouse evidence. CI uploads the same directory as `performance-lab`.

## Observed local medians

| Route | Profile | Performance (range) | A11y | Best practices | SEO | LCP ms | CLS | TBT ms | Requests / transfer | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | Mobile | 100 (100–100) | 100 | 100 | 100 | 919.8 | 0 | 72.6 | 26 / 386,831 B | PASS |
| `/` | Desktop | 100 (100–100) | 100 | 100 | 100 | 263.4 | 0 | 0 | 34 / 409,559 B | PASS |
| `/pricing` | Mobile | 100 (99–100) | 100 | 100 | 100 | 915.4 | 0 | 52.5 | 27 / 372,658 B | PASS |
| `/pricing` | Desktop | 100 (100–100) | 100 | 100 | 100 | 260.3 | 0 | 0 | 36 / 404,016 B | PASS |
| `/blog/gpt-vs-claude-vs-gemini` | Mobile | 99 (99–100) | 100 | 100 | 100 | 915.0 | 0 | 101.0 | 24 / 379,564 B | PASS |
| `/blog/gpt-vs-claude-vs-gemini` | Desktop | 100 (100–100) | 100 | 100 | 100 | 266.7 | 0 | 0 | 34 / 406,602 B | PASS |
| `/login` | Mobile | 100 (100–100) | 100 | 100 | 66 | 768.1 | 0 | 63.5 | 27 / 444,283 B | PASS with reviewed noindex exception |
| `/login` | Desktop | 100 (100–100) | 100 | 100 | 66 | 221.2 | 0 | 0 | 41 / 488,173 B | PASS with reviewed noindex exception |

Every indexable route met SEO 100. `/login` is intentionally noindex; every login trial's sole SEO deduction was `is-crawlable`. Its score remains visible and the exception cannot apply to an indexable route.

## Resource and diagnostic review

- Across the eight route/profile groups, medians ranged from **24–41 requests** and **372,658–488,173 transferred bytes** in this local profile.
- No third-party request origin was observed in any measured group. Fonts and site assets were served by the application origin.
- All groups met median performance ≥90, accessibility/best-practices ≥95, indexable SEO ≥95, LCP ≤2.5s, CLS ≤0.1 and TBT ≤200ms budgets.
- The first matrix exposed a test-budget error for noindex `/login`, not a performance regression. It was corrected and the complete 24-audit matrix rerun; the CI performance job independently passed.

## Limits and remaining gates

TBT is not INP. These are simulated lab results, not a production speed guarantee or real-user p75 data. No separate scripted critical-interaction long-task trace, authenticated/admin performance run, live AI/provider latency measurement, or privacy-approved RUM/dashboard/alert configuration has been produced. Field LCP/INP/CLS, Search Console and provider-invoice/latency evidence remain unavailable.

## Decision

**Repeated public-route Lighthouse and observed-resource gate: PASS. Overall performance/field-monitoring launch gate: NOT MET.** A local 99–100 score does not substitute for interaction, private/provider, field-CWV or operational monitoring evidence.
