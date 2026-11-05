# Performance budget

## User-centric targets

At the 75th percentile, segmented by mobile/desktop after a real launch: LCP ≤2.5s, INP ≤200ms and CLS ≤0.1. Local Lighthouse is diagnostic, not proof of field performance.

## Frontend budgets

- Server Components by default; no sitewide client hydration.
- Initial route JavaScript target: keep marketing routes lean and inspect Next build output; investigate any large shared client bundle.
- Framer Motion only in small interaction islands; do not import it into every section merely for reveals.
- Two self-hosted font families with only used weights/subsets; no third-party font requests at runtime.
- Hero media uses stable dimensions; below-fold media lazy loads. Avoid raster images where semantic HTML/SVG is sharper and smaller.
- No third-party analytics, chat widgets, tag managers or video embeds in Prompt 1.
- No perpetual animation, large blur filters or scroll listeners on the main thread.

## Layout stability

Reserve image/aspect-ratio space, use font fallbacks and avoid late injected banners. Accordions change layout only after user interaction. Mobile menu overlays rather than pushing page content.

## Validation

The final Next 16.4.5 production build passed on 2026-11-05 and its route/rendering output was inspected. The implementation uses Server Components by default, small interaction islands, local subsetted fonts and semantic visuals instead of hero raster images. No third-party runtime widgets or analytics are present.

Lighthouse, CPU/network-throttled profiling and field Core Web Vitals were not run in this frontend stage. Next's current build output did not provide the legacy per-route bundle-size table, so no unmeasured kilobyte budget is claimed. Run Lighthouse against a production build and inspect actual client manifests when performance work is scheduled; record results in `progress.md`. Do not claim Core Web Vitals compliance without representative 75th-percentile field data.

## Later-stage watch items

AI SDK, dashboard charts, media players and admin tooling must not enter the public shared bundle. Generated media needs responsive variants and poster dimensions. R2/image optimizer caching and third-party script consent require separate budgets.
