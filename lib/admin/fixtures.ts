import type {
  AdminAuditFixture,
  AdminCreditPackage,
  AdminDispute,
  AdminFixture,
  AdminJob,
  AdminModel,
  AdminModelPrice,
  AdminPayment,
  AdminProvider,
  AdminTransaction,
  AdminTrendPoint,
  AdminUsageEvent,
  AdminUser,
  AdminWebsiteProject,
} from "@/lib/contracts/admin";
import type { DashboardProduct } from "@/lib/contracts/dashboard";
import { getModelById, modelRegistry } from "@/lib/dashboard/models";

export const ADMIN_AS_OF = "2026-11-05T23:59:59.000Z";

function daysAgo(days: number, hour = 12) {
  return new Date(Date.UTC(2026, 10, 5 - days, hour, 0, 0, 0)).toISOString();
}

export const adminUsers: readonly AdminUser[] = [
  { id: "usr_demo_001", fixture: true, name: "Maya Chen", email: "maya.chen@example.com", status: "active", creditBalance: 4280, createdAt: daysAgo(85), lastActiveAt: daysAgo(0, 8) },
  { id: "usr_demo_002", fixture: true, name: "Jon Bell", email: "jon.bell@example.com", status: "active", creditBalance: 890, createdAt: daysAgo(72), lastActiveAt: daysAgo(1) },
  { id: "usr_demo_003", fixture: true, name: "Priya Nair", email: "priya.nair@example.com", status: "review", creditBalance: 12040, createdAt: daysAgo(64), lastActiveAt: daysAgo(3) },
  { id: "usr_demo_004", fixture: true, name: "Theo Martin", email: "theo.martin@example.com", status: "active", creditBalance: 2180, createdAt: daysAgo(55), lastActiveAt: daysAgo(0, 6) },
  { id: "usr_demo_005", fixture: true, name: "Sofia Reyes", email: "sofia.reyes@example.com", status: "active", creditBalance: 760, createdAt: daysAgo(47), lastActiveAt: daysAgo(2) },
  { id: "usr_demo_006", fixture: true, name: "Elliot Brooks", email: "elliot.brooks@example.com", status: "suspended", creditBalance: 0, createdAt: daysAgo(41), lastActiveAt: daysAgo(18) },
  { id: "usr_demo_007", fixture: true, name: "Nina Petrov", email: "nina.petrov@example.com", status: "active", creditBalance: 6450, createdAt: daysAgo(34), lastActiveAt: daysAgo(1, 16) },
  { id: "usr_demo_008", fixture: true, name: "Arjun Shah", email: "arjun.shah@example.com", status: "active", creditBalance: 1670, createdAt: daysAgo(28), lastActiveAt: daysAgo(4) },
  { id: "usr_demo_009", fixture: true, name: "Lena Hoffmann", email: "lena.hoffmann@example.com", status: "review", creditBalance: 3200, createdAt: daysAgo(21), lastActiveAt: daysAgo(6) },
  { id: "usr_demo_010", fixture: true, name: "Owen Wright", email: "owen.wright@example.com", status: "active", creditBalance: 9400, createdAt: daysAgo(14), lastActiveAt: daysAgo(0, 10) },
  { id: "usr_demo_011", fixture: true, name: "Aisha Bello", email: "aisha.bello@example.com", status: "active", creditBalance: 1240, createdAt: daysAgo(9), lastActiveAt: daysAgo(1, 9) },
  { id: "usr_demo_012", fixture: true, name: "Lucas Silva", email: "lucas.silva@example.com", status: "active", creditBalance: 5720, createdAt: daysAgo(5), lastActiveAt: daysAgo(2, 14) },
  { id: "usr_demo_013", fixture: true, name: "Emma Wilson", email: "emma.wilson@example.com", status: "active", creditBalance: 9900, createdAt: daysAgo(1), lastActiveAt: daysAgo(0, 11) },
] as const;

export const adminProviders: readonly AdminProvider[] = [
  { id: "provider_openai", fixture: true, name: "OpenAI", integrationStatus: "operational-fixture", enabled: true, lastHealthCheckAt: daysAgo(0, 9), healthMessage: "Illustrative response-shape check passed; no live check ran.", errorState: null },
  { id: "provider_anthropic", fixture: true, name: "Anthropic", integrationStatus: "degraded-fixture", enabled: true, lastHealthCheckAt: daysAgo(0, 8), healthMessage: "Demo elevated-error state for operational UI review.", errorState: "DEMO-RATE-LIMIT" },
  { id: "provider_google", fixture: true, name: "Google", integrationStatus: "not-connected", enabled: false, lastHealthCheckAt: null, healthMessage: "No live provider connection exists in this frontend.", errorState: "DEMO-NOT-CONFIGURED" },
] as const;

const modelAdminStates = [
  { enabled: true, operationalStatus: "available-fixture", priceVersion: "demo-chat-v3" },
  { enabled: true, operationalStatus: "review-fixture", priceVersion: "demo-reasoning-v2" },
  { enabled: true, operationalStatus: "available-fixture", priceVersion: "demo-multimodal-v4" },
  { enabled: false, operationalStatus: "disabled-fixture", priceVersion: "demo-image-v1" },
  { enabled: true, operationalStatus: "available-fixture", priceVersion: "demo-image-v3" },
  { enabled: false, operationalStatus: "review-fixture", priceVersion: "demo-video-v1" },
] as const;

export const adminModels: readonly AdminModel[] = modelRegistry.map((model, index) => ({
  ...model,
  fixture: true,
  enabled: modelAdminStates[index]?.enabled ?? false,
  operationalStatus: modelAdminStates[index]?.operationalStatus ?? "review-fixture",
  priceVersion: modelAdminStates[index]?.priceVersion ?? "demo-unassigned",
  pricingSummary: "Illustrative admin pricing configuration",
}));

export const adminModelPrices: readonly AdminModelPrice[] = [
  { id: "price_demo_001", fixture: true, modelId: "gpt-6.1-sol", unitLabel: "1M input tokens · demo unit", providerCostCentsPerUnit: 175, customerCreditsPerUnit: 350, version: "demo-chat-v3", effectiveAt: daysAgo(20), status: "current-fixture" },
  { id: "price_demo_002", fixture: true, modelId: "claude-opus-5-5", unitLabel: "1M input tokens · demo unit", providerCostCentsPerUnit: 500, customerCreditsPerUnit: 1000, version: "demo-reasoning-v2", effectiveAt: daysAgo(18), status: "review-fixture" },
  { id: "price_demo_003", fixture: true, modelId: "gemini-3.8-flash", unitLabel: "1M input tokens · demo unit", providerCostCentsPerUnit: 30, customerCreditsPerUnit: 60, version: "demo-multimodal-v4", effectiveAt: daysAgo(15), status: "current-fixture" },
  { id: "price_demo_004", fixture: true, modelId: "gemini-3.1-flash-image", unitLabel: "1 output image · demo unit", providerCostCentsPerUnit: 4, customerCreditsPerUnit: 8, version: "demo-image-v1", effectiveAt: daysAgo(12), status: "review-fixture" },
  { id: "price_demo_005", fixture: true, modelId: "gpt-image-2.5-sunburst", unitLabel: "1 output image · demo unit", providerCostCentsPerUnit: 7, customerCreditsPerUnit: 14, version: "demo-image-v3", effectiveAt: daysAgo(10), status: "current-fixture" },
  { id: "price_demo_006", fixture: true, modelId: "gemini-omni-1.1-flash", unitLabel: "1 output second · demo unit", providerCostCentsPerUnit: 18, customerCreditsPerUnit: 36, version: "demo-video-v1", effectiveAt: daysAgo(-2), status: "scheduled-fixture" },
] as const;

export const adminCreditPackages: readonly AdminCreditPackage[] = [
  { id: "creator", fixture: true, name: "Creator", priceCents: 1900, credits: 1900, enabled: true },
  { id: "pro", fixture: true, name: "Pro", priceCents: 4900, credits: 4900, enabled: true },
  { id: "studio", fixture: true, name: "Studio", priceCents: 9900, credits: 9900, enabled: true },
] as const;

const packageValues = {
  creator: { priceCents: 1900, credits: 1900 },
  pro: { priceCents: 4900, credits: 4900 },
  studio: { priceCents: 9900, credits: 9900 },
} as const;

function makePayment(
  sequence: number,
  userId: string,
  packageId: AdminCreditPackage["id"],
  status: AdminPayment["status"],
  webhookStatus: AdminPayment["webhookStatus"],
  fulfillmentStatus: AdminPayment["fulfillmentStatus"],
  ageDays: number,
): AdminPayment {
  const id = `pay_demo_${String(sequence).padStart(3, "0")}`;
  return {
    id,
    fixture: true,
    providerPaymentId: `provider_${id}`,
    userId,
    packageId,
    amountCents: packageValues[packageId].priceCents,
    currency: "USD",
    status,
    webhookStatus,
    fulfillmentStatus,
    createdAt: daysAgo(ageDays, 10 + (sequence % 8)),
    reference: `ref_demo_payment_${String(sequence).padStart(3, "0")}`,
  };
}

export const adminPayments: readonly AdminPayment[] = [
  makePayment(1, "usr_demo_001", "pro", "succeeded", "verified", "fulfilled", 2),
  makePayment(2, "usr_demo_002", "creator", "succeeded", "verified", "fulfilled", 5),
  makePayment(3, "usr_demo_003", "studio", "failed", "failed", "not-fulfilled", 7),
  makePayment(4, "usr_demo_004", "pro", "succeeded", "verified", "pending", 9),
  makePayment(5, "usr_demo_005", "creator", "pending", "pending", "pending", 11),
  makePayment(6, "usr_demo_006", "studio", "succeeded", "verified", "fulfilled", 15),
  makePayment(7, "usr_demo_007", "pro", "disputed", "verified", "reversed", 19),
  makePayment(8, "usr_demo_008", "creator", "refunded", "verified", "reversed", 24),
  makePayment(9, "usr_demo_009", "pro", "succeeded", "verified", "fulfilled", 30),
  makePayment(10, "usr_demo_010", "studio", "failed", "failed", "not-fulfilled", 37),
  makePayment(11, "usr_demo_011", "creator", "succeeded", "verified", "fulfilled", 45),
  makePayment(12, "usr_demo_012", "pro", "succeeded", "verified", "fulfilled", 58),
  makePayment(13, "usr_demo_013", "studio", "succeeded", "verified", "fulfilled", 76),
  makePayment(14, "usr_demo_001", "creator", "succeeded", "verified", "fulfilled", 86),
] as const;

function makeJob(
  sequence: number,
  userId: string,
  product: DashboardProduct,
  status: AdminJob["status"],
  modelId: string,
  ageDays: number,
  durationMs: number | null,
  errorCode: string | null,
  diagnosticSummary: string,
): AdminJob {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown admin fixture model: ${modelId}`);
  return {
    id: `job_demo_${String(sequence).padStart(3, "0")}`,
    fixture: true,
    userId,
    product,
    status,
    retryCount: status === "failed" ? sequence % 3 : 0,
    provider: model.provider,
    modelId,
    createdAt: daysAgo(ageDays, 7 + (sequence % 10)),
    durationMs,
    errorCode,
    diagnosticSummary,
  };
}

export const adminJobs: readonly AdminJob[] = [
  makeJob(1, "usr_demo_001", "chat", "completed", "gpt-6.1-sol", 0, 8400, null, "Demo completed request; prompt and response content excluded."),
  makeJob(2, "usr_demo_002", "image", "failed", "gpt-image-2.5-sunburst", 1, 16200, "DEMO-CONTENT-REVIEW", "Safe fixture error only; no prompt, image or provider payload retained."),
  makeJob(3, "usr_demo_003", "video", "running", "gemini-omni-1.1-flash", 1, null, null, "Static running fixture; no active provider job exists."),
  makeJob(4, "usr_demo_004", "website", "queued", "claude-opus-5-5", 2, null, null, "Static queued fixture; no build or sandbox was created."),
  makeJob(5, "usr_demo_005", "chat", "completed", "gemini-3.8-flash", 3, 5300, null, "Demo completed request; customer content excluded."),
  makeJob(6, "usr_demo_006", "image", "completed", "gemini-3.1-flash-image", 4, 12100, null, "Demo image operation metadata only."),
  makeJob(7, "usr_demo_007", "video", "failed", "gemini-omni-1.1-flash", 5, 39000, "DEMO-TIMEOUT", "Safe timeout category; no video, frames or provider response retained."),
  makeJob(8, "usr_demo_008", "website", "completed", "gpt-6.1-sol", 6, 25400, null, "Demo website job metadata; source and deployment identifiers excluded."),
  makeJob(9, "usr_demo_009", "chat", "queued", "claude-opus-5-5", 7, null, null, "Static queued fixture; no model call exists."),
  makeJob(10, "usr_demo_010", "image", "running", "gpt-image-2.5-sunburst", 8, null, null, "Static running fixture; no image job exists."),
  makeJob(11, "usr_demo_011", "video", "completed", "gemini-omni-1.1-flash", 9, 44800, null, "Demo video operation metadata only."),
  makeJob(12, "usr_demo_012", "website", "failed", "claude-opus-5-5", 10, 30000, "DEMO-BUILD-VALIDATION", "Safe validation category; generated source and build logs excluded."),
  makeJob(13, "usr_demo_001", "chat", "failed", "gpt-6.1-sol", 11, 2300, "DEMO-RATE-LIMIT", "Safe rate-limit category; request content excluded."),
  makeJob(14, "usr_demo_002", "image", "completed", "gemini-3.1-flash-image", 12, 13600, null, "Demo image operation metadata only."),
  makeJob(15, "usr_demo_003", "video", "queued", "gemini-omni-1.1-flash", 14, null, null, "Static queued fixture; no video job exists."),
  makeJob(16, "usr_demo_004", "website", "running", "gpt-6.1-sol", 15, null, null, "Static running fixture; no deployment is in progress."),
] as const;

const productCredits: Readonly<Record<DashboardProduct, number>> = {
  chat: 12,
  image: 96,
  video: 480,
  website: 180,
};

export const adminUsageEvents: readonly AdminUsageEvent[] = adminJobs
  .filter((job) => job.status === "completed" || job.status === "failed")
  .map((job, index) => {
    const creditsDeducted = productCredits[job.product] + (index % 3) * 4;
    const failedWithoutCharge = job.status === "failed" && index % 2 === 0;
    return {
      id: `usage_demo_${String(index + 1).padStart(3, "0")}`,
      fixture: true,
      userId: job.userId,
      jobId: job.id,
      product: job.product,
      modelId: job.modelId,
      occurredAt: job.createdAt,
      creditsDeducted,
      providerCostCents: failedWithoutCharge ? 0 : Math.max(1, Math.round(creditsDeducted * (0.28 + (index % 4) * 0.07))),
      reconciliationStatus: index % 5 === 0 ? "unreconciled" : "reconciled",
      generationStatus: job.status === "failed" ? "failed" : "completed",
    };
  });

const paymentTransactions: readonly AdminTransaction[] = adminPayments.map((payment) => ({
  id: `txn_demo_${payment.id}`,
  fixture: true,
  reference: payment.reference,
  type: "purchase",
  userId: payment.userId,
  relatedId: payment.id,
  modelId: null,
  credits: payment.fulfillmentStatus === "fulfilled" ? packageValues[payment.packageId].credits : 0,
  amountCents: payment.amountCents,
  currency: "USD",
  status: payment.status,
  createdAt: payment.createdAt,
}));

const usageTransactions: readonly AdminTransaction[] = adminUsageEvents.map((event) => ({
  id: `txn_demo_${event.id}`,
  fixture: true,
  reference: `ref_demo_${event.id}`,
  type: "usage",
  userId: event.userId,
  relatedId: event.jobId,
  modelId: event.modelId,
  credits: -event.creditsDeducted,
  amountCents: null,
  currency: "USD",
  status: event.reconciliationStatus,
  createdAt: event.occurredAt,
}));

export const adminAuditEvents: readonly AdminAuditFixture[] = [
  { id: "audit_demo_001", fixture: true, actorLabel: "Demo admin", action: "credit.adjustment", targetType: "user", targetId: "usr_demo_001", reason: "Illustrative correction for a duplicated usage deduction.", reference: "SUP-DEMO-1042", summary: "+500 credits · correction", createdAt: daysAgo(3), persisted: false },
  { id: "audit_demo_002", fixture: true, actorLabel: "Demo admin", action: "credit.adjustment", targetType: "user", targetId: "usr_demo_007", reason: "Illustrative reversal of a duplicate manual adjustment.", reference: "SUP-DEMO-1036", summary: "-200 credits · correction", createdAt: daysAgo(8), persisted: false },
  { id: "audit_demo_003", fixture: true, actorLabel: "Demo admin", action: "dispute.review", targetType: "dispute", targetId: "dispute_demo_001", reason: "Illustrative evidence review state; no provider action taken.", reference: "DSP-DEMO-207", summary: "Dispute moved to review · fixture only", createdAt: daysAgo(12), persisted: false },
] as const;

const adjustmentCredits = [500, -200, 4900] as const;
const adjustmentTransactions: readonly AdminTransaction[] = adminAuditEvents.map((event, index) => ({
  id: `txn_demo_adjustment_${index + 1}`,
  fixture: true,
  reference: event.reference,
  type: index === 2 ? "dispute" : "adjustment",
  userId: event.targetType === "user" ? event.targetId : "usr_demo_007",
  relatedId: event.id,
  modelId: null,
  credits: adjustmentCredits[index] ?? 0,
  amountCents: null,
  currency: "USD",
  status: "fixture-review",
  createdAt: event.createdAt,
}));

export const adminTransactions: readonly AdminTransaction[] = [...paymentTransactions, ...usageTransactions, ...adjustmentTransactions]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const adminWebsites: readonly AdminWebsiteProject[] = [
  { id: "site_demo_001", fixture: true, name: "Stillwater Retreat", userId: "usr_demo_001", status: "active", deploymentStatus: "deployed", domain: "stillwater.example", lastDeploymentAt: daysAgo(1), failureCode: null },
  { id: "site_demo_002", fixture: true, name: "Ceramic Notes", userId: "usr_demo_002", status: "draft", deploymentStatus: "not-deployed", domain: null, lastDeploymentAt: null, failureCode: null },
  { id: "site_demo_003", fixture: true, name: "Northstar Studio", userId: "usr_demo_003", status: "active", deploymentStatus: "failed", domain: "northstar.example", lastDeploymentAt: daysAgo(4), failureCode: "DEMO-BUILD-VALIDATION" },
  { id: "site_demo_004", fixture: true, name: "Fieldwork Journal", userId: "usr_demo_004", status: "active", deploymentStatus: "pending", domain: "fieldwork.example", lastDeploymentAt: daysAgo(2), failureCode: null },
  { id: "site_demo_005", fixture: true, name: "Atelier Twenty", userId: "usr_demo_005", status: "archived", deploymentStatus: "not-deployed", domain: null, lastDeploymentAt: daysAgo(28), failureCode: null },
  { id: "site_demo_006", fixture: true, name: "Good Form Studio", userId: "usr_demo_007", status: "active", deploymentStatus: "deployed", domain: "goodform.example", lastDeploymentAt: daysAgo(6), failureCode: null },
  { id: "site_demo_007", fixture: true, name: "Sunday Market", userId: "usr_demo_009", status: "draft", deploymentStatus: "failed", domain: null, lastDeploymentAt: daysAgo(7), failureCode: "DEMO-DOMAIN-VERIFICATION" },
  { id: "site_demo_008", fixture: true, name: "Common Ground", userId: "usr_demo_010", status: "active", deploymentStatus: "deployed", domain: "commonground.example", lastDeploymentAt: daysAgo(9), failureCode: null },
] as const;

export const adminDisputes: readonly AdminDispute[] = [
  { id: "dispute_demo_001", fixture: true, paymentId: "pay_demo_007", userId: "usr_demo_007", amountCents: 4900, currency: "USD", status: "under-review", category: "not-recognized", createdAt: daysAgo(18), updatedAt: daysAgo(2) },
  { id: "dispute_demo_002", fixture: true, paymentId: "pay_demo_004", userId: "usr_demo_004", amountCents: 4900, currency: "USD", status: "open", category: "credit-fulfillment", createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  { id: "dispute_demo_003", fixture: true, paymentId: "pay_demo_002", userId: "usr_demo_002", amountCents: 1900, currency: "USD", status: "resolved-fixture", category: "duplicate-charge", createdAt: daysAgo(22), updatedAt: daysAgo(16) },
] as const;

const trendStart = Date.UTC(2026, 7, 8, 0, 0, 0, 0);
export const adminTrend: readonly AdminTrendPoint[] = Array.from({ length: 90 }, (_, index) => {
  const date = new Date(trendStart + index * 86_400_000).toISOString();
  const day = date.slice(0, 10);
  const queuedJobs = (index * 5) % 8;
  const runningJobs = (index * 3) % 6;
  const completedJobs = 20 + ((index * 11) % 27);
  const generationFailures = (index * 7) % 5;
  return {
    date,
    newUsers: adminUsers.filter((user) => user.createdAt.slice(0, 10) === day).length,
    successfulPurchases: adminPayments.filter((payment) => payment.status === "succeeded" && payment.createdAt.slice(0, 10) === day).length,
    paymentFailures: adminPayments.filter((payment) => payment.status === "failed" && payment.createdAt.slice(0, 10) === day).length,
    generationFailures,
    queuedJobs,
    runningJobs,
    completedJobs,
    jobVolume: queuedJobs + runningJobs + completedJobs + generationFailures,
  };
});

export const adminNotifications = [
  { id: "notice_demo_001", title: "Payment review example", detail: "Demo: two failed payments and one pending fulfillment are ready for review.", timeLabel: "Fixture · 09:30 UTC", read: false },
  { id: "notice_demo_002", title: "Provider degradation example", detail: "Demo: Anthropic is showing a degraded integration state. No live incident exists.", timeLabel: "Fixture · 08:45 UTC", read: false },
  { id: "notice_demo_003", title: "Unreconciled usage example", detail: "Demo: selected usage records illustrate the reconciliation queue.", timeLabel: "Fixture · Nov 4", read: true },
] as const;

export const adminFixture: AdminFixture = {
  fixture: true,
  asOf: ADMIN_AS_OF,
  users: adminUsers,
  providers: adminProviders,
  models: adminModels,
  modelPrices: adminModelPrices,
  creditPackages: adminCreditPackages,
  payments: adminPayments,
  transactions: adminTransactions,
  usageEvents: adminUsageEvents,
  jobs: adminJobs,
  websites: adminWebsites,
  disputes: adminDisputes,
  auditEvents: adminAuditEvents,
  trend: adminTrend,
  notifications: adminNotifications,
};

export function getAdminUser(userId: string) {
  return adminUsers.find((user) => user.id === userId) ?? null;
}

export function getAdminModel(modelId: string) {
  return adminModels.find((model) => model.id === modelId) ?? null;
}

export function getAdminPackage(packageId: string) {
  return adminCreditPackages.find((creditPackage) => creditPackage.id === packageId) ?? null;
}
