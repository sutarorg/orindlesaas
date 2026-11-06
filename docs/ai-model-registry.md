# AI model registry

Status: **target design; not yet migrated or implemented**. Existing `providers`, `models`, and `model_prices` rows are historical data and must be preserved.

## Single registry responsibilities

The registry stores discovered identity/metadata separately from administrator policy and execution compatibility. A Gateway ID is never an alias to edit, rename, abbreviate, or infer from a display name.

### Provider identity

- `providers.id`: exact namespace derived from the substring before the first `/` in the Gateway ID.
- `name`: safe display value; a namespace-derived fallback is not a claim about a legal company name.
- `enabled`: administrator-controlled and unchanged by sync; new rows default to `false`.
- Planned additive metadata: discovery source, first/last seen timestamps, and safe Gateway-owned metadata where available.

### Model identity and discovery

Existing stable internal IDs remain `gateway:{exactGatewayId}`. The exact Gateway value remains in `gateway_model_id`, whose uniqueness is retained. Planned additive fields:

| Field | Purpose |
|---|---|
| `catalog_type` | Exact Gateway `type`, including unknown future strings; not a product enum |
| `gateway_metadata` | Validated raw display/capability/specification/limits/eligibility metadata, with secrets excluded |
| `product_compatibility` | Admin-reviewed Orindle product and parameter policy; sync never replaces it |
| `discovery_status` | `present`, `missing`, or `invalid`; missing rows remain historical |
| `first_discovered_at`, `last_seen_at` | Discovery history and staleness review |
| `catalog_synced_at` | Existing last successful observation timestamp |

Existing `kind` remains the legacy primary product hint for compatible rows. The migration may make it nullable for unsupported categories, with a database invariant that enabled rows must have a valid product route. Router eligibility must never rely on `kind` alone. Existing `capabilities` and `modalities` remain readable for backward compatibility; new authorization logic uses validated metadata and explicit compatibility rather than trusting stale JSON.

## Input validation

- Accept an opaque Gateway ID of bounded length with no control characters; do not impose a lowercase-only or one-slash regex on future IDs.
- Require a nonempty namespace and exact round trip: `namespace + "/" + remainder === id`.
- Require a nonempty bounded display name and object-shaped metadata. Unknown fields are preserved, not coerced into booleans or zeros.
- Deduplicate only by the exact complete ID. Conflicting duplicate entries in one response abort rather than choosing one silently.
- Browser model IDs are opaque strings looked up server-side. Browser-supplied provider, price, modality, compatibility, or enablement fields are ignored/rejected.

## Default and preserved state

For a newly discovered provider/model: `enabled = false`, product compatibility is unreviewed, and no customer route is available. For an existing row, sync updates only discovery-owned fields. It must not reset enablement, admin compatibility, manual price versions, references from generations/conversations, or historical observations.

A row absent from a later valid response becomes `missing`; it is not deleted and its admin settings remain intact. A malformed reappearance cannot overwrite a valid historical row. Unknown types are stored with `kind = null`, `enabled = false`, and no product compatibility.

## Compatibility policy representation

`product_compatibility` is a bounded JSONB object keyed only by `chat`, `image`, `video`, and `website`. Each entry has a schema version, review state, and operation-specific parameter policy. Examples of policy data are allowed sizes, aspect ratios, durations, resolutions, audio support, seed support, and maximum output tokens. Missing metadata means unknown—not “all supported” and not “unlimited.”

Sync may compute a read-only discovered compatibility assessment for admin review, but only the centralized server resolver combines it with reviewed policy. The UI cannot promote a model merely by supplying a compatibility object.

## Registry reads

Admin reads are bounded, searchable, and permission-filtered, with raw JSON shown only as safe structured metadata. Customer reads include only enabled/provider-enabled, currently present, product-compatible, currently quotable models. Historical or unsupported records are never exposed as customer products.

## Retention and recovery

Providers/models/price history are never deleted by catalogue sync. Foreign keys continue to protect generation/conversation history. Planned database triggers must prevent accidental provider/model deletion where historical references or price observations exist. Recovery rolls forward with migrations and reruns read-only discovery; it never reconstructs IDs from memory or deletes and reseeds the registry.
