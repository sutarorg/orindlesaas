# Assets inventory

No brand assets existed in the initial repository (only `README.md`). All implemented brand and editorial visuals are original to Orindle. No stock imagery, AI-generated raster artwork, competitor graphics, fake product screenshots, customer logos or testimonial portraits are used.

| Asset | Implementation path | Type / purpose | Source / license | Status |
|---|---|---|---|---|
| Orindle four-part mark and wordmark | `components/layout/logo.tsx` | Inline SVG/component for header, footer and auth preview | Original geometric SVG; real HTML wordmark | Implemented |
| Favicon/app icon | `app/icon.svg` | Four-part browser/app mark | Original SVG | Implemented |
| Hero ecosystem composition | `components/marketing/product-visuals.tsx` (`EcosystemVisual`) | Semantic HTML/CSS/SVG explaining four connected products | Original conceptual workflow; meaningful labels are HTML | Implemented |
| Chat conversation visual | `components/marketing/product-visuals.tsx` (`ChatVisual`) | Conversation-to-brief product chapter | Original conceptual interface, not live telemetry | Implemented |
| Image Studio artboard/variations | `components/marketing/product-visuals.tsx` (`ImageVisual`) | Prompt and visual-direction workflow | Original HTML/CSS shapes and HTML labels | Implemented |
| Video Studio timeline/storyboard | `components/marketing/product-visuals.tsx` (`VideoVisual`) | Shot sequence and timeline explanation | Original HTML/CSS/SVG; no autoplay media | Implemented |
| Websites responsive wireframe | `components/marketing/product-visuals.tsx` (`WebsiteVisual`) | Brief-to-site responsive concept | Original HTML/CSS/SVG; not a fake customer site | Implemented |
| Product/accent icons | Lucide imports across `components` and `app` | Navigation, workflows, features and status cues | `lucide-react` 1.69.0; decorative icons hidden from AT where appropriate | Implemented |
| Editorial examples, tables and workflows | `components/blog/article-body.tsx` | Article explanations and worked examples | Original semantic HTML; no text baked into images | Implemented |
| Open Graph fallback | `app/opengraph-image.tsx` | Deterministic 1200x630 PNG via Next `ImageResponse` | Original layout and crisp generated text; no external image or AI image prompt | Implemented |
| Inter variable Latin font | `app/fonts/inter-latin-variable.woff2` | Body/UI typography via `next/font` | `@fontsource-variable/inter` 5.3.0; SIL OFL 1.1 | Implemented |
| Poppins Latin 500/600/700 | `app/fonts/poppins-latin-{500,600,700}.woff2` | Display typography via `next/font` | `@fontsource/poppins` 5.3.0; SIL OFL 1.1 | Implemented |
| Font licenses | `app/fonts/INTER-LICENSE.txt`, `app/fonts/POPPINS-LICENSE.txt` | License attribution and redistribution terms | SIL Open Font License texts copied with font assets | Implemented |

## Typography and accessibility rules

All meaningful page headings, labels, prices and article copy remain real HTML. SVG decorations are hidden from assistive technology; informative product figures include adjacent text or a concise figcaption. The social image is deterministic brand artwork, not an AI-generated fake interface. No generated-image prompt log is required because no AI image generation was used.

## Optimization

Fonts are self-hosted with only Latin subsets and used Poppins weights; there are no runtime Google Fonts requests. Semantic HTML/CSS/SVG replaces large hero raster images. The Open Graph image has stable 1200x630 dimensions. Test screenshots and audit reports live under ignored `test-results/` and are not distributable brand assets. No large unused source assets or generation variants are committed.
