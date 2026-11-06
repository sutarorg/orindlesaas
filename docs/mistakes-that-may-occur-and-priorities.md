# Mistakes that may occur and priorities

| Priority | Risk | Prevention | Remediation |
|---|---|---|---|
| P0 | Implying a mock signup, contact or purchase succeeded | Label preview behavior; avoid success toasts for unperformed actions | Remove the claim, correct UI and add regression test |
| P0 | Browser-controlled credit price/deduction | Keep arithmetic and provider cost server-only in later stages | Disable affected flow, reconcile ledger server-side |
| P0 | Secret exposed through public env or source | No secrets in Prompt 1; server-only later integrations | Rotate immediately and purge exposed artifacts |
| P0 | Mock auth/email/OAuth/callback presented as real success | Preview-only adapter results and persistent no-operation notices | Remove claim, correct UI and add auth regression tests |
| P0 | Password, auth code, token or provider secret logged/persisted | No auth network/storage/logging in Prompt 2; server-only exchange later | Stop the flow, rotate affected credentials/tokens and purge logs |
| P0 | Mock generation/upload/payment/publish/deletion presented as completed | Non-persistent preview adapter, fixture labels and no-operation feedback | Remove claim, correct UI and add dashboard regression tests |
| P0 | Fixture wallet/history/profile treated as real account data | Persistent demo notice and typed `fixture` records; no session inference | Remove implication and label/segregate all illustrative data |
| P0 | Admin fixture route or browser role treated as real authorization | Persistent demo-admin notice; proposed permissions only; no private data | Remove access and enforce verified server route/action/object/field permissions before data |
| P0 | Mock admin payment/user/provider/job/package/credit action presented as completed | Non-persistent adapter, two-step review and explicit no-operation result fields | Remove claim, correct UI and add admin regression tests |
| P0 | Demo revenue/cost/contribution presented as actual company performance | Persistent fixture labels, integer minor units and visible metric definitions | Correct labels/calculations and add financial-contract tests |
| P0 | Credit adjustment reported without a real ledger and audit transaction | Preview requires reason/reference/confirmation but returns zero credits and `auditPersisted: false` | Disable production action until transactional ledger/audit, step-up and idempotency tests pass |
| P0 | Unsupported payment/refund legal statement | Qualified legal review; preserve statutory rights and disputes | Correct copy before enabling commerce |
| P1 | Signup/reset response enables account enumeration | Generic reset copy and non-confirming registered-account presentation | Map outcomes to safe copy and test differing inputs |
| P1 | Arbitrary auth `next`/callback redirect | Ignore return/code parameters now; exact allowlists in Prompt 5 | Remove redirect, allowlist safe paths and retest |
| P1 | Client mock guard mistaken for authorization | Unavailable session/access results only; no private data | Enforce verified server claims and object authorization before data |
| P1 | Auth form blocks password managers or keyboard use | Standard autocomplete, paste, native controls, labels and visibility buttons | Restore native behavior and rerun accessibility tests |
| P1 | Dashboard fixture mistaken for authenticated/authorized data | Demo-only shell and no user/session claims | Remove fixture access and enforce verified server authorization before real data |
| P1 | Markdown/generated code executes untrusted HTML or script | Constrained typed renderer and text-only code editor; no raw HTML | Remove execution path, sanitize/render as text and add XSS tests |
| P1 | Static progress/streaming presented as a live AI job | Explicit state fixtures and no timers/countdowns/job creation | Correct status copy and test stop/retry behavior |
| P1 | Admin logs/details expose secrets, prompts, customer files/code or raw payment payloads | Allowlisted redacted DTOs and source scans; no unrestricted identifiers | Remove fields, rotate exposed secrets, review access and add redaction tests |
| P1 | Modeled usage value confused with received revenue or gross contribution with net profit | Separate payment/usage/provider-cost formulas and exclusions | Correct definitions, reconcile source records and rerun metric tests |
| P1 | Admin table/filter/dialog loses keyboard or mobile access | Native tables, named scroll regions, responsive toolbars and Radix focus management | Restore semantics/control access and rerun keyboard/320px/axe tests |
| P1 | Admin streaming boundary masks an unknown-route 404 | No admin-root loading boundary; catch-all plus production status tests | Move boundary and rerun actual response-status tests |
| P1 | Streaming loading boundary returns 200 for an unknown fixture | Scope loading UI away from dynamic not-found paths and test actual status codes | Move the boundary, add a workspace catch-all and rerun production 404 tests |
| P1 | Invented or stale model IDs/capabilities | Date-labelled official registry research and fixture availability | Revalidate provider registry and update centralized model source |
| P1 | Dashboard/editor controls disappear or overflow on mobile | Responsive panel stacking, accessible drawer/dialog and viewport tests | Restore control access and rerun 320px keyboard/reflow tests |
| P1 | Model catalog presented as live availability | Distinguish planned from connected; verify IDs at integration | Qualify/remove claim and update source |
| P1 | Metadata canonical host wrong | Central site URL helper and deployment checklist | Set env, rebuild, inspect tags/sitemap |
| P1 | Mobile navigation traps or loses focus | Semantic button, Escape/focus handling and keyboard E2E | Fix disclosure and rerun keyboard tests |
| P1 | Horizontal overflow from visuals/tables | Intrinsic sizing, responsive wrappers and viewport tests | Fix offending layout at all target widths |
| P1 | Low contrast mint text on white | Use dark teal for text; mint mainly for fills/focus | Update token and run contrast review |
| P1 | Client-heavy marketing pages | Server Components by default; sparse motion islands | Remove unnecessary client boundaries |
| P1 | Invented testimonials/statistics/social proof | Content review against product requirements | Delete and replace with verifiable explanation |
| P2 | Six repetitive articles | Intent-specific outlines, examples and source research | Edit for unique utility and internal cluster links |
| P2 | Structured data mismatches visible page | Generate from shared typed content | Regenerate and validate JSON-LD |
| P2 | Documentation marked done before validation | Record evidence and unresolved checks separately | Change status and rerun relevant checks |
| P2 | Duplicate risk documents diverge | Copy primary to compatibility filename after edits | Synchronize and diff |
| P2 | Motion causes discomfort or layout shift | Transform/opacity only and reduced-motion fallback | Disable nonessential motion |
| P3 | Over-abstract component system | Compose only repeated patterns; keep editorial sections specific | Inline one-off abstractions |

## Prompt 5 residual risks and release priorities

The frontend-stage risks above remain useful history, but their preview/mock controls are not the current backend controls. The following residual risks govern the implemented Prompt 5 source.

| Priority | Risk | Current control | Required remediation/gate |
|---|---|---|---|
| P0 | Treating local fakes/build success as live auth, payment, ledger or AI proof | Handoff explicitly separates 106 unit and 50 browser tests from live evidence | Apply migrations to disposable PostgreSQL and pass credentialed end-to-end/RLS/concurrency/replay tests before launch |
| P0 | Duplicate charge, credit grant or overdraft during a database race | Wallet/reservation locks, unique idempotency, exact same-cost checks, non-negative counters and no blind provider retry | Prove parallel holds/settlements/purchases/adjustments and webhook replay on real PostgreSQL; disable affected flow on mismatch |
| P0 | Privilege escalation or internal-field exposure through direct Data API | Verified active profile/permissions/recent TOTP; reviewed SELECT revocations and server DTOs | Verify actual GRANTs/RLS with two users and wrong/expired roles; bootstrap first admin only through approved operator procedure |
| P0 | Uncertain paid provider submission retried blindly | Submission states block automatic retry and preserve reconciliation state | Recover provider reference and actual cost before any mutation; never release/resubmit merely to clear a queue |
| P1 | R2/provider postprocessing partially succeeds and leaves orphan/duplicate objects or an unsettled hold | Ownership keys, size/checksum limits, reconciliation states and no fake success | Add/run live failure-injection and orphan-object reconciliation; do not claim R2 and PostgreSQL commit atomically |
| P1 | Vercel create succeeds but response/local persistence is lost | Preview-only target, claimed create, and error-without-ID blocks another automatic create | Reconcile by team/project/provider evidence before retry; run authorized preview failure tests |
| P1 | Scheduled or concurrent price sync produces overlapping history | Immutable closure trigger, model lock and one-open-interval unique index; future versions are skipped by sync | Execute concurrent sync/admin tests on PostgreSQL and reconcile any pre-existing duplicate open intervals before migration |
| P1 | Dependency advisories remain unresolved | No blind force upgrade or untested major Zod override | Re-audit, test a supported Inngest/Zod remediation and document accepted residual risk before launch |
| P1 | Documentation or UI overstates delivery/payment/deployment | Contact says queue acceptance, checkout return grants nothing, preview target is enforced, unsupported admin actions stay read-only | Preserve truthful copy and add live evidence only after actual provider confirmation |

## Prompt 6 current residual risks and release priorities

The Prompt 5 dependency and local-database risks now have fresh remediation evidence: the current audit is clean, disposable PostgreSQL concurrency/grant tests pass, and QA-001 through QA-010 have scoped corrections. Those results do not eliminate the following residual risks.

| Priority | Residual risk | Current observed control | Required gate |
|---|---|---|---|
| P0 | Treating disposable PostgreSQL, fakes or anonymous 503s as hosted customer/payment proof | Domain reports and test matrix separate local, CI and hosted evidence | Hosted Supabase two-user/auth/admin and Dodo test-mode journeys before launch |
| P0 | Uncertain real provider/financial effects cannot be restored or reconciled | No blind retry; synthetic/disposable reconciliation tests; no live operation attempted | Authorized backup restoration, incident and provider/finance reconciliation drills |
| P1 | Generated website/provider behavior differs in real E2B/Vercel/R2 environments | QA-001/002 local isolation and DTO regressions; fixed-command/static controls | Authorized sandbox/storage/deployment failure and cleanup tests |
| P1 | Automated accessibility green is mistaken for WCAG conformance | Public axe/scripted keyboard/reflow results explicitly scoped | Complete manual WCAG, named AT, physical devices and authenticated states |
| P1 | Lab performance is mistaken for field responsiveness | QA-010/TEST-007 exact-`4244b69` repeated 24/24 local matrix; no TBT-as-INP or field claim; CI failures retained | Replacement final-HEAD CI, interaction/private/provider traces and privacy-approved real-user p75 monitoring |
| P1 | CI stalls or artifact cleanup hides a failure | Dedicated `performance-results/`, retained failure history and bounded job timeouts | Final HEAD run and artifact inspection; never substitute an older green revision |
| P2 | Documentation drifts from exact application evidence | Application revision `4244b69`, CI hardening through `cd6775b`, run index and domain reports reconciled | Preserve application-versus-workflow evidence distinctions and require replacement final HEAD checks |
| P2 | Dependency maintenance warnings become future vulnerabilities | Zero current moderate+ audit findings and narrow tested overrides | Re-audit on dependency changes; review peer/deprecation maintenance without blind upgrades |

## Prioritization

P0 blocks any real transaction or deployment. P1 blocks stage acceptance. P2 requires resolution before content/launch sign-off unless explicitly recorded. P3 is maintainability polish. Findings are not considered resolved until inspected and tested. Blocked critical evidence is not accepted risk.
