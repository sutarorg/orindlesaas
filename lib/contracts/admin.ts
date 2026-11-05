import type {
  DashboardProduct,
  ModelModality,
  ModelProvider,
  ModelRegistryEntry,
} from "@/lib/contracts/dashboard";

export type AdminRange = "7d" | "30d" | "90d";
export type AdminCurrency = "USD";
export type AdminUserStatus = "active" | "review" | "suspended";
export type AdminPaymentStatus = "succeeded" | "pending" | "failed" | "refunded" | "disputed";
export type AdminJobStatus = "queued" | "running" | "completed" | "failed";

export type AdminUser = {
  id: string;
  fixture: true;
  name: string;
  email: string;
  status: AdminUserStatus;
  creditBalance: number;
  createdAt: string;
  lastActiveAt: string;
};

export type AdminProvider = {
  id: string;
  fixture: true;
  name: ModelProvider;
  integrationStatus: "operational-fixture" | "degraded-fixture" | "not-connected";
  enabled: boolean;
  lastHealthCheckAt: string | null;
  healthMessage: string;
  errorState: string | null;
};

export type AdminModel = ModelRegistryEntry & {
  fixture: true;
  enabled: boolean;
  operationalStatus: "available-fixture" | "disabled-fixture" | "review-fixture";
  priceVersion: string;
  pricingSummary: string;
};

export type AdminModelPrice = {
  id: string;
  fixture: true;
  modelId: string;
  unitLabel: string;
  providerCostCentsPerUnit: number;
  customerCreditsPerUnit: number;
  version: string;
  effectiveAt: string;
  status: "current-fixture" | "scheduled-fixture" | "review-fixture";
};

export type AdminCreditPackage = {
  id: "creator" | "pro" | "studio";
  fixture: true;
  name: "Creator" | "Pro" | "Studio";
  priceCents: number;
  credits: number;
  enabled: boolean;
};

export type AdminPayment = {
  id: string;
  fixture: true;
  providerPaymentId: string;
  userId: string;
  packageId: AdminCreditPackage["id"];
  amountCents: number;
  currency: AdminCurrency;
  status: AdminPaymentStatus;
  webhookStatus: "verified" | "pending" | "failed";
  fulfillmentStatus: "fulfilled" | "pending" | "not-fulfilled" | "reversed";
  createdAt: string;
  reference: string;
};

export type AdminTransaction = {
  id: string;
  fixture: true;
  reference: string;
  type: "purchase" | "usage" | "adjustment" | "refund" | "dispute";
  userId: string;
  relatedId: string | null;
  modelId: string | null;
  credits: number;
  amountCents: number | null;
  currency: AdminCurrency;
  status: string;
  createdAt: string;
};

export type AdminUsageEvent = {
  id: string;
  fixture: true;
  userId: string;
  jobId: string;
  product: DashboardProduct;
  modelId: string;
  occurredAt: string;
  creditsDeducted: number;
  providerCostCents: number;
  reconciliationStatus: "reconciled" | "unreconciled";
  generationStatus: "completed" | "failed";
};

export type AdminJob = {
  id: string;
  fixture: true;
  userId: string;
  product: DashboardProduct;
  status: AdminJobStatus;
  retryCount: number;
  provider: ModelProvider;
  modelId: string;
  createdAt: string;
  durationMs: number | null;
  errorCode: string | null;
  diagnosticSummary: string;
};

export type AdminWebsiteProject = {
  id: string;
  fixture: true;
  name: string;
  userId: string;
  status: "active" | "draft" | "archived";
  deploymentStatus: "deployed" | "pending" | "failed" | "not-deployed";
  domain: string | null;
  lastDeploymentAt: string | null;
  failureCode: string | null;
};

export type AdminDispute = {
  id: string;
  fixture: true;
  paymentId: string;
  userId: string;
  amountCents: number;
  currency: AdminCurrency;
  status: "open" | "under-review" | "resolved-fixture";
  category: "duplicate-charge" | "not-recognized" | "credit-fulfillment";
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditPreview = {
  id: string;
  actorLabel: "Demo admin";
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  reference: string;
  summary: string;
  createdAt: string;
  persisted: false;
};

export type AdminAuditFixture = AdminAuditPreview & {
  fixture: true;
};

export type AdminTrendPoint = {
  date: string;
  newUsers: number;
  successfulPurchases: number;
  paymentFailures: number;
  generationFailures: number;
  queuedJobs: number;
  runningJobs: number;
  completedJobs: number;
  jobVolume: number;
};

export type AdminNotification = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  read: boolean;
};

export type AdminFixture = {
  fixture: true;
  asOf: string;
  users: readonly AdminUser[];
  providers: readonly AdminProvider[];
  models: readonly AdminModel[];
  modelPrices: readonly AdminModelPrice[];
  creditPackages: readonly AdminCreditPackage[];
  payments: readonly AdminPayment[];
  transactions: readonly AdminTransaction[];
  usageEvents: readonly AdminUsageEvent[];
  jobs: readonly AdminJob[];
  websites: readonly AdminWebsiteProject[];
  disputes: readonly AdminDispute[];
  auditEvents: readonly AdminAuditFixture[];
  trend: readonly AdminTrendPoint[];
  notifications: readonly AdminNotification[];
};

export type AdminPreviewResult = {
  status: "preview" | "unavailable";
  message: string;
  persisted: false;
  auditPersisted: false;
  paymentChanged: false;
  creditsChanged: 0;
  auditPreview?: AdminAuditPreview;
};

type ConfirmedIntent = {
  reason: string;
  confirmed: true;
};

export type UserStatusIntent = ConfirmedIntent & {
  userId: string;
  status: AdminUserStatus;
};
export type AccountActionIntent = ConfirmedIntent & { userId: string };
export type ProviderConfigurationIntent = ConfirmedIntent & { providerId: string; enabled: boolean };
export type ModelConfigurationIntent = ConfirmedIntent & {
  modelId: string;
  enabled: boolean;
  products: readonly DashboardProduct[];
};
export type ModelPricingIntent = ConfirmedIntent & {
  modelId: string;
  providerCostCentsPerUnit: number;
  customerCreditsPerUnit: number;
  effectiveAt: string;
};
export type CreditPackageIntent = ConfirmedIntent & {
  packageId: AdminCreditPackage["id"];
  priceCents: number;
  credits: number;
  enabled: boolean;
};
export type PaymentActionIntent = ConfirmedIntent & { paymentId: string };
export type CreditAdjustmentIntent = ConfirmedIntent & {
  userId: string;
  credits: number;
  category: "correction" | "goodwill" | "dispute";
  reference: string;
};
export type DisputeReviewIntent = ConfirmedIntent & {
  disputeId: string;
  status: AdminDispute["status"];
};
export type JobRetryIntent = ConfirmedIntent & { jobId: string };
export type AdminPreferencesIntent = ConfirmedIntent & {
  defaultRange: AdminRange;
  density: "comfortable" | "compact";
  notifications: boolean;
};

export interface AdminService {
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

export type AdminPermission =
  | "admin:read"
  | "users:read"
  | "users:manage"
  | "catalog:read"
  | "catalog:manage"
  | "pricing:read"
  | "pricing:manage"
  | "payments:read"
  | "payments:reconcile"
  | "credits:read"
  | "credits:adjust"
  | "disputes:read"
  | "disputes:manage"
  | "usage:read"
  | "jobs:read"
  | "jobs:retry"
  | "websites:read"
  | "settings:read"
  | "settings:manage"
  | "audit:read";

export type AdminPage<T> = {
  items: readonly T[];
  totalItems: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminModelCapabilitySummary = {
  products: readonly DashboardProduct[];
  inputModalities: readonly ModelModality[];
  outputModalities: readonly ModelModality[];
};
