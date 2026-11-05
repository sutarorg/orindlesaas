# Dashboard navigation and information architecture

Status: **accepted for Prompt 3 frontend implementation**. All routes are noindex demo-workspace views, not authorized private pages.

## Global shell

The unified shell contains a persistent desktop sidebar, mobile modal drawer, contextual top bar and main content region. The existing public header/footer never render inside `/app`.

### Main

| Label | Route | Active match | Purpose |
|---|---|---|---|
| Overview | `/app` | exact | Greeting, fixture balance, product entry points, recent work and next actions |
| Chat | `/app/chat` | `/app/chat/*` | New chat and conversation workspace |
| Image Studio | `/app/image-studio` | exact | Prompt/configuration, results and image history |
| Video Studio | `/app/video-studio` | exact | Prompt/configuration, jobs and preview states |
| Websites | `/app/websites` | `/app/websites/*` | Projects, creation, editor and settings |

### Workspace

| Label | Route | Purpose |
|---|---|---|
| Projects | `/app/projects` | Cross-product organization and project details |
| Library | `/app/library` | Images, videos, website assets and documents |
| History | `/app/history` | Previous generation fixtures and statuses |

### Account

| Label | Route | Purpose |
|---|---|---|
| Credits & Wallet | `/app/credits` | Fixture balance, exact one-time packs and wallet explanation |
| Settings | `/app/settings` | Profile, security, preferences, connected-account and deletion-request previews |
| Help & Support | `/app/support` | Product guidance, real public help links and honest support options |

`/app/credits/history` is a contextual wallet subpage, not another global sidebar item. `/app/websites/new`, editor and settings are contextual website destinations. Conversation and website dynamic routes use fixture lookup and not-found handling; arbitrary IDs do not generate content.

## Top bar

- Mobile sidebar trigger with an accessible open/close name and focus return.
- Breadcrumb/context label derived from the navigation registry, not raw URL text.
- Universal credit indicator labelled as demo/fixture data and linked to `/app/credits`.
- Notification disclosure with clearly illustrative entries and local-only clearing.
- Demo profile menu linking to Settings and Support; sign-out preview explicitly reports no session.
- Persistent concise demo-workspace notice. It does not claim authentication, live sync or saved changes.

## Context navigation

Chat has a local conversation-history pane and New chat action. Websites has page/section and editor-panel navigation inside the editor only. Wallet history links back to Credits. Breadcrumbs appear where they add orientation, especially dynamic editor/settings and wallet history; the global sidebar remains uncluttered.

## Mobile behavior

Below the desktop breakpoint the global sidebar becomes a modal drawer. The drawer handles Escape, overlay close, focus return and close-on-navigation. Product/editor secondary panels stack or use labelled local tabs. No essential action is hover-only or hidden in an inaccessible horizontal strip. Tables become cards where practical; genuinely tabular wide data uses a labelled keyboard-focusable scroll region.

## Route states

- `/app?state=empty`: empty-workspace presentation.
- `/app?state=error`: safe load-error presentation with a real retry link.
- `/app?state=session-expired`: explicitly fictional session-expiry design; no session existed.
- `/app?state=unauthorized`: explicitly fictional unauthorized design; no authorization result is inferred.
- `/app/chat?state=streaming`: static streaming presentation; no active stream.
- `/app/chat?state=error`: safe chat error presentation with local preview retry behavior.

Unknown state values fall back to the default view. These query parameters are documented UI fixtures only and are never authentication or job status.

## Discovery and future authorization

Every `/app` page inherits `noindex, nofollow`; `/app/` is excluded from the sitemap and disallowed in robots. Prompt 5 must add verified server sessions and per-object authorization before real user data appears. A visible fixture dashboard must never be described as route protection.
