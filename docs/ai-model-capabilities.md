# AI model capabilities and product compatibility

Status: **design contract; no dynamic compatibility engine has been implemented yet**. Gateway metadata describes a model; Orindle compatibility describes a validated execution path. They are deliberately different.

## Evidence levels

| Level | Meaning | Customer routing effect |
|---|---|---|
| Discovered | Gateway returned the ID and metadata | None by itself |
| Compatible candidate | Deterministic type/modality/specification checks pass | Admin review only; still disabled |
| Reviewed compatible | Admin policy supplies required operation constraints and evidence | Eligible only after enablement and price checks |
| Enabled | Provider and model are explicitly enabled | Still requires present discovery, valid request options, and current quote |
| Unsupported/unroutable | Non-product category, unknown type, failed execution/price check | Never shown as a customer product |

Missing capability metadata is unknown. It never means that every parameter is supported.

## Central matrix

| Product | Minimum discovered execution shape | Additional server policy |
|---|---|---|
| Chat | `type=language`; text input/output; AI SDK v4 specification; enabled language price rule | Prompt/history and output caps fit declared context/max-token limits when present; only validated generation options |
| Image Studio | `type=image`; image output; v4 image-model path; text prompt supported | Explicit allowed size/aspect-ratio/seed policy; a price rule covering the requested operation; no language-model image output assumption |
| Video Studio | `type=video`; video output; v4 async start/status path | Explicit duration/aspect/resolution/audio policy; matching duration price; bounded polling and asset handling |
| Websites | Language text output with structured-output evidence and v4 text path | Prompt + 5,000 output tokens fit declared limits; fixed source schema/validation; current text price |

`embedding`, `reranking`, `speech`, `transcription`, `realtime`, `decision`, `evaluation`, and unknown future types are retained in the registry but have no current Orindle product mapping. Adding a category requires a new reviewed execution and metering path, not an enum relabel.

## Parameter validation

The browser sends only values, never capability declarations. The server validates each supplied option against the selected model’s reviewed policy:

- **Chat/Websites:** bounded messages/prompt, maximum output tokens, context limits, and structured-output requirement where applicable.
- **Image:** optional `size`, `aspectRatio`, and `seed` only when explicitly allowed. Unsupported/hidden controls are omitted rather than sent with guessed defaults.
- **Video:** `duration`, `aspectRatio`, `resolution`, and `generateAudio` must be in reviewed sets/ranges. Video pricing keys such as `720p` are mapped only through a reviewed policy to SDK values such as `1280x720`; no string substitution guess is authoritative.
- **Provider options:** arbitrary browser JSON is forbidden. Gateway user/tag values are generated server-side from verified IDs.

SDK warnings about ignored unsupported settings are not success evidence for the requested behavior. A mismatch discovered after submission follows reconciliation rules; it is not retried blindly.

## Modality limitations

The current studios submit text prompts only. Discovery of image/video/file/audio input modalities does not create an upload feature. Output modalities do not prove that the current worker can persist that output. Website generation remains the fixed dependency-free `index.html`, `styles.css`, and optional `script.js` pipeline.

## Admin review data

A compatibility revision should contain schema version, product, state, exact allowed options, evidence/reference in the audit reason, expected current revision, actor, and timestamp. Sync updates discovered metadata but leaves this policy unchanged. A material metadata change can make the resolver fail closed and flag review without rewriting or deleting the prior revision.

## Customer presentation

Selectors use a bounded registry DTO containing safe display name, exact internal/Gateway IDs, provider namespace, modalities, allowed option sets, and availability explanation. No “supports everything,” live-health, quality, or latency claim is derived from catalogue presence. Empty compatible results produce an honest unavailable state.
