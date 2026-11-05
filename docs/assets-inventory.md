# Assets inventory

No brand assets existed in the initial repository (only `README.md`). All implemented brand and editorial visuals are original to Orindle. Prompt 3 adds three locally generated, explicitly labelled AI image fixtures for the customer workspace; they are not customer output or private uploads. Prompt 4 requires no new raster assets: admin trends use semantic HTML/SVG with HTML labels and equivalent values, not fake analytics screenshots. No stock imagery, competitor graphics, fake product screenshots, customer logos or testimonial portraits are used.

| Asset | Implementation path | Type / purpose | Source / license | Status |
|---|---|---|---|---|
| Orindle four-part mark and wordmark | `components/layout/logo.tsx` | Inline SVG/component for header, footer and auth shell | Original geometric SVG; real HTML wordmark | Implemented |
| Auth brand/product composition | `components/auth/auth-shell.tsx` | Responsive auth workspace and desktop product aside | Original HTML/CSS, existing Orindle mark and Lucide icons | Implemented |
| Google/GitHub provider symbols | `components/brand/provider-icons.tsx` | Inline SVG symbols for planned OAuth controls | Inline provider-brand symbols; no remote requests or raster assets | Implemented |
| Favicon/app icon | `app/icon.svg` | Four-part browser/app mark | Original SVG | Implemented |
| Hero ecosystem composition | `components/marketing/product-visuals.tsx` (`EcosystemVisual`) | Semantic HTML/CSS/SVG explaining four connected products | Original conceptual workflow; meaningful labels are HTML | Implemented |
| Chat conversation visual | `components/marketing/product-visuals.tsx` (`ChatVisual`) | Conversation-to-brief product chapter | Original conceptual interface, not live telemetry | Implemented |
| Image Studio artboard/variations | `components/marketing/product-visuals.tsx` (`ImageVisual`) | Prompt and visual-direction workflow | Original HTML/CSS shapes and HTML labels | Implemented |
| Video Studio timeline/storyboard | `components/marketing/product-visuals.tsx` (`VideoVisual`) | Shot sequence and timeline explanation | Original HTML/CSS/SVG; no autoplay media | Implemented |
| Websites responsive wireframe | `components/marketing/product-visuals.tsx` (`WebsiteVisual`) | Brief-to-site responsive concept | Original HTML/CSS/SVG; not a fake customer site | Implemented |
| Sage bottle studio fixture | `public/fixtures/mint-product.jpg` | 1200×900 JPG for overview, Image Studio and Library | Generated with the workspace image tool on 2026-11-05; labelled AI fixture | Implemented |
| Ceramic material study fixture | `public/fixtures/ceramic-collection.jpg` | 1200×900 JPG for project, image and website fixtures | Generated with the workspace image tool on 2026-11-05; labelled AI fixture | Implemented |
| Retreat architecture fixture | `public/fixtures/retreat-architecture.jpg` | 1200×900 JPG for website and storyboard-only video fixtures | Generated with the workspace image tool on 2026-11-05; labelled AI fixture | Implemented |
| Product/accent icons | Lucide imports across `components` and `app` | Navigation, workflows, features and status cues | `lucide-react` 1.69.0; decorative icons hidden from AT where appropriate | Implemented |
| Admin operational trends | `components/admin/trend-chart.tsx` | Labelled SVG lines, UTC axes, textual summaries and exact-value tables | Original semantic HTML/SVG; deterministic demo fixtures only | Implemented |
| Editorial examples, tables and workflows | `components/blog/article-body.tsx` | Article explanations and worked examples | Original semantic HTML; no text baked into images | Implemented |
| Open Graph fallback | `app/opengraph-image.tsx` | Deterministic 1200x630 PNG via Next `ImageResponse` | Original layout and crisp generated text; no external image or AI image prompt | Implemented |
| Inter variable Latin font | `app/fonts/inter-latin-variable.woff2` | Body/UI typography via `next/font` | `@fontsource-variable/inter` 5.3.0; SIL OFL 1.1 | Implemented |
| Poppins Latin 500/600/700 | `app/fonts/poppins-latin-{500,600,700}.woff2` | Display typography via `next/font` | `@fontsource/poppins` 5.3.0; SIL OFL 1.1 | Implemented |
| Font licenses | `app/fonts/INTER-LICENSE.txt`, `app/fonts/POPPINS-LICENSE.txt` | License attribution and redistribution terms | SIL Open Font License texts copied with font assets | Implemented |

## Typography and accessibility rules

All meaningful page headings, labels, prices and article copy remain real HTML. SVG decorations are hidden from assistive technology; informative product figures include adjacent text or a concise figcaption. The social image is deterministic brand artwork, not an AI-generated fake interface. Prompt 3 raster fixtures have meaningful alt text, visible fixture labels and no baked-in text. Video uses a still storyboard frame rather than implying a playable generated video exists.

## Optimization

Fonts are self-hosted with only Latin subsets and used Poppins weights; there are no runtime Google Fonts requests. Semantic HTML/CSS/SVG replaces large hero raster images on marketing pages. The Open Graph image has stable 1200x630 dimensions. Workspace fixtures are local, reserved-dimension `next/image` assets with no remote media host. Prompt 3 visual-review screenshots were written to `/tmp/orindle-prompt3-visual/` and are not committed. Prompt 4 production review screenshots were written to `/tmp/admin-overview.png`, `/tmp/admin-users.png`, `/tmp/admin-usage.png` and `/tmp/admin-mobile.png` and are not committed; test reports remain ignored. No unselected generation variants or large audit artifacts are committed.
