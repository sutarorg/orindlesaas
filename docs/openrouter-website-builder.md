# Website builder on OpenRouter

Sources: `lib/server/chat/service.ts` (generation), `lib/server/generations/runners.ts`
(`validateWebsiteBuild`), `lib/server/websites/sandbox.ts`, `lib/server/deploy/`.

## What changed, and what deliberately did not

Only the **text generation** step moved: it now runs on an OpenRouter chat model, chosen the same way as
Chat. Everything after generation is unchanged:

1. Source JSON is written to R2 as an owned asset.
2. `validateWebsiteBuild` reads the bytes back **from storage**, re-hashes them, and rejects a changed
   `sourceSha256` with `409 conflict`.
3. `validateWebsiteInSandbox` builds and validates the site in E2B.
4. A scoped preview deployment is created with `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`,
   `VERCEL_PROJECT_PREFIX` and `VERCEL_DEPLOY_TARGET`.

E2B validation and Vercel deployment were explicit constraints: the migration must not break website
generation or `VERCEL_API_TOKEN` deployment. Neither path references the AI provider, and neither was
modified. Re-reading the source from storage and re-checking its hash before building is what keeps a
generation and its build linked to the same bytes.

A website generation is classified `website` for pricing and routes to a chat-shaped model: it consumes
`prompt` and `completion` rates. The customer selector offers a website product only when
`quoteForProduct("website", …)` succeeds for that model, so a model that cannot be quoted for websites is
not offered for them — verified in the selector output, where one text model correctly appeared under
both `chat` and `website`.

## Failure behaviour

A website build blocked by a non-succeeded generation reports `blocked` rather than failing, so the
operator can see the cause. Sandbox validation results (`passed` / `failed` plus diagnostics) are stored
on the build row.

## Not verified

No real website generation or deployment was run during this migration: E2B and Vercel require live
credentials, and no hosted deployment occurred. The claim here is limited to the generation step being
provider-neutral and the downstream pipeline being untouched — not that a hosted build was observed.
