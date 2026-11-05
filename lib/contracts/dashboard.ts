export type DashboardProduct = "chat" | "image" | "video" | "website";
export type ModelProvider = "OpenAI" | "Anthropic" | "Google";
export type ModelModality = "text" | "image" | "video" | "audio" | "pdf";
export type GenerationStatus = "queued" | "processing" | "completed" | "failed";

export type ModelRegistryEntry = {
  id: string;
  displayName: string;
  provider: ModelProvider;
  products: readonly DashboardProduct[];
  capabilities: readonly string[];
  inputModalities: readonly ModelModality[];
  outputModalities: readonly ModelModality[];
  contextDisplay: string | null;
  pricingDisplay: string;
  availability: "catalog-fixture";
  featureTags: readonly string[];
  supportsNegativePrompt: boolean;
  sourceUrl: string;
};

export type DemoProfile = {
  name: string;
  email: string;
  initials: string;
  workspaceName: string;
};

export type ProjectFixture = {
  id: string;
  fixture: true;
  name: string;
  description: string;
  product: DashboardProduct;
  status: "active" | "draft" | "published" | "archived";
  updatedLabel: string;
  generationIds: readonly string[];
};

export type GenerationFixture = {
  id: string;
  fixture: true;
  title: string;
  product: DashboardProduct;
  modelId: string;
  projectId: string | null;
  status: GenerationStatus;
  progress: number | null;
  credits: number;
  createdLabel: string;
  assetIds: readonly string[];
  errorMessage: string | null;
};

export type DashboardMessage = {
  id: string;
  role: "user" | "assistant";
  markdown: string;
  modelId: string | null;
  status: "ready" | "streaming" | "error";
};

export type ConversationFixture = {
  id: string;
  fixture: true;
  title: string;
  projectId: string | null;
  modelId: string;
  updatedLabel: string;
  messages: readonly DashboardMessage[];
};

export type LibraryAsset = {
  id: string;
  fixture: true;
  name: string;
  type: "image" | "video" | "website" | "document";
  product: DashboardProduct;
  previewUrl: string | null;
  alt: string;
  sizeLabel: string;
  createdLabel: string;
  downloadable: boolean;
};

export type WebsiteProject = {
  id: string;
  fixture: true;
  name: string;
  description: string;
  publishStatus: "published" | "unpublished";
  updatedLabel: string;
  previewImage: string;
  previewImageAlt: string;
  previewHeadline: string;
  previewDescription: string;
  previewUrl: null;
  pages: readonly string[];
  sections: readonly string[];
  code: string;
};

export type NotificationFixture = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  read: boolean;
};

export type LedgerEntry = {
  id: string;
  fixture: true;
  kind: "purchase" | "usage";
  title: string;
  detail: string;
  product: DashboardProduct | "wallet";
  status: "completed" | "processing" | "failed";
  credits: number;
  amountUsd: number | null;
  createdLabel: string;
  reference: string;
};

export type WalletFixture = {
  fixture: true;
  balance: number;
  usedThisMonth: number;
  byProduct: Readonly<Record<DashboardProduct, number>>;
  ledger: readonly LedgerEntry[];
};

export type WorkspaceFixture = {
  kind: "fixture";
  profile: DemoProfile;
  wallet: WalletFixture;
  notifications: readonly NotificationFixture[];
  projects: readonly ProjectFixture[];
  generations: readonly GenerationFixture[];
  conversations: readonly ConversationFixture[];
  assets: readonly LibraryAsset[];
  websites: readonly WebsiteProject[];
};

export type ImageEstimateInput = {
  resolution: "1024" | "2048" | "4096";
  count: 1 | 2 | 4;
  hasReference: boolean;
};

export type VideoEstimateInput = {
  duration: 3 | 6 | 10;
  resolution: "360p" | "720p" | "1080p" | "4K";
  hasReference: boolean;
};

export type WebsiteEstimateInput = { sections: number; hasReference: boolean };
export type GenerationQuote = { kind: "fixture"; estimatedCredits: number; summary: string };

export type GenerationIntentRequest = {
  product: DashboardProduct;
  modelId: string;
  prompt: string;
  attachmentNames?: readonly string[];
  options?: Readonly<Record<string, string | number | boolean>>;
};

export type SaveProjectRequest = { projectId?: string; name: string; product: DashboardProduct };
export type DeleteProjectRequest = { projectId: string };
export type AssetActionRequest = { assetId: string };
export type PurchaseCreditsRequest = { packId: "creator" | "pro" | "studio" };
export type UpdateSettingsRequest = {
  section: "profile" | "security" | "preferences" | "notifications" | "connections" | "website";
  values: Readonly<Record<string, string | boolean>>;
};
export type AccountDeletionRequest = { confirmation: string };
export type SaveWebsiteRequest = { projectId: string; code: string; headline: string };
export type PublishWebsiteRequest = { projectId: string };

export type DashboardPreviewResult = {
  status: "preview" | "unavailable";
  message: string;
  persisted: false;
  creditsChanged: 0;
};

// Display-friendly aliases keep feature components concise while preserving the
// canonical fixture DTO names above.
export type ProductId = DashboardProduct;
export type FixtureAsset = LibraryAsset;
export type FixtureGeneration = GenerationFixture;
export type FixtureConversation = ConversationFixture;
export type FixtureMessage = DashboardMessage;

export type GenerationIntentChat = {
  product: "chat";
  modelId: string;
  prompt: string;
  attachmentNames: readonly string[];
};

export type GenerationIntentImage = {
  product: "image";
  modelId: string;
  prompt: string;
  negativePrompt: string;
  referenceName: string | null;
  ratio: "square" | "portrait" | "landscape" | "wide";
  resolution: "1k" | "2k" | "4k";
  count: number;
  style: "none" | "editorial" | "product" | "natural";
};

export type GenerationIntentVideo = {
  product: "video";
  modelId: string;
  mode: "text" | "image";
  prompt: string;
  durationSeconds: 3 | 6 | 10;
  ratio: "wide" | "portrait" | "square";
  resolution: "360p" | "720p" | "1080p" | "4k";
  referenceName: string | null;
};

export type GenerationIntentWebsite = {
  product: "website";
  modelId: string;
  brief: string;
  siteType: "landing" | "business" | "portfolio" | "waitlist";
  sections: number;
  includeContact: boolean;
  includeFaq: boolean;
  includeSeo: boolean;
};

export type GenerationIntent = GenerationIntentChat | GenerationIntentImage | GenerationIntentVideo | GenerationIntentWebsite;

export type CreditEstimate = {
  fixture: true;
  product: ProductId;
  credits: number | null;
  pricingKind: "estimate";
  explanation: string;
  modelId: string | null;
  quoteId: null;
};

export interface DashboardService {
  generate(request: GenerationIntentRequest): Promise<DashboardPreviewResult>;
  saveProject(request: SaveProjectRequest): Promise<DashboardPreviewResult>;
  deleteProject(request: DeleteProjectRequest): Promise<DashboardPreviewResult>;
  saveAsset(request: AssetActionRequest): Promise<DashboardPreviewResult>;
  deleteAsset(request: AssetActionRequest): Promise<DashboardPreviewResult>;
  downloadAsset(request: AssetActionRequest): Promise<DashboardPreviewResult>;
  purchaseCredits(request: PurchaseCreditsRequest): Promise<DashboardPreviewResult>;
  updateSettings(request: UpdateSettingsRequest): Promise<DashboardPreviewResult>;
  requestAccountDeletion(request: AccountDeletionRequest): Promise<DashboardPreviewResult>;
  saveWebsite(request: SaveWebsiteRequest): Promise<DashboardPreviewResult>;
  publishWebsite(request: PublishWebsiteRequest): Promise<DashboardPreviewResult>;
}
