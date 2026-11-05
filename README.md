# Orindle

**Everything AI. One Platform.**

Premium-white public website and authentication frontend for Orindle Chat, Image Studio, Video Studio and Websites. Built with Next.js App Router, React, strict TypeScript, Tailwind CSS, shadcn/ui patterns, Radix primitives, Lucide and Framer Motion.

## Develop

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Authentication frontend

The noindex routes `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` and `/auth/callback` provide local validation, accessible password controls and explicitly preview-only states. They do not create accounts/sessions, contact OAuth providers, send email or change passwords. Real Supabase and server authorization belong to Prompt 5.

## Validate

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

Or run the same static/unit/build sequence with `npm run check`.

For browser tests, install Playwright Chromium once, then run `npm run test:e2e`. Without `PLAYWRIGHT_BASE_URL`, Playwright starts/reuses the local dev server. To test a production build, run `npm run start` in a separate terminal and set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`.

```bash
npx playwright install chromium
npm run test:e2e
```

See `docs/quality-assurance.md` for the optional npm-packaged Chromium fallback used in this sandbox and the final validation evidence.

This stage is frontend-only. It does not implement real authentication/session handling, payments, credit deductions, AI generation, database writes, email delivery or deployment. See [`docs/README.md`](docs/README.md) for architecture, design, requirements, research and validation evidence.
