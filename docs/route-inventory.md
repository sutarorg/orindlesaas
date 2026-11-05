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
| `/app` | **Noindex** demo-workspace overview and labelled empty/error/session states | Product creation/navigation previews | Prompt 3 frontend |
| `/app/chat` | **Noindex** new chat/composer/conversation shell | Local composer preview; no model call | Prompt 3 frontend |
| `/app/chat/[conversationId]` | **Noindex** allowlisted fixture conversation and message states | Copy/regenerate/stop previews | Prompt 3 frontend |
| `/app/image-studio` | **Noindex** image configuration, fixture gallery/history and preview | Generate/edit/download/save previews | Prompt 3 frontend |
| `/app/video-studio` | **Noindex** video configuration and distinct job states | Generate/retry/preview/download previews | Prompt 3 frontend |
| `/app/websites` | **Noindex** website project fixtures and statuses | Open editor / create website | Prompt 3 frontend |
| `/app/websites/new` | **Noindex** website brief, style/sections/reference and estimate form | Validate; no project generated | Prompt 3 frontend |
| `/app/websites/[projectId]/editor` | **Noindex** allowlisted website editor, responsive preview and AI/code panels | Local edit; no save/publish | Prompt 3 frontend |
| `/app/websites/[projectId]/settings` | **Noindex** website metadata/publishing settings | Validate; no settings saved | Prompt 3 frontend |
| `/app/projects` | **Noindex** cross-product projects and detail/create/edit dialogs | Local filter; no mutation | Prompt 3 frontend |
| `/app/library` | **Noindex** searchable/filterable asset fixtures | Preview/download/delete previews | Prompt 3 frontend |
| `/app/history` | **Noindex** generation history, product/model/status/credit/date details | Local filters | Prompt 3 frontend |
| `/app/credits` | **Noindex** fixture balance, exact one-time packs and wallet explanation | Purchase intent preview only | Prompt 3 frontend |
| `/app/credits/history` | **Noindex** fixture purchase/usage ledger and transaction details | Local filters/details | Prompt 3 frontend |
| `/app/settings` | **Noindex** profile/security/preferences/connected-account/deletion-request previews | Validate; no mutation | Prompt 3 frontend |
| `/app/support` | **Noindex** help, product guidance and real public support links | FAQ/contact/product navigation | Prompt 3 frontend |
| `/app/*` unmatched | **Noindex** workspace-safe catch-all and unknown-fixture 404 | Return to overview | Prompt 3 frontend |
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

The canonical customer workspace is `/app`; the earlier `/dashboard`, `/projects`, `/assets` and root-level workspace suggestions are superseded. `/admin` remains reserved for a separately authorized administration design and is not created in Prompt 3. All application routes are noindex demo fixtures, excluded from the sitemap and disallowed in robots. They are not protected private pages. Prompt 5 must add verified server sessions and per-object authorization before real data appears, and replace mock auth/callback behavior with researched Supabase SSR.
