# Mistakes that may occur and priorities

| Priority | Risk | Prevention | Remediation |
|---|---|---|---|
| P0 | Implying a mock signup, contact or purchase succeeded | Label preview behavior; avoid success toasts for unperformed actions | Remove the claim, correct UI and add regression test |
| P0 | Browser-controlled credit price/deduction | Keep arithmetic and provider cost server-only in later stages | Disable affected flow, reconcile ledger server-side |
| P0 | Secret exposed through public env or source | No secrets in Prompt 1; server-only later integrations | Rotate immediately and purge exposed artifacts |
| P0 | Unsupported payment/refund legal statement | Qualified legal review; preserve statutory rights and disputes | Correct copy before enabling commerce |
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

## Prioritization

P0 blocks any real transaction or deployment. P1 blocks stage acceptance. P2 requires resolution before content/launch sign-off unless explicitly recorded. P3 is maintainability polish. Findings are not considered resolved until inspected and tested.
