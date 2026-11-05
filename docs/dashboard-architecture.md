# Dashboard architecture

Status: **accepted for Prompt 3 frontend implementation on 2026-11-05**. This stage is frontend-only. It creates no authenticated session, real workspace data, AI job, payment, credit mutation, upload, saved project or deployment.

## Stage and trust boundary

The dashboard is an explicitly labelled demo workspace. Fixtures are illustrative UI data, not an authenticated user or real account history. A persistent demo notice appears in the shell, fixture balances/history carry fixture labels, and every mutation-like adapter returns `preview`/`unavailable` rather than success.

Prompt 5 must add verified server identity, per-object authorization, persistent repositories, server-issued quotes, transactional wallet operations, real model/job adapters and safe media/deployment handling. Client route visibility is never authorization.

## Next.js route and chrome architecture

The canonical customer application root is `/app`, superseding the earlier suggested `/dashboard` paths. Next 16 nested layouts provide the shell; dynamic `params` are awaited as Promises.

To prevent marketing navigation/footer from appearing in the workspace:

```text
app/
  layout.tsx                  shared metadata, fonts and body only
  (site)/
    layout.tsx                public/auth skip link, SiteHeader, SiteFooter and public JSON-LD
    page.tsx                  existing homepage; URL remains /
    ...public/auth routes     existing URLs unchanged
  app/
    layout.tsx                noindex DashboardShell; URL is /app
    page.tsx                  overview
    error.tsx                 safe workspace error boundary
    not-found.tsx             workspace-safe unknown fixture/route state
    [...not-found]/page.tsx    unmatched `/app/*` paths return a real 404
    image-studio/loading.tsx   static-route loading presentation
    ...workspace routes
```

`app/sitemap.ts`, `app/robots.ts`, fonts, icon and OG file conventions remain at root. The route group is organizational only and does not change public URLs. `/app/` is disallowed in robots and excluded from the sitemap; this is discovery control, not access control. The loading boundary is scoped to Image Studio rather than the workspace root: browser QA proved a root streaming boundary could emit 200 before dynamic fixture lookup rejected an unknown ID. Without that parent boundary, unknown conversations, websites and catch-all routes return actual 404 responses.

## Frontend folders

```text
components/dashboard/
  dashboard-shell.tsx        desktop sidebar, mobile dialog, top bar, demo notice
  ui.tsx                    page header, badges, panels and preview feedback
  model-selector.tsx         typed registry + Auto presentation; no provider call
  markdown-message.tsx       constrained safe markdown/code renderer; no raw HTML
  asset-preview-dialog.tsx   accessible local media/document preview
  confirm-dialog.tsx         destructive-action validation without mutation
  ...product/workspace feature components
lib/
  contracts/dashboard.ts      display-safe DTOs and mutation service interfaces
  dashboard/
    models.ts                documented model-ID registry supplied by mock data
    fixtures.ts              clearly typed illustrative workspace fixture
    navigation.ts            routes, groups, breadcrumbs and active-match helpers
    estimates.ts             deterministic explicitly illustrative estimates
    format.ts                stable fixture formatting/filter helpers
  mocks/dashboard-preview.ts no-operation preview adapter
app/app/                     route composition only where practical
```

Pages and layouts remain Server Components by default. Client boundaries are limited to navigation/disclosures, editors, local filters, file-name selection, dialogs, clipboard actions and explicit preview state changes. No global client store is required; ephemeral state stays near the feature. Fixtures and model registries are framework-free typed modules.

## Shell and navigation

Desktop uses a persistent 248px sidebar with an optional icon-collapsed mode. Mobile uses a labelled dialog drawer with Escape, overlay close and focus return. The top bar contains contextual breadcrumb/title, universal fixture credit indicator, notification menu and demo profile menu. Navigation groups are Main, Workspace and Account only.

Chat and website editor have local secondary navigation appropriate to their task; these do not become additional global sidebar items. Complex panels stack or switch to labelled views below wide desktop, preserving access to every control.

## Product boundaries

### Chat

`ChatWorkspace` supports conversation list, new-chat empty state, typed message DTOs, safe constrained markdown/code rendering, attachments selected by name only, model/Auto selection, composer, copy, regenerate, stop and submitted/streaming/ready/error presentations. No SDK is installed in Prompt 3. Current AI SDK UI research informs the state model; Prompt 5 can map real `useChat` messages/transports to these DTOs after revalidation.

Stop/regenerate controls in this stage affect only local preview state and say no request was running. Clipboard copy is a real local action and reports failure honestly. Markdown is parsed into a small trusted block subset; raw HTML is not rendered.

### Image and Video Studio

Prompt/configuration panels are separate from result/history areas. Typed fixture estimates are labelled as illustrative, never server quotes or final deductions. File inputs retain local file names only and do not upload. Generate buttons return explicit no-job/no-output preview results.

Fixture images are locally generated assets with meaningful alt text and visible fixture labels. Full-screen previews use accessible dialogs. Video queued/processing/completed/failed states are distinct; static progress never advances via artificial timers. A completed fixture includes only a labelled storyboard frame, not a pretend playable video file.

### Websites

Overview, creation, editor and settings are separate routes. The editor distinguishes page/section navigation, a structured local preview, AI-edit preview controls, editable code text, save status, preview URL and publish action. Desktop/tablet/mobile controls resize the actual local preview rather than fake device screenshots.

Monaco is not added: a labelled multiline code editor is sufficient for this frontend fixture and avoids a large dependency without improving the required interaction. Prompt 5 may reassess Monaco for real multi-file code workflows. Generated code is treated as untrusted; no arbitrary HTML/script execution is allowed.

### Shared workspace

Projects, Library, History, Credits and Settings reuse the same fixture source and display-safe DTOs. Filters/search operate locally and honestly. Create/edit/delete/purchase/save/publish/deletion-request controls validate where useful, then return explicit non-persistent preview results. Empty states offer a useful next action.

## Contracts and fixtures

`DashboardService` covers generation intent, project/asset mutations, wallet intent, settings and website/deployment intent. `DashboardPreviewResult` always includes `status`, a safe message, `persisted: false` and `creditsChanged: 0`. It cannot represent a completed production operation.

`ModelRegistryEntry` includes documented model ID, display name, provider, product, capabilities, modalities, context display where verified, pricing display, availability and feature tags. The registry contains current officially documented IDs as of research, but `availability: "catalog-fixture"`; it does not claim Orindle access or provider availability. Auto is a UI routing option, not a fake model ID.

All balance, purchase, usage and progress records are `Fixture*` types or include `fixture: true`. The browser never supplies authoritative price, final credits, ownership, payment status, model cost or entitlement.

## Rendering, assets and performance

Server pages compose fixtures into semantic HTML. Product interactions are isolated Client Components. Local generated fixture images use reserved dimensions/`next/image`; no remote image hosts or video streams are required. No large editor, markdown, AI SDK or chart dependency is added.

The public visual system remains white/off-white with charcoal type, teal/mint actions and restrained product accents. Dashboard density comes from layout and hierarchy, not smaller inaccessible targets or a generic dark admin theme.

## Required validation

Test nav active states and fixture integrity, every mock method, estimates, markdown safety, filters and validation. Browser coverage includes every route, dynamic fixture IDs and unknown IDs, mobile drawer focus/Escape, model/composer controls, chat states, media dialogs, website editor view modes, local filters, no-operation results, noindex/sitemap/robots, responsive overflow and axe scans.

Run strict TypeScript, ESLint, unit tests, production build, production Playwright and representative visual inspection. Record actual results separately from Prompt 1/2 evidence.
