# Performance and Core Web Vitals test plan

Status: **repeated public-route Lighthouse/resource scope executed; field and private/provider performance remain unavailable**. Results are in `performance-report.md`. Local/CI Lighthouse is diagnostic lab evidence only. Field Core Web Vitals require representative real-user 75th-percentile data segmented by mobile/desktop and cannot be claimed from this plan.

## Routes and environments

Minimum production-build routes: `/`, `/pricing`, `/blog/gpt-vs-claude-vs-gemini`, and `/login`; add one product page and `/blog` if time permits. Authenticated `/app`, each product, and admin require separate test-account runs later and cannot be represented by the login redirect.

Record revision, build ID, server/runtime, browser/Lighthouse versions, OS/CPU, network/CPU throttling, viewport, cache state, and whether the run is local or CI. Use the same production artifact for repeated comparisons.

## Budgets

| Measure | Lab budget / review threshold | Release interpretation |
|---|---|---|
| Lighthouse performance | Median ≥90 mobile and desktop on key public routes | P1 investigation if below after controlled repeat; not a field guarantee |
| Lighthouse accessibility / best practices / SEO | ≥95 with every deducted critical item reviewed; accessibility also requires axe/manual gates. Intentionally noindex routes such as `/login` retain their reported SEO score but pass only when `is-crawlable` is the sole SEO deduction in every trial | No score substitutes for functional/security review; the noindex exception never applies to indexable routes |
| LCP | ≤2.5s in the documented throttled lab profile | Aligns with good field threshold but is not field LCP |
| CLS | ≤0.1 | Inspect every material unexpected shift |
| TBT | ≤200ms diagnostic target | TBT is not INP |
| Measured critical interaction | No avoidable long task >200ms in the scripted standard journey; investigate poor responsiveness | Lab interaction evidence only; field INP remains separate |
| Runtime third-party requests | No unreviewed analytics/tag/widget/font request; provider calls only on explicit operation | Prevent hidden cost/privacy/performance regressions |

Field targets remain LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75 after sufficient real traffic.

## Repeatable Lighthouse procedure

1. `npm ci`, strict checks, and one production build; serve with production settings and no unrelated development process.
2. Warm only the server process, not the measured page cache unless the scenario declares warm cache. Use a fresh profile for cold-load trials.
3. Run at least three mobile and three desktop Lighthouse trials per required route; retain full JSON/HTML for every trial, not only the best.
4. Report median scores/metrics and range. Investigate high variance before treating the median as stable.
5. Inspect opportunities/diagnostics: render-blocking resources, unused JS/CSS, LCP element, layout-shift sources, long tasks, cache policy, image/font sizing, and third-party requests.

## Browser/resource review

- Inspect Next client manifests/build output and route-loaded resources for AI SDK/admin/editor code leaking into public shared bundles.
- Verify Server Components by default, small interaction islands, local subsetted fonts with stable fallback/dimensions, reserved media aspect ratios, lazy below-fold media, and no perpetual animation/layout shifts.
- Capture network/resource counts and transferred bytes by type for key routes; set a revision-specific budget only after measuring rather than inventing a kilobyte claim.
- Script Products/menu/FAQ/form interactions while collecting long tasks and layout shifts. Where an INP-like lab measurement is used, label the method explicitly and do not equate it with field INP.
- Test slow network/CPU and 320px mobile reflow together; ensure deferred code does not hide primary content or controls.

## Private/provider performance gates

When a disposable full stack is available, separately measure authenticated workspace initial load, chat stream first-token/total duration, generation queue/provider time, polling intervals, asset download signing, admin aggregate queries, and outbox backlog. Use safe synthetic content and strict provider call caps. Provider latency is not controlled by frontend scores and must be reported separately.

## Field monitoring and launch gate

Before commercial launch, define consented privacy-appropriate RUM, traffic/segment thresholds, alerting, and dashboards for p75 LCP/INP/CLS. Until enough real data exists, report **field CWV not available**. A local 100 score, TBT, or one fast run never substitutes for field evidence or fixes a reproducible interaction defect.
