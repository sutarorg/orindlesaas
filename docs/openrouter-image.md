# Image Studio on OpenRouter

Sources: `lib/server/ai/openrouter-api.ts` (`generateOpenRouterImage`),
`lib/server/generations/runners.ts` (`decodeProviderImage`).

## Why HTTP, not the SDK

`POST /api/v1/images`. The SDK's `imageModel` helper was evaluated and rejected because it discards two
things this product depends on:

- **`media_type`** — without it Orindle would have to guess how to label stored bytes.
- **`usage.cost`** — a provider-reported cost figure, usable as a settlement source when the generation
  lookup is unavailable.

Both are needed, so the documented endpoint is called directly.

## Response handling

The response is `{ data: [{ b64_json, media_type }] }` plus `usage`. The bytes are validated before
storage, in `decodeProviderImage`:

1. `media_type` must be an accepted format (`png`, `jpeg`, `gif`, `webp`, `svg+xml`); anything else is
   `409 conflict`.
2. Base64 must be well-formed. `Buffer.from` is lenient about trailing garbage, so the reliable check is
   a re-encode round-trip comparison.
3. Size is capped at `MAX_IMAGE_BYTES = 40 MB` → `413 payload_too_large`.
4. **The magic bytes must match the declared type.** This is the step that matters.

Step 4 exists because validating base64 alone would happily store an HTML document that the declared
type calls an image; a browser later fetching that URL by its image extension renders attacker-controlled
markup from Orindle's origin. A mismatch is rejected outright rather than relabelled, because relabelling
is exactly what an attacker would want.

Signatures checked: PNG, JPEG, GIF, WEBP (`RIFF` + `WEBP` at offset 8), and SVG as text opening `<svg`
or `<?xml` within the first 512 bytes.

## Pricing

Image endpoints bill per image, declared as `output_image` (or `image`). The endpoint-aware quote maps
that straight onto the image rate; see `openrouter-pricing.md`. Heterogeneous per-endpoint pricing is the
norm here — the Gateway-era `varies_by_provider` guard forces per-endpoint price rows, which is why
approval is per endpoint rather than per model.

## Cost

`usage.cost` from the image response is a provider-reported figure, tagged with its source so it stays
distinguishable from a generation-lookup actual. See `openrouter-cost-reconciliation.md`.

## Test note

Fabricated fixtures such as `Buffer.from([1, 2, 3])` are not valid images and are correctly rejected by
the signature check. Tests must use real signatures — the existing suite uses an 8-byte PNG signature and
a real `RIFF…WEBP` header. The check was not relaxed to accommodate fabricated fixtures.
