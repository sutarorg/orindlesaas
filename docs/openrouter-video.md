# Video Studio on OpenRouter

Sources: `lib/server/ai/openrouter-api.ts` (`createOpenRouterVideoJob`, `getOpenRouterVideoJob`,
`downloadOpenRouterVideoContent`), `lib/server/generations/runners.ts` (`pollVideoGeneration`),
`lib/server/jobs/`.

## Async by necessity

Video generation is asynchronous:

```
POST /api/v1/videos                 → { id, polling_url, status }
GET  /api/v1/videos/{jobId}         → { status, … }      (poll)
GET  /api/v1/videos/{jobId}/content → bytes              (download)
```

The SDK's `videoModel` helper blocks until completion, up to ten minutes. A serverless request cannot be
held open that long, so the HTTP flow is used directly and durability comes from Orindle's own
outbox/tick architecture. Inngest and Upstash were removed from this codebase and are **not** reintroduced
for this; polling is driven by the same in-process jobs/outbox/tick that run everything else.

## Polling

`pollVideoGeneration` handles one poll per tick. Terminal statuses are `completed`, `failed`, `dead`,
`cancelled` and `expired`.

- `completed` → download content, then settle.
- Any other terminal status → settle at **no charge**.
- A poll **error** does not fail the job: it keeps `awaiting_provider` and is retried on the next tick,
  because polling is read-only and a transient error says nothing about the generation itself.

Retries are spaced at `RETRY_DELAY_MS = 30_000`, matching OpenRouter's recommendation to poll roughly
every 30 seconds.

Download uses `/content` with a byte cap, so a hostile or oversized response cannot exhaust memory.

## Pricing and resolution labels

Video endpoints declare `pricing_skus` such as `per-video-second` and `per-video-second-1080p`, plus
`supported_durations`, `supported_resolutions` (`720p`, `1080p`), `supported_aspect_ratios` and
`supported_sizes`.

Two Gateway-era assumptions blocked every real video model, and both were fixed:

1. **Resolution labels.** The contract accepted resolutions only as pixel dimensions (`WxH`), so a
   `"720p"` policy failed with "the reviewed compatibility policy is invalid". The schema now accepts a
   pixel size *or* a quality label.
2. **Pricing labels.** `resolutionPricing` mapped a resolution to a Gateway SKU. OpenRouter publishes a
   per-second rate instead, so the requirement now applies only to historical Gateway rows. The quote map
   is built per approved label, and the selected label is resolved directly when no mapping exists.

A caller selecting an unsupported duration, resolution or aspect ratio is rejected before any submission,
and OpenRouter's `400` lists the supported values, so a quote is only ever produced for a supported
combination.

## Verified

An approved video endpoint at `0.5` per second, five seconds at `720p`, quoted exactly
**`2.50000000`**. Before those two fixes it failed — first with "the reviewed compatibility policy is
invalid", then "every video resolution needs an exact pricing label", then "an allowed video resolution
is required", then "cannot be quoted exactly". Each was a real blocker, found only by running the path
end to end.
