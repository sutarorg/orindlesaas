# Defect register

Status: **Prompt 6 initialized before execution**. A hypothesis is not counted as a reproduced defect. A defect is closed only after reproduction, a scoped fix, the original regression, related negative cases, and a clean final rerun. Screenshots/traces are retained in ignored run artifacts and referenced by run ID.

## Severity and states

- **P0:** tenant/session/credential compromise, untrusted application-origin execution, duplicate or corrupt financial effects, destructive/data-loss behavior, or release-integrity failure. Always blocks launch.
- **P1:** release-significant security, authorization, accessibility, core workflow, browser, SEO, performance, or recovery defect. Always blocks launch.
- **P2:** material noncritical defect requiring correction or explicit owner acceptance before launch.
- **P3:** polish/maintainability issue.

States: `Hypothesis` → `Reproduced` → `Fix in progress` → `Retest` → `Closed`; `Blocked` records why valid retest evidence cannot be obtained. `Reopened` is mandatory if the original behavior returns or the fix is incomplete.

## Confirmed defects

No Prompt 6 defect has yet been dynamically reproduced and retested. This section will contain reproduced defects with exact evidence; none is closed by inheritance.

## Audit hypotheses awaiting reproduction

| ID | Candidate priority | Area | Observation requiring a test | Current state | Required discrimination/retest |
|---|---|---|---|---|---|
| QA-HYP-001 | P0/P1 | Direct website preview | The editor iframe has `sandbox="allow-scripts"`, but the direct preview route's HTTP CSP currently lacks a `sandbox` directive and allows HTTPS images. Determine whether direct navigation lets untrusted script execute with application origin/network access. | Hypothesis from source inspection | Harmless sentinel script in direct and embedded previews; assert opaque origin, no app cookies/storage/network, then retest both after any fix |
| QA-HYP-002 | P1 | Website DTO redaction | `getOwnedWebsite` returns complete project/build rows and the GET route serializes that result; this may expose `vercelProjectId`, `sandboxId`, and diagnostics contrary to the display-safe contract. | Hypothesis from source inspection | Exact API/RSC response-key assertion for owner and foreign user; verify no restricted keys after fix |
| QA-HYP-003 | P0/P1 | Credit-adjustment idempotency | Ledger idempotency is scoped by target wallet/kind/key; determine whether one admin key can be reused for a different target or actor without conflict/audit ambiguity. | Hypothesis from source inspection | Same key with changed target/actor/body under concurrency; require conflict or correctly scoped original result and one audit per new effect |
| QA-HYP-004 | P1 | Non-success payment events | Non-success webhook handling may trust only purchase metadata before changing status; verify mismatched owner/session/product cannot corrupt another purchase. | Hypothesis from source inspection | Signed-fake failed/cancelled/processing mismatch corpus and post-commit state assertions |
| QA-HYP-005 | P2 | Request correlation | Incoming `X-Request-Id` appears truncated rather than allowlisted; test control characters, whitespace, oversized and non-ASCII values for safe headers/log/body correlation. | Hypothesis from source inspection | HTTP negative corpus; require strict bounded ID or generated UUID and no response-splitting/leakage |
| QA-HYP-006 | P1 | Configuration safety | Dodo mode validation rejects live-looking keys in test mode but may not reject test-looking keys in live mode; public-secret name detection may miss generic `NEXT_PUBLIC_*API_KEY` names. | Hypothesis from source inspection | Configuration unit matrix using synthetic key shapes; no real credentials or values in evidence |

## Closure evidence template

For each reproduced defect record: title/severity; revision/environment; minimal steps; expected/actual; P0–P3 rationale; screenshot/trace/log path; database/provider side-effect check; root cause; changed files; regression test IDs; original-case and related-case results; final clean run; residual limitation; and reviewer/date. Do not include secrets, customer data, raw payment payloads, prompts, generated source, or signed URLs in the register.
