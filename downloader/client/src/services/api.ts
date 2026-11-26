import {
  VideoMetadata,
  PlatformInfo,
  User,
  DashboardStats,
  QueueJob,
  HistoryItem,
  FavoriteItem,
  NotificationItem,
  ActivityItem,
  ApiKey,
  ApiLog,
  Webhook,
  WebhookDelivery,
  DeveloperStats,
  SubscriptionPlan,
  PaymentMethod,
  PaymentTransaction,
  UserSubscriptionDetails,
  AdminPaymentStats
} from '../types';

export function resolveApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string') return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

export const API_BASE = resolveApiBase();

export function getAuthToken(): string | null {
  return localStorage.getItem('sv_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('sv_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('sv_token');
}

export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// ------------------- Media Extractor -------------------
export async function extractVideo(url: string): Promise<VideoMetadata> {
  const data = await authFetch('/extract', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
  return data.data;
}

export function getDownloadUrl(options: {
  url: string;
  formatId?: string;
  type?: 'video' | 'audio';
  title?: string;
}): string {
  const params = new URLSearchParams();
  params.append('url', options.url);
  if (options.formatId) params.append('formatId', options.formatId);
  if (options.type) params.append('type', options.type);
  if (options.title) params.append('title', options.title);

  return `${API_BASE}/download?${params.toString()}`;
}

export function detectLocalPlatform(url: string): PlatformInfo {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { name: 'YouTube', id: 'youtube', color: '#EF4444', badge: 'YouTube' };
  }
  if (lower.includes('tiktok.com')) {
    return { name: 'TikTok', id: 'tiktok', color: '#06B6D4', badge: 'TikTok (No Watermark)' };
  }
  if (lower.includes('instagram.com')) {
    return { name: 'Instagram', id: 'instagram', color: '#EC4899', badge: 'Instagram Reel' };
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return { name: 'Facebook', id: 'facebook', color: '#3B82F6', badge: 'Facebook Watch' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { name: 'Twitter / X', id: 'twitter', color: '#38BDF8', badge: 'Twitter / X' };
  }
  if (lower.includes('reddit.com') || lower.includes('v.redd.it')) {
    return { name: 'Reddit', id: 'reddit', color: '#F97316', badge: 'Reddit' };
  }
  if (lower.includes('vimeo.com')) {
    return { name: 'Vimeo', id: 'vimeo', color: '#0EA5E9', badge: 'Vimeo' };
  }
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) {
    return { name: 'Pinterest', id: 'pinterest', color: '#E11D48', badge: 'Pinterest' };
  }

  return { name: 'Universal', id: 'generic', color: '#8B5CF6', badge: 'All Platforms' };
}

// ------------------- User & Dashboard APIs -------------------
export async function fetchUserStats(): Promise<DashboardStats> {
  const res = await authFetch('/user/stats');
  return res.data;
}

export async function fetchUserActivity(page = 1, search = ''): Promise<{ activities: ActivityItem[]; total: number; totalPages: number }> {
  const res = await authFetch(`/user/activity?page=${page}&search=${encodeURIComponent(search)}`);
  return res.data;
}

export async function fetchUserProfile(): Promise<User> {
  const res = await authFetch('/user/profile');
  return res.data;
}

export async function updateUserProfile(name: string): Promise<void> {
  await authFetch('/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
}

// ------------------- Queue APIs -------------------
export async function fetchQueueList(status = 'all', limit = 50): Promise<{ jobs: QueueJob[]; total: number }> {
  const res = await authFetch(`/queue/list?status=${status}&limit=${limit}`);
  return res.data;
}

export async function addJobToQueueApi(url: string, type: 'video' | 'audio' = 'video'): Promise<any> {
  return authFetch('/queue/add', {
    method: 'POST',
    body: JSON.stringify({ url, type })
  });
}

export async function pauseJobApi(jobId: string): Promise<any> {
  return authFetch(`/queue/${jobId}/pause`, { method: 'POST' });
}

export async function resumeJobApi(jobId: string): Promise<any> {
  return authFetch(`/queue/${jobId}/resume`, { method: 'POST' });
}

export async function cancelJobApi(jobId: string): Promise<any> {
  return authFetch(`/queue/${jobId}/cancel`, { method: 'POST' });
}

export async function retryJobApi(jobId: string): Promise<any> {
  return authFetch(`/queue/${jobId}/retry`, { method: 'POST' });
}

export async function bulkAddQueueApi(urls: string[], type: 'video' | 'audio' = 'video'): Promise<any> {
  return authFetch('/queue/bulk', {
    method: 'POST',
    body: JSON.stringify({ urls, type })
  });
}

export async function bulkCancelQueueApi(jobIds: string[]): Promise<any> {
  return authFetch('/queue/bulk-cancel', {
    method: 'POST',
    body: JSON.stringify({ jobIds })
  });
}

export async function bulkRetryQueueApi(jobIds: string[]): Promise<any> {
  return authFetch('/queue/bulk-retry', {
    method: 'POST',
    body: JSON.stringify({ jobIds })
  });
}

// ------------------- Download History APIs -------------------
export async function fetchHistory(params: {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}): Promise<{ history: HistoryItem[]; platforms: string[]; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.platform) query.append('platform', params.platform);
  if (params.type) query.append('type', params.type);
  if (params.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params.dateTo) query.append('dateTo', params.dateTo);
  if (params.sort) query.append('sort', params.sort);

  const res = await authFetch(`/history?${query.toString()}`);
  return res.data;
}

export async function deleteHistoryItem(id: number): Promise<void> {
  await authFetch(`/history/${id}`, { method: 'DELETE' });
}

export async function bulkDeleteHistoryItems(ids: number[]): Promise<number> {
  const res = await authFetch('/history/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
  return res.deletedCount;
}

export async function retryHistoryItem(id: number): Promise<any> {
  return authFetch(`/history/${id}/retry`, { method: 'POST' });
}

// ------------------- Favorites APIs -------------------
export async function fetchFavorites(params: {
  page?: number;
  search?: string;
  platform?: string;
  collection?: string;
} = {}): Promise<{ favorites: FavoriteItem[]; collections: string[]; platforms: string[]; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.search) query.append('search', params.search);
  if (params.platform) query.append('platform', params.platform);
  if (params.collection) query.append('collection', params.collection);

  const res = await authFetch(`/favorites?${query.toString()}`);
  return res.data;
}

export async function addFavoriteItem(item: {
  url: string;
  title: string;
  platform?: string;
  thumbnail?: string;
  duration?: string;
  collection?: string;
}): Promise<FavoriteItem> {
  const res = await authFetch('/favorites', {
    method: 'POST',
    body: JSON.stringify(item)
  });
  return res.data;
}

export async function deleteFavoriteItem(id: number): Promise<void> {
  await authFetch(`/favorites/${id}`, { method: 'DELETE' });
}

// ------------------- Notifications APIs -------------------
export async function fetchNotifications(unreadOnly = false, page = 1): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  totalPages: number;
}> {
  const res = await authFetch(`/notifications?unreadOnly=${unreadOnly}&page=${page}`);
  return res.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await authFetch(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await authFetch('/notifications/read-all', { method: 'PUT' });
}

export async function deleteNotificationItem(id: number): Promise<void> {
  await authFetch(`/notifications/${id}`, { method: 'DELETE' });
}

export async function clearAllNotifications(): Promise<void> {
  await authFetch('/notifications/clear-all', { method: 'DELETE' });
}

// ------------------- Developer API Platform -------------------
export async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await authFetch('/developer/keys');
  return res.data;
}

export async function createApiKeyApi(name: string, expiresAt?: string): Promise<{ rawKey: string; key: ApiKey }> {
  const res = await authFetch('/developer/keys', {
    method: 'POST',
    body: JSON.stringify({ name, expiresAt })
  });
  return res.data;
}

export async function toggleApiKeyApi(id: string, isEnabled: boolean): Promise<void> {
  await authFetch(`/developer/keys/${id}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ isEnabled })
  });
}

export async function regenerateApiKeyApi(id: string): Promise<{ rawKey: string; keyPrefix: string }> {
  const res = await authFetch(`/developer/keys/${id}/regenerate`, { method: 'POST' });
  return res.data;
}

export async function deleteApiKeyApi(id: string): Promise<void> {
  await authFetch(`/developer/keys/${id}`, { method: 'DELETE' });
}

export async function fetchDeveloperStats(): Promise<DeveloperStats> {
  const res = await authFetch('/developer/stats');
  return res.data;
}

export async function fetchApiLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  endpoint?: string;
} = {}): Promise<{ logs: ApiLog[]; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.endpoint) query.append('endpoint', params.endpoint);

  const res = await authFetch(`/developer/logs?${query.toString()}`);
  return res.data;
}

export async function fetchWebhooks(): Promise<Webhook[]> {
  const res = await authFetch('/developer/webhooks');
  return res.data;
}

export async function createWebhookApi(name: string, url: string, events: string[]): Promise<Webhook> {
  const res = await authFetch('/developer/webhooks', {
    method: 'POST',
    body: JSON.stringify({ name, url, events })
  });
  return res.data;
}

export async function updateWebhookApi(id: string, data: { name?: string; url?: string; events?: string[]; isActive?: boolean }): Promise<void> {
  await authFetch(`/developer/webhooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteWebhookApi(id: string): Promise<void> {
  await authFetch(`/developer/webhooks/${id}`, { method: 'DELETE' });
}

export async function testWebhookApi(id: string): Promise<any> {
  const res = await authFetch(`/developer/webhooks/${id}/test`, { method: 'POST' });
  return res.data;
}

export async function fetchWebhookDeliveries(webhookId: string, page = 1): Promise<{ deliveries: WebhookDelivery[]; total: number; totalPages: number }> {
  const res = await authFetch(`/developer/webhooks/${webhookId}/deliveries?page=${page}`);
  return res.data;
}

export async function retryWebhookDeliveryApi(deliveryId: string): Promise<any> {
  const res = await authFetch(`/developer/webhooks/deliveries/${deliveryId}/retry`, { method: 'POST' });
  return res.data;
}

// ==================== Phase 4: Subscription & Billing APIs ====================

export async function fetchPublicPlans(): Promise<{ plans: SubscriptionPlan[]; userPlan: string }> {
  const res = await authFetch('/subscriptions/plans');
  return { plans: res.data || [], userPlan: res.userPlan || 'free' };
}

export async function fetchActivePaymentMethods(): Promise<PaymentMethod[]> {
  const res = await authFetch('/subscriptions/payment-methods');
  return res.data || [];
}

export async function fetchMySubscription(): Promise<UserSubscriptionDetails> {
  const res = await authFetch('/subscriptions/my-subscription');
  return res.data;
}

export async function fetchMyTransactions(): Promise<PaymentTransaction[]> {
  const res = await authFetch('/subscriptions/my-transactions');
  return res.data || [];
}

export async function submitCheckout(data: {
  planSlug: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethodId: string;
  senderNumber: string;
  transactionId: string;
  amount: number;
  screenshotUrl?: string | null;
}): Promise<any> {
  const res = await authFetch('/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
}

// ==================== Phase 4: Admin Payment Verification APIs ====================

export async function fetchAdminPaymentStats(): Promise<AdminPaymentStats> {
  const res = await authFetch('/admin/payments/stats');
  return res.data;
}

export async function fetchAdminTransactions(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ transactions: PaymentTransaction[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await authFetch(`/admin/payments/transactions?${query.toString()}`);
  return res.data;
}

export async function approveAdminTransaction(id: string, adminNote?: string): Promise<any> {
  const res = await authFetch(`/admin/payments/transactions/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ adminNote })
  });
  return res;
}

export async function rejectAdminTransaction(id: string, rejectionReason: string): Promise<any> {
  const res = await authFetch(`/admin/payments/transactions/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason })
  });
  return res;
}

export async function fetchAdminPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await authFetch('/admin/payments/methods');
  return res.data || [];
}

export async function createAdminPaymentMethod(data: {
  name: string;
  identifier: string;
  accountNumber: string;
  accountType: string;
  instructions: string;
  isEnabled?: boolean;
}): Promise<any> {
  const res = await authFetch('/admin/payments/methods', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res;
}

export async function updateAdminPaymentMethod(id: string, data: {
  name?: string;
  accountNumber?: string;
  accountType?: string;
  instructions?: string;
  isEnabled?: boolean;
}): Promise<any> {
  const res = await authFetch(`/admin/payments/methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res;
}

export async function deleteAdminPaymentMethod(id: string): Promise<any> {
  const res = await authFetch(`/admin/payments/methods/${id}`, {
    method: 'DELETE'
  });
  return res;
}
