# Performance evaluation report

Status: **pending Prompt 6 lab execution; field Core Web Vitals not available**.

## Method

At least three production-build Lighthouse mobile and desktop trials each for home, pricing, one substantial article, and login, with full reports and median/range. Browser resource/manifest/long-task/layout-shift review supplements scores. Private/provider journeys require a separate disposable full stack and strict call caps.

## Budgets

Median lab performance ≥90; other category scores ≥95 with deductions reviewed; lab LCP ≤2.5s, CLS ≤0.1, TBT ≤200ms diagnostic target, and no avoidable critical interaction long task >200ms in the scripted journey. Field p75 targets remain LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 after sufficient real traffic.

## Current evidence

No Prompt 6 Lighthouse, throttled profile, interaction trace, client-manifest/resource audit, or real-user telemetry has run. No kilobyte budget or production speed claim is inferred from the framework or prior build success.

## Decision

**Performance lab gate: PENDING. Field CWV gate: NOT AVAILABLE.** Final reporting will include environment, every trial, medians/ranges, defects and retests. TBT is not INP and local scores are not production field evidence.
