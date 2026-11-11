# Testing the migration

## Result

| Check | Result |
|---|---|
| `npx tsc --noEmit` (including tests) | clean |
| `npx eslint .` | 0 errors, 0 warnings |
| `npx vitest run` | **234 passed across 36 files** |
| Integration suite, real PostgreSQL | **11/11** |
| `npm run check` (typecheck + lint + build) | passed |

## Honest scope

These results come from a **disposable local PostgreSQL 55440** and from **mocked HTTP**, not from
production or from a paid OpenRouter call. No live provider request was made: CI must not spend money,
and there is no key in this environment.

Consequently the following are **not** verified here and are not claimed anywhere in this document set:
a real paid generation of any kind, the hosted database, RLS behaviour under real Supabase roles, E2B
builds, Vercel deployments, and Dodo payments.

## Test database recipe

`/tmp` is wiped between sessions, so the cluster is rebuilt each time:

```bash
pip install --target /tmp/pgr pgserver
PATH=/tmp/pgr/pgserver/pginstall/bin:$PATH
initdb -D /tmp/pg_or -U postgres --auth=trust
pg_ctl -D /tmp/pg_or -o "-p 55440 -k /tmp" start
# pgcrypto shim, `auth` schema, anon/authenticated roles
DATABASE_URL=postgresql://postgres@127.0.0.1:55440/orindle_qa npx tsx scripts/db-migrate.mts
```

The integration guard chain is easy to get wrong and fails **silently**:

- `QA_DATABASE_DISPOSABLE=1`
- host must be `localhost`, `127.0.0.1` or `postgres`
- database must be named `orindle_qa`

A wrong variable name (for example `QA_DISPOSABLE`) skips every integration test and looks exactly like a pass.

## Suite additions

| File | Tests | Focus |
|---|---|---|
| `tests/unit/server-openrouter-routing.test.ts` | 24 | worst-case rates, ceiling tightening, pinning, exact sums, routing body |
| `tests/unit/server-generation-runner.test.ts` | 16 | image decoding, signatures, settlement invariants |
| `tests/unit/server-openrouter-usage.test.ts` | 12 | ID classification, exact cost truncation, evidence verification |
| `tests/unit/server-catalog-sync.test.ts` | 13 | normalisation, invalid accounting, endpoint recording |
| `tests/unit/server-compatibility.test.ts` | 7 | provider-aware compatibility evidence |
| `tests/integration/database.test.ts` | 11 | real schema, sync, RLS, endpoint quoting and the approval gate |

## Every bug here was found by running code, not by reading it

This is the most useful result of the exercise. Each of the following passed review and failed execution:

1. **Ceiling widened a bound.** Raw `units` compared across decimal scales made a `0.5` ceiling look
   smaller than `0.000009`, so the operator's ceiling *increased* the quote bound.
2. **Partial sync reported success.** `discovered.invalid` was dropped, so a run that discarded entries
   logged `invalid: 0` and `succeeded`.
3. **Every OpenRouter model rejected.** Compatibility required a Gateway-only
   `supported_specifications: ["v4"]` field that OpenRouter does not publish. The whole catalogue would
   have been refused with a message that looked like a compatibility rule.
4. **Every OpenRouter image model unquotable.** The endpoint price required `prompt`, which image
   endpoints do not have.
5. **Every OpenRouter video model unconfigurable.** The contract accepted resolutions only as `WxH`; the
   real labels are `720p`/`1080p`.
6. **Video enablement blocked.** `resolutionPricing` (a Gateway SKU map) was mandatory.
7. **Video quote always failed.** The engine looked the label up through that map, which does not exist
   for OpenRouter.
8. **Endpoint-priced models invisible.** Both `resolveGenerationModel` and the customer selector
   inner-joined `model_prices`, so a model priced only by endpoints could never resolve or appear.
9. **Enablement and policy edits refused.** The enablement gate and the compatibility-policy mutation
   both required a `model_prices` row. Even with a priced endpoint approved, the model could neither be
   enabled nor re-configured — so an OpenRouter model could never actually go live.

Findings 3–9 were all discovered in the final end-to-end run, after the unit suite was already green,
which is the point: unit tests over mocks confirmed the pieces worked in isolation while the assembled
path was broken in seven ways.

## Fixture traps

- **Fabricated image bytes.** `Buffer.from([1, 2, 3])` is not an image and the signature check correctly
  rejects it. Tests use a real 8-byte PNG signature and a real `RIFF…WEBP` header. The check was not
  relaxed to suit the fixture.
- **Video resolution `"default"`.** Not a valid label; the reviewed policy must list real labels such as
  `720p`, or validation fails with a message about the policy being invalid.
