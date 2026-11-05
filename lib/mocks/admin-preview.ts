import type {
  AccountActionIntent,
  AdminPreferencesIntent,
  AdminPreviewResult,
  AdminService,
  CreditAdjustmentIntent,
  CreditPackageIntent,
  DisputeReviewIntent,
  JobRetryIntent,
  ModelConfigurationIntent,
  ModelPricingIntent,
  PaymentActionIntent,
  ProviderConfigurationIntent,
  UserStatusIntent,
} from "@/lib/contracts/admin";

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export class MockAdminAdapter implements AdminService {
  constructor(private readonly delay = 250) {}

  private async preview(message: string): Promise<AdminPreviewResult> {
    await wait(this.delay);
    return {
      status: "preview",
      message,
      persisted: false,
      auditPersisted: false,
      paymentChanged: false,
      creditsChanged: 0,
    };
  }

  updateUserStatus(intent: UserStatusIntent) {
    return this.preview(`Preview validated for ${intent.userId}. No user account or status changed, and no operational audit was written.`);
  }

  invalidateUserSessions(intent: AccountActionIntent) {
    return this.preview(`Session-invalidation intent reviewed for ${intent.userId}. No session was revoked and no user was signed out.`);
  }

  configureProvider(intent: ProviderConfigurationIntent) {
    return this.preview(`Provider configuration preview reviewed for ${intent.providerId}. No integration, enabled state or health status changed.`);
  }

  configureModel(intent: ModelConfigurationIntent) {
    return this.preview(`Model availability preview reviewed for ${intent.modelId}. No model, product availability or provider configuration changed.`);
  }

  updateModelPricing(intent: ModelPricingIntent) {
    return this.preview(`Pricing intent reviewed for ${intent.modelId}. No price version was saved, scheduled or used for a charge.`);
  }

  updateCreditPackage(intent: CreditPackageIntent) {
    return this.preview(`Package configuration preview reviewed for ${intent.packageId}. No package, checkout or customer price changed.`);
  }

  reconcilePayment(intent: PaymentActionIntent) {
    return this.preview(`Reconciliation preview reviewed for ${intent.paymentId}. No payment, webhook, fulfillment or credit ledger changed.`);
  }

  async adjustCredits(intent: CreditAdjustmentIntent): Promise<AdminPreviewResult> {
    await wait(this.delay);
    const timestamp = new Date().toISOString();
    return {
      status: "preview",
      message: `Adjustment intent reviewed for ${intent.userId}: ${intent.credits > 0 ? "+" : ""}${intent.credits} credits. No wallet or ledger changed; the audit record below is an ephemeral preview only.`,
      persisted: false,
      auditPersisted: false,
      paymentChanged: false,
      creditsChanged: 0,
      auditPreview: {
        id: `audit-preview-${timestamp}`,
        actorLabel: "Demo admin",
        action: "credit.adjustment.preview",
        targetType: "user",
        targetId: intent.userId,
        reason: intent.reason,
        reference: intent.reference,
        summary: `${intent.credits > 0 ? "+" : ""}${intent.credits} credits · ${intent.category}`,
        createdAt: timestamp,
        persisted: false,
      },
    };
  }

  reviewDispute(intent: DisputeReviewIntent) {
    return this.preview(`Dispute review preview validated for ${intent.disputeId}. No dispute, payment, chargeback or balance changed.`);
  }

  retryJob(intent: JobRetryIntent) {
    return this.preview(`Retry intent reviewed for ${intent.jobId}. No provider was called, no job was queued and no credits were deducted.`);
  }

  updatePreferences(intent: AdminPreferencesIntent) {
    return this.preview(`Display preferences validated locally (${intent.defaultRange}, ${intent.density}). No admin preference, notification setting or role changed.`);
  }
}

export const mockAdminService = new MockAdminAdapter();
export const previewAdminService = mockAdminService;
