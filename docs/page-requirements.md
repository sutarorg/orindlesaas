# Page requirements

## Shared

Every public page has one clear H1, a unique title/description, canonical URL, Open Graph metadata, header/footer, descriptive links, visible keyboard focus and responsive content. Breadcrumbs appear on nested feature/article/legal pages where useful. No dead controls or fabricated activity.

## Home

Required sequence: hero with exact requested headline/supporting copy; ecosystem visual; four visually distinct product chapters; models/provider ecosystem; Why Orindle; connected workflow; creator/business use cases; shared credits; pricing preview; FAQ; final CTA. All availability claims reflect frontend-only status.

## Features overview and product pages

Overview explains shared account/workspace concepts and helps visitors select a product. Each product page includes a specific hero, practical inputs/outputs, workflow steps, benefits, limitations/expectations, related article and CTA. No claim of real-time generation or publishing in this stage.

## Pricing

Display Creator/Pro/Studio exactly; identify one-time payment and no recurring subscription. Explain shared wallet, 100-credit display value, variable deductions, additional packs and example planning without exposing provider cost. Include comparison by user needs rather than fabricated “savings.” Purchase CTAs cannot simulate checkout.

## Models

Explain that different models have different strengths and costs. Use provider family names only with a verified/planned label and date-sensitive language. Link to the model-selection article. Do not list invented model IDs, benchmark rankings or context-window values.

## Blog and articles

Listing exposes all six titles, descriptions, topics and reading time. Articles contain original practical guidance, semantic H2/H3 hierarchy, TOC for longer pieces, relevant internal/external links and a natural CTA. Dates and author are real content metadata, not social proof.

## About and contact

About states mission, four-product scope and design/product principles without founding myths or team fabrication. Contact clearly states which channels are configured; an unconnected form must not claim message delivery.

## FAQ and policy pages

FAQ covers product, wallet, one-time pricing, usage variability, model choice and account expectations. Privacy/Terms identify their draft/last-updated status and avoid fictional entity/contact data. Credits Policy preserves statutory rights, payment disputes and legally required remedies. There is no refund-policy route.

## Authentication pages

All authentication routes use one H1, unique noindex metadata, the shared Orindle shell, visible frontend-preview disclosure and real internal recovery/navigation links. Forms have persistent labels, appropriate autocomplete, keyboard-operable password visibility, associated inline errors, first-invalid focus, busy feedback and an explicit mock result. No route creates an account/session, sends email, contacts OAuth providers or changes a password.

- `/login`: welcome copy, email/current-password, remember-me choice, forgot-password, login CTA, planned Google/GitHub UI, signup and Terms/Privacy links.
- `/signup`: name/email/new-password/confirmation, Unicode length guidance, independent visibility controls, unchecked required terms, OAuth UI, sign-in navigation and optional pack-intent display.
- `/forgot-password`: email validation and a generic no-delivery reset-request result that cannot enumerate accounts.
- `/reset-password`: new-password/confirmation validation, length guidance and expired-link presentation; no update claim.
- `/verify-email`: required/success/expired presentation states and resend preview; no verification or email claim.
- `/auth/callback`: static processing/error/cancellation presentation only; no token/code reading, session handling or arbitrary redirect.

Detailed copy and preview query URLs are maintained in `authentication-flows.md`.
