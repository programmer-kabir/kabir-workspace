import type {
  AuthResponse,
  AuthUser,
  BillingGateway,
  CalendarResponse,
  ContentTypeFilter,
  ContributorSearchResponse,
  ContributorStatsResponse,
  CountryInfo,
  CurrencyCode,
  DashboardResponse,
  DeviceSlot,
  GenAIFilter,
  HealthResponse,
  HeatmapMetric,
  HeatmapResponse,
  PlanTier,
  PromptReconstructResponse,
  SavedContributor,
  SearchResponse,
  SimilarResponse,
  SortOption,
  StockAsset,
  SubscriptionRecord,
  TagClusterResponse,
  UsageSummary,
  WatchlistEntry,
  WatchlistResponse,
} from '../types/stock';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const AUTH_TOKEN_KEY = 'sat_auth_token_v1';
const DEVICE_TOKEN_KEY = 'sat_device_token_v1';
const CSR_TOKEN_KEY = 'sat_csr_token_v1';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getOrCreateDeviceToken(): string {
  try {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_TOKEN_KEY, generated);
    return generated;
  } catch {
    return 'local-browser-device';
  }
}

export function setStoredDeviceToken(token: string): void {
  try {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredCsrToken(): string | null {
  try {
    return localStorage.getItem(CSR_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredCsrToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(CSR_TOKEN_KEY, token);
    else localStorage.removeItem(CSR_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface SearchQueryParams {
  q: string;
  order?: SortOption;
  contentType?: ContentTypeFilter;
  generativeAi?: GenAIFilter;
  page?: number;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Device-Token': getOrCreateDeviceToken(),
  };

  const authToken = getStoredAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const csrToken = getStoredCsrToken();
  if (csrToken) {
    headers['X-CSR-Token'] = csrToken;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: { code?: string; message?: string; details?: Record<string, unknown> } })
    | null;

  if (!response.ok || !payload) {
    const code = payload?.error?.code ?? `HTTP_${response.status}`;
    const msg = payload?.error?.message ?? `API ${response.status}: ${response.statusText}`;
    throw new ApiClientError(msg, response.status, code, payload?.error?.details);
  }

  return payload;
}

function buildCatalogQueryString(params: Partial<SearchQueryParams>): string {
  const qs = new URLSearchParams();
  if (params.q !== undefined && params.q !== '') {
    qs.set('q', params.q);
  }
  if (params.order && params.order !== 'relevance') {
    qs.set('order', params.order);
  }
  if (params.contentType && params.contentType !== 'all') {
    qs.set('content_type', params.contentType);
  }
  if (params.generativeAi && params.generativeAi !== 'all') {
    qs.set('generative_ai', params.generativeAi);
  }
  if (params.page && params.page > 1) {
    qs.set('page', String(params.page));
  }
  return qs.toString();
}

export function fetchHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/api/health');
}

export function searchAssets(params: SearchQueryParams): Promise<SearchResponse> {
  return requestJson<SearchResponse>(`/api/search?${buildCatalogQueryString(params)}`);
}

export function fetchTrending(params: Partial<SearchQueryParams> = {}): Promise<SearchResponse> {
  const query = buildCatalogQueryString({
    q: params.q && params.q.trim() !== '' ? params.q.trim() : 'all',
    order: params.order ?? 'velocity',
    contentType: params.contentType ?? 'all',
    generativeAi: params.generativeAi ?? 'all',
    page: params.page ?? 1,
  });
  return requestJson<SearchResponse>(`/api/trending?${query}`);
}

export function fetchSimilarById(imageId: string, page = 1): Promise<SimilarResponse> {
  const qs = new URLSearchParams({ imageId: imageId.trim() });
  if (page > 1) qs.set('page', String(page));
  return requestJson<SimilarResponse>(`/api/similar?${qs.toString()}`);
}

export function fetchSimilarByUploadHash(uploadHash: string, page = 1): Promise<SimilarResponse> {
  const qs = new URLSearchParams({ uploadHash: uploadHash.trim() });
  if (page > 1) qs.set('page', String(page));
  return requestJson<SimilarResponse>(`/api/similar?${qs.toString()}`);
}

export function uploadSimilarImage(file: File, page = 1): Promise<SimilarResponse> {
  const formData = new FormData();
  formData.append('image', file);
  const qs = page > 1 ? `?page=${page}` : '';
  return requestJson<SimilarResponse>(`/api/upload-search${qs}`, {
    method: 'POST',
    body: formData,
  });
}

export function fetchHeatmap(
  metric: HeatmapMetric = 'totalDownloads',
  type: ContentTypeFilter = 'all',
  refresh = false
): Promise<HeatmapResponse> {
  const qs = new URLSearchParams({ metric, type });
  if (refresh) {
    qs.set('refresh', '1');
  }
  return requestJson<HeatmapResponse>(`/api/heatmap?${qs.toString()}`);
}

export interface ContributorQueryParams {
  search: string;
  order?: SortOption;
  contentType?: ContentTypeFilter;
  generativeAi?: GenAIFilter;
  page?: number;
}

export function searchContributor(params: ContributorQueryParams): Promise<ContributorSearchResponse> {
  const qs = new URLSearchParams({ search: params.search.trim() });
  if (params.order && params.order !== 'relevance') qs.set('order', params.order);
  if (params.contentType && params.contentType !== 'all') qs.set('content_type', params.contentType);
  if (params.generativeAi && params.generativeAi !== 'all') qs.set('generative_ai', params.generativeAi);
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  return requestJson<ContributorSearchResponse>(`/api/contributor/search?${qs.toString()}`);
}

export function fetchContributorStats(creatorId: string): Promise<ContributorStatsResponse> {
  return requestJson<ContributorStatsResponse>(
    `/api/contributor/stats?creatorId=${encodeURIComponent(creatorId.trim())}`
  );
}

export function resolveContributorCountries(
  creatorIds: string[]
): Promise<{ success: boolean; count: number; countries: Record<string, CountryInfo> }> {
  return requestJson('/api/contributor/country', {
    method: 'POST',
    body: JSON.stringify({ creatorIds }),
  });
}

export function fetchWatchlist(): Promise<WatchlistResponse> {
  return requestJson<WatchlistResponse>('/api/contributor/watchlist');
}

export function addToWatchlist(payload: {
  creatorId: string;
  creatorName?: string;
  totalAssets?: number;
  totalDownloads?: number;
  notifyEnabled?: boolean;
}): Promise<{ success: boolean; message: string; item: WatchlistEntry }> {
  return requestJson('/api/contributor/watchlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removeFromWatchlist(creatorId: string): Promise<{ success: boolean; removed: boolean }> {
  return requestJson(`/api/contributor/watchlist?creatorId=${encodeURIComponent(creatorId)}`, {
    method: 'DELETE',
  });
}

export function fetchKeywordClusters(params: {
  query?: string;
  assetIds?: string[];
  topN?: number;
  contentType?: ContentTypeFilter;
  excludeNoise?: boolean;
}): Promise<TagClusterResponse> {
  return requestJson<TagClusterResponse>('/api/keywords/clusters', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function reconstructAiPrompt(params: {
  assetId?: string;
  imageUrl?: string;
  title?: string;
  stylePreset?: string;
  keywords?: string[];
}): Promise<PromptReconstructResponse> {
  return requestJson<PromptReconstructResponse>('/api/prompts/reconstruct', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function fetchSeasonalCalendar(daysAhead = 180, category = 'all'): Promise<CalendarResponse> {
  const qs = new URLSearchParams({
    daysAhead: String(daysAhead),
    category,
  });
  return requestJson<CalendarResponse>(`/api/calendar?${qs.toString()}`);
}

export function fetchBatchStats(imageIds: string[]): Promise<{ success: boolean; stats: Record<string, unknown> }> {
  return requestJson('/api/images/stats', {
    method: 'POST',
    body: JSON.stringify({ imageIds }),
  });
}

export function buildImageProxyUrl(imageUrl: string): string {
  return `${API_BASE_URL}/api/images/proxy?url=${encodeURIComponent(imageUrl)}`;
}

export function registerAccount(payload: {
  email: string;
  password: string;
  displayName?: string;
  deviceLabel?: string;
  turnstileToken?: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/api/auth/register', {
    method: 'POST',
    headers: payload.turnstileToken ? { 'X-Turnstile-Token': payload.turnstileToken } : undefined,
    body: JSON.stringify(payload),
  });
}

export function loginAccount(payload: {
  email: string;
  password: string;
  deviceLabel?: string;
  turnstileToken?: string;
}): Promise<AuthResponse> {
  return requestJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: payload.turnstileToken ? { 'X-Turnstile-Token': payload.turnstileToken } : undefined,
    body: JSON.stringify(payload),
  });
}

export function verifyAccountEmail(code: string): Promise<{ success: boolean; user: AuthUser }> {
  return requestJson('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function resendVerificationEmail(): Promise<{ success: boolean; verificationCode?: string }> {
  return requestJson('/api/auth/resend-verification', { method: 'POST' });
}

export function fetchCurrentUser(): Promise<{
  success: boolean;
  user: AuthUser;
  usage: UsageSummary;
  devices: DeviceSlot[];
}> {
  return requestJson('/api/auth/me');
}

export function issueCsrToken(): Promise<{ success: boolean; token: string; expiresIn: number }> {
  return requestJson('/api/auth/csr-token', { method: 'POST' });
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>('/api/user/dashboard');
}

export function updateProfileName(displayName: string): Promise<{ success: boolean; user: AuthUser }> {
  return requestJson('/api/user/profile', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

export function replaceDeviceSlot(params: {
  replaceDeviceId: number;
  deviceToken: string;
  deviceLabel: string;
  pendingToken: string;
}): Promise<{ success: boolean; devices: DeviceSlot[] }> {
  return requestJson('/api/user/device/replace', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.pendingToken}`,
      'X-Device-Token': params.deviceToken,
    },
    body: JSON.stringify({
      replaceDeviceId: params.replaceDeviceId,
      deviceToken: params.deviceToken,
      deviceLabel: params.deviceLabel,
    }),
  });
}

export function revokeDeviceSlot(deviceId: number): Promise<{ success: boolean; devices: DeviceSlot[] }> {
  return requestJson(`/api/user/devices?deviceId=${deviceId}`, {
    method: 'DELETE',
  });
}

export function fetchRemoteFavorites(): Promise<{
  success: boolean;
  images: StockAsset[];
  contributors: SavedContributor[];
}> {
  return requestJson('/api/favorites');
}

export function saveRemoteFavorite(
  itemType: 'image' | 'contributor',
  targetId: string,
  metadata: Record<string, unknown>
): Promise<{ success: boolean }> {
  return requestJson('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ itemType, targetId, metadata }),
  });
}

export function deleteRemoteFavorite(itemType: 'image' | 'contributor', targetId: string): Promise<{ success: boolean }> {
  return requestJson(`/api/favorites?itemType=${itemType}&targetId=${encodeURIComponent(targetId)}`, {
    method: 'DELETE',
  });
}

export function createBillingCheckout(payload: {
  planTier: Exclude<PlanTier, 'free'>;
  billingCycle?: 'monthly' | 'yearly';
  gateway: BillingGateway;
  currency: CurrencyCode;
}): Promise<{
  success: boolean;
  checkoutSessionId: string;
  gateway: BillingGateway;
  planTier: Exclude<PlanTier, 'free'>;
  billingCycle?: 'monthly' | 'yearly';
  currency: CurrencyCode;
  amountDisplay: string;
  localTestWebhookEnabled: boolean;
}> {
  return requestJson('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchBillingPortal(): Promise<{
  success: boolean;
  planTier: PlanTier;
  subscriptions: SubscriptionRecord[];
}> {
  return requestJson('/api/billing/portal');
}

export function cancelBillingRenewal(): Promise<{ success: boolean; cancelAtPeriodEnd: boolean }> {
  return requestJson('/api/billing/cancel', { method: 'POST' });
}

export function resubscribeBillingRenewal(): Promise<{ success: boolean; cancelAtPeriodEnd: boolean }> {
  return requestJson('/api/billing/resubscribe', { method: 'POST' });
}

export function simulateLocalWebhook(
  gateway: BillingGateway,
  payload: { checkoutSessionId: string; planTier: Exclude<PlanTier, 'free'>; userId: number }
): Promise<{ success: boolean; user: AuthUser }> {
  return requestJson(`/api/billing/webhook/${gateway}`, {
    method: 'POST',
    body: JSON.stringify({ event: 'subscription.activated', ...payload }),
  });
}
