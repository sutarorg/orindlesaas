# AI reference catalogue verification

Status: **Source A structural verification passed on 2026-11-06**. This verifies the supplied reference file, not current live availability or production readiness.

## Preserved artifact

- Path: `docs/vercel_ai_gateway_llm_model_ids-1.txt`
- Size: **5,959 bytes**
- SHA-256: **`1fe5f8a45c45a8d7a63cd46cb0aa0bb3ca1f099ff89ab8fe8d5acfbebc8888e8`**
- Captured IDs: **166**
- Unique exact IDs: **166**
- Provider namespaces: **28**
- Duplicate IDs: **0**

The original completeness note is preserved: this is a verified partial language-model export, not a guaranteed exhaustive runtime dump. Live Gateway discovery remains authoritative for the current complete response.

## Automated structural check

A Python standard-library parser read the preserved bytes as UTF-8 and accepted only complete lines matching a namespace/model-ID shape. It also tracked each `[namespace] (N captured)` section and compared the declared count to parsed entries. The check rejected section/namespace mismatches, duplicate or missing totals, and incorrect namespace totals.

Observed result:

```text
bytes=5959 ids=166 unique_ids=166 namespaces=28
PASS exact reference structure and all declared section counts
```

## Namespace counts

| Namespace | IDs | Namespace | IDs |
|---|---:|---|---:|
| alibaba | 25 | anthropic | 20 |
| bytedance | 3 | callstack | 1 |
| deepseek | 10 | google | 8 |
| inception | 1 | inclusionai | 5 |
| inference-net | 1 | liquid | 1 |
| meituan | 1 | meta | 4 |
| minimax | 7 | mistral | 3 |
| moonshotai | 4 | morph | 2 |
| nvidia | 6 | openai | 35 |
| perplexity | 1 | poolside | 1 |
| quiverai | 2 | sakana | 1 |
| spacexai | 9 | stealth | 1 |
| stepfun | 2 | tencent | 5 |
| xiaomi | 2 | zai | 5 |

The sum is 166 across 28 namespaces. The permanent implementation test suite must repeat these checks and compare reference IDs to live/mocked discovery by exact string without treating reference-only entries as currently available.
