# Admin data contracts

Status: **Prompt 4 display-safe fixture contract; no live endpoints or database access**. TypeScript shapes document the UI boundary and must be runtime-validated when real network data arrives.

## Shared conventions

```ts
type FixtureMeta = { fixture: true; asOf: string };
type Currency = "USD";
type MoneyCents = number; // integer; not a float dollar value
type Credits = number;    // integer; 100 credits = $1 usage value

type AdminPreviewResult = {
  status: "preview" | "unavailable";
  message: string;
  persisted: false;
  auditPersisted: false;
  paymentChanged: false;
  creditsChanged: 0;
  auditPreview?: AdminAuditPreview;
};
```

Every operational fixture includes `fixture: true` directly or belongs to a root `AdminFixture` with that marker. Dates are stable ISO values and rendered in UTC. Provider payment/job/model IDs are fictional display identifiers, not credentials or proof of provider responses.

## Core display DTOs

### Users and accounts

`AdminUser`: `id`, fictional `name`, `.example` email, `status` (`active|review|suspended`), integer `creditBalance`, `createdAt`, `lastActiveAt`, safe purchase/usage summaries and fixture marker. No password, session token, authentication method secret, address or raw identity payload.

`AdminUserStatusIntent`: target fixture ID, requested status, reason and confirmation. A separate session-invalidation intent contains only target ID/reason. Browser input never authorizes or completes the action.

### Providers and models

`AdminProvider`: ID/name, illustrative integration status, `enabled`, `lastHealthCheckAt`, safe `healthMessage`, `errorState` and fixture marker. Model count is derived from the shared model registry rather than duplicated.

`AdminModel`: shared model ID/display/provider/products/capabilities/input/output modalities plus admin `enabled`, `availability` and pricing summary. Capabilities remain per model; no universal modality matrix is inferred. `sourceUrl` documents catalogue research, not a live integration.

### Pricing and credit packs

`AdminModelPrice`: model ID, meter/unit, integer provider-cost fields, proposed customer credit configuration, `version`, `effectiveAt`, `status` and fixture marker. Exact units vary by modality/model and must not be forced into one token-price shape.

`AdminCreditPackage`: `creator|pro|studio`, display name, integer `priceCents`, integer `credits`, `enabled` and fixture marker. Initial values are exactly $19/1,900, $49/4,900 and $99/9,900. Display dollars are derived from minor units. Editing is a version intent, never an active server configuration.

### Payments and transactions

`AdminPayment`: safe payment ID, user ID/display, package ID/name, `amountCents`, `currency`, `status`, `webhookStatus`, `fulfillmentStatus`, `createdAt`, safe reference and fixture marker. No raw webhook, card/bank details, signed URL or provider secret.

`AdminTransaction`: transaction/reference IDs, `type` (`purchase|usage|adjustment|refund|dispute`), user ID, optional payment/job/model association, signed `credits`, optional `amountCents`, status and timestamp. It is a display fixture, not an append-only ledger guarantee.

### Usage and costs

`AdminUsageEvent`: ID, user/product/model/job associations, `occurredAt`, integer `creditsDeducted`, integer `providerCostCents`, `reconciliationStatus`, `generationStatus` and fixture marker.

Derived values:

```text
customerUsageValueCents = creditsDeducted
// because 1 credit = $0.01 customer-facing usage value

grossContributionCents = customerUsageValueCents - providerCostCents
// excludes all other operating expenses

failedGenerationCostCents = sum(providerCostCents where generationStatus = failed)
costPerActiveUserCents = providerCostCents / active fixture user count
```

The production meaning of provider cost requires reconciled provider metering/invoice data. Prompt 4 numbers are illustrative only. Captured payment value, usage value and gross contribution are separate metrics and must never be substituted for one another.

### Generation jobs

`AdminJob`: safe ID, product (`chat|image|video|website`), status (`queued|running|completed|failed`), retry count, provider/model display, created/started/completed timestamps, duration milliseconds where available, safe `errorCode`/redacted diagnostic summary and fixture marker.

No prompt, negative prompt, message body, file name/content, generated code, signed media URL, raw provider response, API key or stack trace appears in logs/details. Retry intent includes job ID/reason only; the server must enforce retry budgets and idempotency later.

### Website projects

`AdminWebsiteProject`: project ID/name, safe owner reference, project status, deployment status, display domain or `null`, last deployment timestamp, safe failure code and fixture marker. No source code, file tree, environment variable, sandbox identifier or unrestricted deployment ID.

### Disputes and audit

`AdminDispute`: ID, payment/user references, amount/currency, status, reason category, safe timestamps and fixture marker. Evidence/customer communication content is not included.

`AdminAuditPreview`: ephemeral ID, `actorLabel: "Demo admin"`, action, target type/ID, reason, reference, safe operation summary, preview timestamp and `persisted: false`. It demonstrates layout only. A real audit event requires server actor identity, permission version, allowlisted before/after diff, correlation/idempotency, outcome and tamper-resistant storage.

### Trend points

`AdminTrendPoint`: UTC date, new users, successful purchases, payment failures, generation failures, queued/running/completed job counts and job volume. Any financial series uses integer cents. Deterministic generated points are labelled fixtures and are not analytics collected from Orindle.

## Query and pagination contracts

`AdminQuery` contains safe `q`, optional status/product/model/range filters, `page` and `pageSize`. The frontend clamps pages after filtering. Future server queries must use allowlisted operators, bounded page sizes and stable deterministic ordering; the browser cannot request arbitrary SQL/fields.

`AdminPage<T>` contains `items`, `totalItems`, `page`, `pageSize`, `pageCount` and fixture metadata. Future responses include a safe request correlation ID where useful, never unrestricted database cursors or internal cost without permission.

## Mutation service surface

```ts
interface AdminService {
  updateUserStatus(intent: UserStatusIntent): Promise<AdminPreviewResult>;
  invalidateUserSessions(intent: AccountActionIntent): Promise<AdminPreviewResult>;
  configureProvider(intent: ProviderConfigurationIntent): Promise<AdminPreviewResult>;
  configureModel(intent: ModelConfigurationIntent): Promise<AdminPreviewResult>;
  updateModelPricing(intent: ModelPricingIntent): Promise<AdminPreviewResult>;
  updateCreditPackage(intent: CreditPackageIntent): Promise<AdminPreviewResult>;
  reconcilePayment(intent: PaymentActionIntent): Promise<AdminPreviewResult>;
  adjustCredits(intent: CreditAdjustmentIntent): Promise<AdminPreviewResult>;
  reviewDispute(intent: DisputeReviewIntent): Promise<AdminPreviewResult>;
  retryJob(intent: JobRetryIntent): Promise<AdminPreviewResult>;
  updatePreferences(intent: AdminPreferencesIntent): Promise<AdminPreviewResult>;
}
```

The mock performs no network, cookie, browser-storage, payment, provider, user, job or ledger operation. Future endpoints require verified server permissions, runtime validation, CSRF/origin defenses where applicable, rate limits, current-state checks, idempotency, step-up evidence and audited transactional behavior. Raw provider errors never pass directly to the UI.
