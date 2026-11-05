import type {
  AccountDeletionRequest,
  AssetActionRequest,
  DashboardPreviewResult,
  DashboardService,
  DeleteProjectRequest,
  GenerationIntentRequest,
  PublishWebsiteRequest,
  PurchaseCreditsRequest,
  SaveProjectRequest,
  SaveWebsiteRequest,
  UpdateSettingsRequest,
} from "@/lib/contracts/dashboard";

export class MockDashboardAdapter implements DashboardService {
  constructor(private readonly delayMs = 250) {}

  private async preview(message: string): Promise<DashboardPreviewResult> {
    if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return { status: "preview", message, persisted: false, creditsChanged: 0 };
  }

  generate(request: GenerationIntentRequest): Promise<DashboardPreviewResult> {
    const messages = {
      chat: "Your message remains in this local preview only. No model was called, no stream started and no conversation was saved.",
      image: "Your image settings passed local validation. No generation job was created, no image was generated and no credits were deducted.",
      video: "Your video settings passed local validation. No job was queued, no video was generated and no credits were deducted.",
      website: "Your website brief passed local validation. No website project, code or deployment was generated and no credits were deducted.",
    } as const;
    return this.preview(messages[request.product]);
  }

  saveProject(request: SaveProjectRequest): Promise<DashboardPreviewResult> {
    return this.preview(request.projectId ? "The local name edit was validated. No project was renamed and no change was saved." : "The project brief was validated. No project was created and no data was saved.");
  }

  deleteProject(request: DeleteProjectRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("Delete confirmation was validated locally. No project or related generation was deleted or changed.");
  }

  saveAsset(request: AssetActionRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("The asset action was validated locally. No library item was added, duplicated or saved.");
  }

  deleteAsset(request: AssetActionRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("Delete confirmation was validated locally. No asset was deleted and no library change was saved.");
  }

  downloadAsset(request: AssetActionRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("No downloadable production asset is attached to this fixture. No file was downloaded.");
  }

  purchaseCredits(request: PurchaseCreditsRequest): Promise<DashboardPreviewResult> {
    return this.preview(`The ${request.packId} pack is display intent only. No checkout opened, no payment was taken and no credits were added.`);
  }

  updateSettings(request: UpdateSettingsRequest): Promise<DashboardPreviewResult> {
    return this.preview(`The ${request.section} settings were validated locally. No settings, profile or connected account was changed or saved.`);
  }

  requestAccountDeletion(request: AccountDeletionRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("The confirmation text was validated locally. No deletion request was submitted and no account or data was deleted.");
  }

  saveWebsite(request: SaveWebsiteRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("Your local edits remain in this preview only. No website code, settings or project was saved.");
  }

  publishWebsite(request: PublishWebsiteRequest): Promise<DashboardPreviewResult> {
    void request;
    return this.preview("Publish is not connected in this demo. No deployment started, no website was published and no preview URL was assigned.");
  }
}

export const mockDashboardService = new MockDashboardAdapter();
export const previewDashboardService = mockDashboardService;
