# Deployment runbook

Prompt 1 does not authorize or perform production deployment.

## Preview/local

1. Install from the lockfile with `npm ci`.
2. Copy `.env.example` to `.env.local`; set only the public canonical/contact values that are verified.
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit` and `npm run build`.
4. Start the production build with a host binding appropriate to the preview environment, or use the development server for visual review.
5. Run Playwright against the running preview and inspect canonical/OG tags.

## Future Vercel deployment checklist

- Confirm GitHub branch/PR review and explicit authorization for the target environment.
- Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS production origin; verify no secret uses a `NEXT_PUBLIC_` prefix.
- Add later-stage secrets only through encrypted Vercel environment settings, separated by environment.
- Run database migrations only through a reviewed, authorized process with backup/rollback plan; never destructively against production from this stage.
- Verify deployment headers, preview-host behavior, sitemap, robots, canonical tags, 404 and all public CTAs.
- Configure real user monitoring and Search Console only with required consent and access.

## Recovery

For a bad static release, use Vercel's documented rollback to the last known-good immutable deployment. For later payment/credit incidents, stop affected operations, preserve logs/ledger evidence and follow a separately reviewed reconciliation process; never “fix” balances with untracked client/admin edits.

## Launch communications

Do not announce real signup, checkout or AI availability until those integrations and their tests are live. Frontend preview copy must not be reused as transaction success messaging.
