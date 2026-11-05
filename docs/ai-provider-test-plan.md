# AI Gateway, generation, and durable-job test plan

Status: **pre-execution; routine automation uses provider fakes**. Vercel AI Gateway remains the required AI provider boundary. No unrestricted live AI is permitted in CI.

## Model and price controls

- Sync only from an authenticated Gateway catalog in an explicitly authorized setup operation; newly discovered providers/models remain disabled.
- Validate exact model IDs, kind/capability/modality, provider enablement, current immutable price interval, and operation-specific price shape.
- Never infer media operation prices or treat date-sensitive marketing fixtures as availability.
- Keep estimate, actual Gateway cost, and final credits separate. Final billing uses the stored Gateway generation ID and actual `totalCost`, not token estimates.
- Verify catalog price precision, changed/unchanged prices, future versions, concurrent sync/admin writes, disabled provider/model rejection, and one open price interval.

## Fake-provider contract suite

Each fake is explicit, deterministic, and named in test evidence. It must cover:

| Area | Success path | Required failures/races |
|---|---|---|
| Chat | Ordered stream, final text, one generation ID, exact cost, persisted history | Abort, mid-stream error, missing ID, multi-step metadata, DB failure before/after assistant insert, cost unavailable |
| Image | Deterministic bytes/MIME, asset record, exact settlement | Empty output, missing ID, oversized/wrong bytes, R2 failure, DB-after-R2 failure, duplicate worker |
| Video | Persisted operation, pending→ready/error polls, bounded asset download | Start timeout after acceptance, missing ID, poll timeout, unsafe URL, empty output, retry after every checkpoint |
| Website | Valid bounded JSON source, stored project/build, isolated validation | Invalid source, storage/project/build failures, current-hash mismatch, reconciliation before build |
| Metering | Exact decimal cost/usage and one settlement | Wrong generation ID, changed exact cost, missing/negative/excess-precision cost, concurrent recovery |
| Outbox | Commit before notify, due-event recovery, stable event key | Lost notification, send timeout, duplicate send/worker, processing crash, backoff and poison event |

For every paid operation assert `maxRetries: 0`, an atomic submission claim before the call, no automatic resubmission of attempted/completed/uncertain work, and no hold release merely to clear an unknown charged state.

## State and evidence assertions

At each checkpoint inspect safe test records for:

- generation owner/kind/model/request hash/idempotency key;
- status, submission state, attempt count, provider operation/generation reference (kept server-only);
- reservation hold and actual settlement/reconciliation;
- stored result asset/project/build references and safe customer status;
- usage actual cost/identity/charged credits;
- outbox event key/status/attempts and email/deployment side effects;
- redacted error codes without prompts, generated source, signed URLs, provider bodies, or stacks.

A completed output with missing actual cost is not free or successfully billed. Empty/failed output may incur verified provider cost but must remain a failed generation. Actual cost above funds enters reconciliation without negative balance. Client disconnect is not proof of provider cancellation.

## Website execution and deployment boundaries

- Only `index.html`, `styles.css`, and optional `script.js` are accepted within byte/file limits; source validation and CSP sandboxing are independent layers.
- No generated package, dependency, install/build command, environment variable, dynamic import/eval, arbitrary path, or app-server execution.
- E2B receives only validated files and fixed commands, no production secrets, no internet for the static recipe, bounded time/output, and cleanup in `finally`.
- Vercel deployment requires a passed build for the current source hash, scoped token/team, server-generated name, and `target: preview` only.
- Unknown Vercel acceptance without a provider deployment ID blocks another automatic create. Recover provider evidence before retry.

## Optional live smoke policy

No live AI call is currently authorized or available. A future smoke requires a named authorizer, disposable test project, current catalog/price verification, and all of the following process-enforced controls:

1. `QA_ENABLE_AI_SMOKE=1` plus an exact environment label; default is off and missing values fail closed.
2. First smoke limited to one text generation, one approved model, a tiny fixed non-sensitive prompt, maximum 64 output tokens, SDK retries disabled, and one process-level call permit.
3. A numeric maximum USD spend and maximum actual credits supplied by the authorizer; the run stops and reports reconciliation if actual cost exceeds the approved envelope. No invented price or cap.
4. No image/video/website generation in routine smoke. Each requires separate explicit approval, a per-kind call limit, current operation price, asset byte/host limits, and cleanup plan.
5. E2B/Vercel tests are separately enabled, preview-only, uniquely named, and never receive production secrets or customer source. Production deployment remains prohibited.
6. Record safe request/generation/job IDs, actual cost/credits, duration, and outcome; do not record prompt, keys, raw response, signed asset URL, or generated source.

CI schedules and pull requests never enable these flags. Missing credentials, current price, authorizer, limit, or cleanup capability means **Blocked**, not skipped-and-passed.

## Launch gate

Mocked state-machine tests, real PostgreSQL recovery/race tests, and a tightly bounded authorized Gateway smoke are all required for their respective claims. Live model availability, quality, latency, and cost cannot be inferred from fakes. Any duplicate paid submission, wrong-cost settlement, unpriced call, unsafe retry, or untrusted execution is release-blocking.
