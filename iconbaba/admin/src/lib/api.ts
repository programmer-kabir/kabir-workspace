const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/iconbaba/backend/api';

export function getToken(): string | null {
  return localStorage.getItem('iconbaba_token');
}

export function setToken(token: string) {
  localStorage.setItem('iconbaba_token', token);
}

export function clearToken() {
  localStorage.removeItem('iconbaba_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();
    return json;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}

// ==========================================
// Auth
// ==========================================

export async function loginUser(login: string, password: string) {
  return request<{ token: string; user: import('@/types/icon').User }>('/auth/login.php', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
}

export async function logoutUser() {
  const res = await request<null>('/auth/logout.php', { method: 'POST' });
  clearToken();
  return res;
}

export async function getMe() {
  return request<{ user: import('@/types/icon').User }>('/auth/me.php');
}

export async function updateProfile(fullName?: string, password?: string) {
  return request<{ user: import('@/types/icon').User }>('/auth/update.php', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, password }),
  });
}

// ==========================================
// Admin Dashboard

export async function getAdminDashboardStats() {
  return request<import('@/types/admin').DashboardStats>('/admin/dashboard/stats.php');
}

export async function getAdminIcons(params: {
  page?: number;
  limit?: number;
  q?: string;
  category_id?: number;
  status?: string;
  tier?: string;
  sort?: string;
}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.category_id) qp.set('category_id', params.category_id.toString());
  if (params.status && params.status !== 'all') qp.set('status', params.status);
  if (params.tier && params.tier !== 'all') qp.set('tier', params.tier);
  if (params.sort) qp.set('sort', params.sort);

  return request<{
    items: import('@/types/admin').AdminIconItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }>(`/admin/icons/list.php?${qp.toString()}`);
}

export async function getAdminIcon(idOrSlug: number | string) {
  const param = typeof idOrSlug === 'number' ? `id=${idOrSlug}` : `slug=${encodeURIComponent(idOrSlug)}`;
  return request<import('@/types/admin').AdminIconItem>(`/admin/icons/single.php?${param}`);
}

export async function uploadAdminIcon(data: {
  name: string;
  category_id: number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
  svg_outlined?: string;
  svg_filled?: string;
}) {
  return request<import('@/types/admin').AdminIconItem>('/admin/icons/upload.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface BatchIconUploadItem {
  name: string;
  category_id?: number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
  is_premium?: boolean | number;
  svg_outlined?: string;
  svg_filled?: string;
}

export interface BatchUploadResponse {
  total_received: number;
  uploaded_count: number;
  failed_count: number;
  items: Array<{
    id: number;
    name: string;
    slug: string;
    category_id: number;
    category_name: string;
    status: string;
    is_premium: boolean;
    tags: string;
  }>;
  errors: Array<{
    index: number;
    name: string;
    error: string;
  }>;
}

export async function batchUploadAdminIcons(data: {
  category_id?: number;
  status?: 'draft' | 'published' | 'archived';
  is_premium?: number | boolean;
  icons: BatchIconUploadItem[];
}) {
  return request<BatchUploadResponse>('/admin/icons/batch_upload.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export async function updateAdminIcon(data: {
  id: number;
  name?: string;
  slug?: string;
  category_id?: number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
  is_premium?: boolean;
  svg_outlined?: string;
  svg_filled?: string;
}) {
  return request<import('@/types/admin').AdminIconItem>('/admin/icons/update.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminIcon(id: number) {
  return request<{ id: number }>('/admin/icons/delete.php', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function bulkAdminIcons(
  action: 'publish' | 'unpublish' | 'archive' | 'delete' | 'assign_category',
  ids: number[],
  categoryId?: number
) {
  return request<{ action: string; affected_count: number }>('/admin/icons/bulk.php', {
    method: 'POST',
    body: JSON.stringify({ action, ids, category_id: categoryId }),
  });
}

export async function generateAdminAiTags(data: {
  icons: Array<{ id: string | number; name: string; category?: string }>;
  limit?: number;
  api_key?: string;
  model?: string;
}) {
  return request<{
    tags: Record<string, string>;
    categories?: Record<string, string>;
    category_ids?: Record<string, number>;
    created_categories?: Array<{ id: number; name: string; slug: string }>;
    total_generated: number;
  }>('/admin/icons/ai_generate_tags.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface AiIconInspectionResult {
  id: string;
  is_mismatch: boolean;
  detected_visual: string;
  suggested_name: string;
  suggested_category: string;
  reason: string;
  tags: string;
}

export async function inspectAdminAiIcons(data: {
  icons: Array<{ id: string | number; name: string; category?: string; svg?: string }>;
  limit?: number;
  api_key?: string;
  model?: string;
}) {
  return request<{
    inspections: Record<string, AiIconInspectionResult>;
    total_inspected: number;
    mismatch_count: number;
  }>('/admin/icons/ai_inspect_icons.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================
// Category Management
// ==========================================

export async function getAdminCategories() {
  return request<import('@/types/admin').AdminCategoryItem[]>('/admin/categories/list.php');
}

export async function createAdminCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}) {
  return request<import('@/types/admin').AdminCategoryItem>('/admin/categories/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminCategory(data: {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  display_order?: number;
  status?: 'active' | 'inactive';
}) {
  return request<import('@/types/admin').AdminCategoryItem>('/admin/categories/update.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminCategory(id: number, reassignTo?: number) {
  return request<{ id: number }>('/admin/categories/delete.php', {
    method: 'POST',
    body: JSON.stringify({ id, reassign_to: reassignTo }),
  });
}

export async function reorderAdminCategories(orders: Array<{ id: number; display_order: number }>) {
  return request<null>('/admin/categories/reorder.php', {
    method: 'POST',
    body: JSON.stringify({ orders }),
  });
}

// ==========================================
// User Management
// ==========================================

export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  status?: string;
}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.role) qp.set('role', params.role);
  if (params.status) qp.set('status', params.status);

  return request<{
    items: import('@/types/admin').AdminUserItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }>(`/admin/users/list.php?${qp.toString()}`);
}

export async function updateAdminUserStatus(
  id: number,
  status?: 'active' | 'suspended',
  role?: 'user' | 'admin',
  roles?: string[]
) {
  return request<{ id: number; status: string; role: string; roles: string[] }>('/admin/users/update_status.php', {
    method: 'POST',
    body: JSON.stringify({ id, status, role, roles }),
  });
}

export async function getAdminRoles() {
  return request<{ items: import('@/types/admin').SystemRoleItem[] }>('/admin/roles/list.php');
}

export async function createAdminRole(name: string, slug?: string, description?: string) {
  return request<import('@/types/admin').SystemRoleItem>('/admin/roles/create.php', {
    method: 'POST',
    body: JSON.stringify({ name, slug, description }),
  });
}

// ==========================================
// Favorites, Collections, Downloads
// ==========================================

export async function getAdminFavorites(page = 1, limit = 20) {
  return request<{
    top_icons: any[];
    recent: any[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/favorites/list.php?page=${page}&limit=${limit}`);
}

export async function getAdminCollections(page = 1, limit = 20) {
  return request<{
    items: any[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/collections/list.php?page=${page}&limit=${limit}`);
}

export async function getAdminDownloads(page = 1, limit = 20) {
  return request<{
    stats: { total: number; svg: number; png: number; today: number };
    top_icons: any[];
    items: any[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/downloads/list.php?page=${page}&limit=${limit}`);
}

// ==========================================
// CMS Pages, Pricing, FAQ, Contact
// ==========================================

export async function getContentPagesList() {
  return request<{ pages: import('@/types/cms').ContentPage[]; is_admin: boolean }>('/content-pages/list.php');
}

export async function updateContentPage(data: {
  id?: number;
  slug?: string;
  title?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  status?: 'draft' | 'published';
}) {
  return request<import('@/types/cms').ContentPage>('/content-pages/update.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPageRevisions(pageId: number) {
  return request<{ page_id: number; revisions: import('@/types/cms').ContentPageRevision[] }>(
    `/content-pages/revisions.php?page_id=${pageId}`
  );
}

export async function getPricingPlans() {
  return request<{ plans: import('@/types/cms').PricingPlan[] }>('/pricing/list.php');
}

export async function saveAdminPricingPlan(data: any) {
  return request<{ id: number }>('/admin/pricing/save.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminPricingPlan(id: number) {
  return request<{ id: number }>('/admin/pricing/delete.php', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function getFaqItems(category?: string) {
  const param = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<{
    items: import('@/types/cms').FAQItem[];
    grouped: Record<string, import('@/types/cms').FAQItem[]>;
    categories: string[];
  }>(`/faq/list.php${param}`);
}

export async function saveAdminFaqItem(data: any) {
  return request<{ id: number }>('/admin/faq/save.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminFaqItem(id: number) {
  return request<{ id: number }>('/admin/faq/delete.php', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function getAdminContactMessages(params: { page?: number; limit?: number; q?: string; status?: string }) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.status) qp.set('status', params.status);

  return request<{
    counts: { total: number; unread: number; read: number; replied: number };
    items: import('@/types/admin').AdminContactMessage[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/contact-messages/list.php?${qp.toString()}`);
}

export async function updateAdminContactMessageStatus(id: number, status: 'unread' | 'read' | 'replied') {
  return request<{ id: number; status: string }>('/admin/contact-messages/update_status.php', {
    method: 'POST',
    body: JSON.stringify({ id, status }),
  });
}

export async function getAdminAuditLogs(params: { page?: number; limit?: number; q?: string; action?: string; entity_type?: string }) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.action) qp.set('action', params.action);
  if (params.entity_type) qp.set('entity_type', params.entity_type);

  return request<{
    items: import('@/types/admin').AdminAuditLog[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/audit-logs/list.php?${qp.toString()}`);
}

// ==========================================
// Billing & Subscriptions
// ==========================================

export async function getBillingStats() {
  return request<import('@/types/admin').BillingStats>('/admin/billing/stats.php');
}

export async function getAdminSubscriptions(params: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  plan_type?: string;
}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.status) qp.set('status', params.status);
  if (params.plan_type) qp.set('plan_type', params.plan_type);

  return request<{
    items: import('@/types/admin').AdminSubscriptionItem[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/subscriptions/list.php?${qp.toString()}`);
}

export async function getAdminPayments(params: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.status) qp.set('status', params.status);

  return request<{
    items: import('@/types/admin').AdminPaymentItem[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/payments/list.php?${qp.toString()}`);
}

// Notifications
export async function getAdminNotifications() {
  return request<{
    notifications: import('@/types/admin').AdminNotification[];
    unread_count: number;
    user_roles: string[];
  }>('/notifications/list.php');
}

export async function markAdminNotificationRead(id?: number | 'all') {
  return request('/notifications/mark_read.php', {
    method: 'POST',
    body: JSON.stringify(id === 'all' || !id ? { all: true } : { id }),
  });
}

export async function deleteAdminNotification(id: number) {
  return request('/notifications/delete.php', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function clearAllReadAdminNotifications() {
  return request('/notifications/delete.php', {
    method: 'POST',
    body: JSON.stringify({ clear_all_read: true }),
  });
}

// ==========================================
// System & AI Settings Management
// ==========================================

export interface AdminSystemSettingsResponse {
  gemini: {
    api_key: string;
    has_key: boolean;
    is_from_db: boolean;
    updated_at?: string;
  };
}

export async function getAdminSettings() {
  return request<AdminSystemSettingsResponse>('/admin/settings/get.php');
}

export async function updateAdminSettings(settings: { gemini_api_key?: string } | Record<string, any>) {
  return request<{ saved: boolean }>('/admin/settings/update.php', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

export async function testGeminiApiKey(apiKey?: string) {
  return request<{
    status: string;
    latency_ms: number;
    sample_tags: string;
  }>('/admin/settings/test_gemini.php', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey }),
  });
}


