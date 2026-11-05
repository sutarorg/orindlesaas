# Mobile and cross-browser compatibility plan

Status: **five-project managed-browser/emulation matrix executed; physical devices remain blocked**. Results and timing corrections are in `failure-report.md` and `final-qa-report.md`. Emulated browsers/viewports and physical-device results are reported separately.

## Supported evidence matrix

| Project | Engine/profile | Scope | Evidence label |
|---|---|---|---|
| Chromium desktop | Current Playwright Chromium | Full credential-free production suite | Browser automation |
| Firefox desktop | Current Playwright Firefox | Public/auth/security smoke, metadata, forms, menus, responsive routes | Browser automation |
| WebKit desktop | Current Playwright WebKit | Same smoke plus storage/navigation/focus behavior | Browser automation |
| Mobile Chrome | Playwright Pixel-class Chromium profile | Mobile navigation, forms, pricing/articles, private login handoff | Device emulation |
| Mobile Safari | Playwright iPhone-class WebKit profile | Same mobile smoke | Device emulation |
| Real Android/iOS | Named physical device and OS/browser | Touch, orientation, virtual keyboard, safe areas, downloads, screen reader as available | Physical device; currently blocked |

A Chromium executable with a mobile viewport alone is not Mobile Safari evidence. Failure to install/launch Firefox or WebKit is Blocked, not a silent Chromium substitution.

## Viewport matrix

Test 320, 360, 390, 430, 768, 834, 1024, 1280, 1440, and 1920 CSS pixels where practical. Every public and auth route receives the core widths (320, 390, 768, 1440); complex routes receive the full matrix. Available private routes receive equivalent coverage after authentication; credential-free login handoff is separately labelled.

At each width assert:

- `document.documentElement.scrollWidth <= window.innerWidth` without hiding content to make the assertion pass;
- header/footer, H1, prices, forms, tables, article TOC/body, dialogs, and primary actions remain visible/readable;
- wide tables/artboards use only named intentional local scroll regions;
- navigation threshold does not leave both/neither desktop and mobile controls operable;
- 200% zoom and longer text do not clip controls; orientation changes preserve state and focus where applicable.

## Core cross-browser journeys

1. Home, features/product, pricing, models, blog listing and all six articles, about/contact/FAQ/policies render without page errors.
2. Products menu, mobile dialog, FAQ accordion, skip link, internal fragments, pricing handoff, and contact validation operate by touch/keyboard as appropriate.
3. Login/signup/recovery forms preserve values, labels, password visibility/paste/autofill semantics, error focus, and no false session when unconfigured.
4. Metadata/canonical/OG/JSON-LD, sitemap/robots, 404 status, noindex, reduced motion, and security/cache headers are consistent.
5. Once credentials exist: signup/login/logout, owner workspace, Chat, Image, Video, Websites, wallet, admin denial/permission states, downloads, and preview sandbox run per browser with test data only.

## Touch and accessibility checks

- Primary controls target 44×44 CSS px product aim; WCAG 2.2 AA 24×24 minimum and exceptions are assessed separately.
- No hover-only actions, accidental double-tap submission, keyboard trap, obscured focused element, or inaccessible fixed/sticky region.
- Mobile drawer/dialog supports Escape where a keyboard exists, overlay/close, focus containment/return, and close on navigation.
- Virtual keyboard does not hide the focused input/error/submit action; password managers and paste are not blocked.
- Reduced motion, text scaling, dark/forced-color modes where supported, and screen-reader touch exploration remain separately recorded.

## Execution and artifacts

Playwright projects use explicit names and managed browsers in CI. Install/launch logs, browser versions, OS, base URL, and revision accompany HTML/JUnit results. Traces/screenshots are retained on failure. Repeated environment failures are not product passes; classify infrastructure separately from reproducible application defects.

Real-device coverage is currently **Blocked** because no device or browser service is available. Launch requires an explicit owner decision about the supported real-device matrix; no universal mobile compatibility claim is made from emulation.
