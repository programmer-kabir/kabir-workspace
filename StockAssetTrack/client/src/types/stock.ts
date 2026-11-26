export type MediaType = 'Photo' | 'Illustration' | 'Vector' | 'Video' | 'Template' | '3D';
export type SortOption =
  | 'relevance'
  | 'creation'
  | 'featured'
  | 'nb_downloads'
  | 'undiscovered'
  | 'velocity';
export type ContentTypeFilter = 'all' | 'photo' | 'illustration' | 'vector' | 'video' | 'template' | '3d';
export type GenAIFilter = 'all' | 'only' | 'exclude';
export type PlanTier = 'free' | 'starter' | 'pro' | 'annual';
export type HeatmapMetric = 'totalDownloads' | 'avgDownloads' | 'sampleSize';

export type ClientSortKey =
  | 'default'
  | 'most_downloads'
  | 'least_downloads'
  | 'newest'
  | 'oldest'
  | 'best_performance'
  | 'ai_first'
  | 'non_ai_first'
  | 'most_keywords'
  | 'least_keywords'
  | 'shortest_title'
  | 'longest_title';

export interface StockAsset {
  id: string;
  title: string;
  thumbnailUrl: string;
  preview1000Url: string;
  videoPreviewUrl: string | null;
  mediaType: MediaType;
  mediaTypeId: 1 | 2 | 3 | 4 | 7 | 8;
  contentType: string;
  category: string;
  dimensions: string;
  creationDate: string | null;
  isAI: boolean;
  downloads: number;
  monthlyVelocity: number | null;
  performanceScore: number;
  keywords: string[];
  creator: string;
  creatorId: string;
  creatorCountry: { code: string; name: string; flag: string } | null;
}

export interface SearchSummary {
  query: string;
  totalResults: number;
  demandScore: number;
  competitionScore: number;
  opportunityIndex: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  trendType: 'Evergreen' | 'Seasonal Spike' | 'Breakout Trending';
  typeCounts: Record<'photo' | 'illustration' | 'vector' | 'video', number>;
  aiSplit: { aiCount: number; realCount: number; aiPercent: number };
}

export interface SearchResponse {
  success: boolean;
  cached: boolean;
  mode: string;
  page: number;
  perPage: number;
  hasMore: boolean;
  summary: SearchSummary;
  assets: StockAsset[];
}

export interface VisualUploadSignals {
  orientation?: string;
  dominantStyle?: string;
  dominantCategory?: string;
  dimensions?: string;
  inferredTags?: string[];
}

export interface UploadMetaSummary {
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  width: number;
  height: number;
  sha256: string;
  topMatchId?: string;
  matchedSignals?: VisualUploadSignals;
}

export interface SimilarResponse extends SearchResponse {
  source: 'imageId' | 'upload';
  imageId?: string;
  uploadHash?: string;
  referenceAsset?: StockAsset | null;
  uploadMeta?: UploadMetaSummary;
}

export interface HeatmapMediaTypeSummary {
  key: Exclude<ContentTypeFilter, 'all'>;
  label: MediaType;
  sampledAssets: number;
  categoryCount: number;
  totalDownloads: number;
  aiPercent: number;
}

export interface HeatmapCategoryTile {
  name: string;
  mediaType: MediaType;
  mediaTypeKey: Exclude<ContentTypeFilter, 'all'>;
  totalDownloads: number;
  avgDownloads: number;
  sampleSize: number;
  aiCount: number;
  aiPercent: number;
  avgVelocity: number;
  topKeywords: string[];
}

export interface HeatmapResponse {
  success: boolean;
  cached: boolean;
  mode: string;
  metric: HeatmapMetric;
  selectedType: ContentTypeFilter;
  generatedAt: string;
  nextRefreshAt: string;
  triggerSource: string;
  summary: {
    totalSampledAssets: number;
    totalSampledDownloads: number;
    overallAiPercent: number;
    topCategory: { name: string; mediaType: string; totalDownloads: number };
    topVelocityCategory: { name: string; mediaType: string; avgVelocity: number };
  };
  mediaTypes: HeatmapMediaTypeSummary[];
  categoriesByType: Record<string, HeatmapCategoryTile[]>;
}

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

export interface ContributorMonthlyPoint {
  month: string;
  uploads: number;
  downloads: number;
  velocity: number;
}

export interface ContributorCategoryStat {
  name: string;
  count: number;
  downloads: number;
}

export interface ContributorProfile {
  id: string;
  name: string;
  country: CountryInfo | null;
  adobeProfileUrl: string;
  watching: boolean;
}

export interface ContributorStatsResponse {
  success: boolean;
  cached: boolean;
  mode: string;
  creatorId: string;
  creatorName: string;
  country: CountryInfo | null;
  totalAssets: number;
  totalDownloads: number;
  avgDownloads: number;
  aiCount: number;
  nonAiCount: number;
  aiPercent: number;
  topCategories: ContributorCategoryStat[];
  monthlySeries: ContributorMonthlyPoint[];
  source: string;
  computedAt: string;
  watching: boolean;
}

export interface ContributorSearchResponse extends SearchResponse {
  contributor: ContributorProfile;
}

export interface WatchlistEntry {
  creatorId: string;
  creatorName: string;
  country: CountryInfo | null;
  lastTotalAssets: number;
  lastTotalDownloads: number;
  liveTotalAssets: number;
  liveTotalDownloads: number;
  deltaAssets: number;
  deltaDownloads: number;
  aiPercent: number;
  notifyEnabled: boolean;
  updatedAt?: string;
}

export interface WatchlistResponse {
  success: boolean;
  count: number;
  items: WatchlistEntry[];
}

export interface TagClusterItem {
  tag: string;
  frequency: number;
  coveragePercent: number;
  weightedDownloads: number;
  intent: 'Buyer Intent' | 'Style & Mood' | 'Subject Core';
  relevanceScore: number;
}

export interface TagClusterResponse {
  success: boolean;
  cached: boolean;
  mode: string;
  query: string;
  sampledCount: number;
  totalUniqueTags: number;
  buyerIntentShare: number;
  recommendedTitle: string;
  recommendedCategory: string;
  recommendedTags: string[];
  clusters: TagClusterItem[];
  sourceAssets: {
    id: string;
    title: string;
    thumbnailUrl: string;
    mediaType: MediaType;
    category: string;
    downloads: number;
    monthlyVelocity: number | null;
    keywordsCount: number;
  }[];
}

export interface PromptReconstructResponse {
  success: boolean;
  cached: boolean;
  mode: string;
  provider: string;
  stylePreset: string;
  referenceAsset: StockAsset | null;
  inputImageUrl: string | null;
  visualBreakdown: {
    subject: string;
    composition: string;
    lighting: string;
    colorPalette: string;
    lensAndCamera: string;
    commercialAppeal: string;
  };
  prompts: {
    midjourneyV6: string;
    fluxPro: string;
    stableDiffusion: string;
    negativePrompt: string;
  };
  suggestedTitle: string;
  suggestedTags: string[];
}

export interface SeasonalEventItem {
  slug: string;
  name: string;
  category: string;
  region: string;
  eventDate: string;
  daysUntilEvent: number;
  uploadWindowStart: string;
  leadDays: number;
  urgency: string;
  isPrimeWindow: boolean;
  demandScore: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  primaryQuery: string;
  subNiches: string[];
  aiNote: string;
}

export interface CalendarResponse {
  success: boolean;
  cached: boolean;
  referenceDate: string;
  daysAhead: number;
  category: string;
  totalEvents: number;
  primeWindowCount: number;
  topEvent: string;
  events: SeasonalEventItem[];
}

export interface SavedContributor {
  id: string;
  name: string;
  country?: string;
}

export type BillingGateway = 'stripe' | 'creem' | 'cryptomus';
export type CurrencyCode = 'USD' | 'BDT' | 'PKR';

export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  planTier: PlanTier;
  dailySearchesLimit: number;
  maxDevices: number;
  createdAt?: string;
}

export interface DeviceSlot {
  id: number;
  tokenHash: string;
  deviceLabel: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface UsageSummary {
  searchesToday: number;
  searchCount: number;
  promptCount: number;
  dailyLimit: number;
}

export interface SubscriptionRecord {
  id: number;
  gateway: BillingGateway;
  externalSubId: string | null;
  status: string;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  deviceToken: string;
  csrToken?: string;
  verificationCode?: string;
  user: AuthUser;
  devices: DeviceSlot[];
}

export interface DashboardResponse {
  success: boolean;
  user: AuthUser;
  usage: UsageSummary;
  devices: DeviceSlot[];
  subscriptions: SubscriptionRecord[];
  platform: {
    adobeDataMode: string;
    adobeKeyConfigured: boolean;
    requireAuthForMetered: boolean;
    turnstileConfigured: boolean;
  };
}

export interface DeviceLimitChallenge {
  maxDevices: number;
  planTier: PlanTier;
  pendingToken: string;
  deviceToken: string;
  devices: DeviceSlot[];
}

export interface HealthResponse {
  success: boolean;
  service: string;
  phpVersion: string;
  environment: string;
  adobeDataMode: 'demo' | 'official' | string;
  adobeKeyConfigured: boolean;
  database: {
    status: 'connected' | 'disconnected';
    driver: string;
    message?: string;
  };
  timestamp: string;
}
