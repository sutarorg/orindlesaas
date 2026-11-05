# Route inventory

All listed routes are public and indexable unless noted. Future private application routes must use `noindex` and authentication; `robots.txt` disallow alone is not access control.

| Route | Purpose | Primary CTA / behavior | Stage |
|---|---|---|---|
| `/` | Brand promise and four-product ecosystem | Get Started / Explore Products | Prompt 1 |
| `/features` | Compare four products and shared workflow | Explore a product | Prompt 1 |
| `/features/ai-chat` | Orindle Chat capabilities and model choice | Get Started | Prompt 1 |
| `/features/ai-image-generator` | Image Studio workflow and prompt guidance | Explore Image Studio | Prompt 1 |
| `/features/ai-video-generator` | Video Studio text/image-to-video workflow | Explore Video Studio | Prompt 1 |
| `/features/ai-website-builder` | AI website planning/build/publish workflow | Explore Websites | Prompt 1 |
| `/pricing` | One-time credit packs and deduction explanation | Choose a pack (honest stage destination) | Prompt 1 |
| `/models` | Provider/model selection concepts and availability | Read model guide | Prompt 1 |
| `/blog` | Six-article topic cluster | Read articles | Prompt 1 |
| `/blog/[slug]` | Server-rendered long-form article | Relevant product / related article | Prompt 1 |
| `/about` | Mission, principles and product scope | Explore platform | Prompt 1 |
| `/contact` | Real contact options or explicit preview state | Contact action | Prompt 1 |
| `/faq` | Product, credits and workflow questions | Pricing / Contact | Prompt 1 |
| `/privacy` | Frontend-stage privacy disclosure | Contact | Prompt 1 |
| `/terms` | Frontend-stage terms and acceptable use | Credits Policy | Prompt 1 |
| `/credits-policy` | Pack, wallet, usage and consumer-rights terms | Pricing | Prompt 1 |
| `/login` | **Noindex** login UI with local validation and explicit mock result | Login preview / recovery / signup | Prompt 2 frontend |
| `/signup` | **Noindex** signup UI; optional allowlisted `?pack=` display intent | Signup preview / login | Prompt 2 frontend |
| `/forgot-password` | **Noindex** generic password-reset request preview | Validate locally; never claim email delivery | Prompt 2 frontend |
| `/reset-password` | **Noindex** new-password and expired-link presentations | Validate locally; never claim password update | Prompt 2 frontend |
| `/verify-email` | **Noindex** verification-required/success/expired presentations and resend preview | Verification preview; no email operation | Prompt 2 frontend |
| `/auth/callback` | **Noindex** static callback presentation; no code exchange/session | Return to login/home | Prompt 2 frontend |
| `/sitemap.xml` | Canonical public URL discovery | Crawlers | Prompt 1 |
| `/robots.txt` | Crawl guidance and sitemap location | Crawlers | Prompt 1 |
| unmatched | Helpful 404 with navigation | Home / Features | Prompt 1 |

## Article slugs

- `/blog/best-ai-tools-for-creators`
- `/blog/gpt-vs-claude-vs-gemini`
- `/blog/ai-image-generation-guide`
- `/blog/create-ai-videos`
- `/blog/build-website-with-ai`
- `/blog/ai-for-small-business`

## Reserved future routes

`/dashboard`, `/projects`, `/assets`, `/history`, `/settings`, `/admin` and product workspace routes belong to later stages. Private variants must ship `noindex, nofollow` metadata and, once real data exists, server authorization. Prompt 1/2 do not create placeholder private application pages. All authentication routes listed above are noindex, excluded from the sitemap and frontend-only. Prompt 5 replaces mock auth and the callback presentation with researched Supabase SSR behavior and real route protection.
