// frontend/lib/api.ts
import { deobfuscateVector } from '@/lib/svg-utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/iconbaba/backend/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('iconbaba_token');
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('iconbaba_token', token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('iconbaba_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Iconbaba-Client': 'web-app-v1',
    'X-Requested-With': 'XMLHttpRequest',
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

// Categories
export async function getCategories(style?: 'outlined' | 'filled') {
  const query = style ? `?style=${style}` : '';
  return request<{ total_icons: number; categories: import('@/types/icon').CategoryItem[] }>(`/categories/list.php${query}`);
}

// Icons
export async function getIcons(params: {
  category?: string;
  style?: 'outlined' | 'filled';
  tier?: 'all' | 'free' | 'pro';
  search?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.style) searchParams.set('style', params.style);
  if (params.tier && params.tier !== 'all') searchParams.set('tier', params.tier);
  if (params.search) searchParams.set('search', params.search);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const res = await request<{
    icons: Array<import('@/types/icon').IconItem & { v_data?: string }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  }>(`/icons/list.php?${searchParams.toString()}`);

  if (res.success && res.data?.icons) {
    res.data.icons = res.data.icons.map((item) => ({
      ...item,
      // Layer 2 Security: Seamless client-side deobfuscation into memory
      svg: deobfuscateVector(item.v_data || item.svg),
    }));
  }

  return res as {
    success: boolean;
    data?: {
      icons: import('@/types/icon').IconItem[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
    };
    message?: string;
  };
}

export async function getIcon(idOrName: string | number) {
  const param = typeof idOrName === 'number' ? `id=${idOrName}` : `name=${encodeURIComponent(idOrName)}`;
  const res = await request<import('@/types/icon').IconItem & { variants?: Record<string, string>; v_variants?: Record<string, string> }>(`/icons/single.php?${param}`);
  
  if (res.success && res.data) {
    const rawVariants = res.data.v_variants || res.data.variants || {};
    const decodedVariants: Record<string, string> = {};
    for (const [sKey, sVal] of Object.entries(rawVariants)) {
      decodedVariants[sKey] = deobfuscateVector(sVal as string);
    }
    res.data.variants = decodedVariants;
    if (!res.data.svg && decodedVariants['outlined']) {
      res.data.svg = decodedVariants['outlined'];
    }
  }

  return res as {
    success: boolean;
    data?: import('@/types/icon').IconItem & { variants: Record<string, string> };
    message?: string;
  };
}

// Auth
export async function loginUser(login: string, password: string) {
  return request<{ token: string; user: import('@/types/icon').User }>('/auth/login.php', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
}

export async function registerUser(username: string, email: string, password: string, fullName?: string) {
  return request<{ token: string; user: import('@/types/icon').User }>('/auth/register.php', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, full_name: fullName }),
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

// OTP for Registration: Step 1 — send OTP to email
export async function sendRegistrationOtp(email: string) {
  return request<{ sent: boolean; email: string; expires_in: number }>('/auth/send_otp.php', {
    method: 'POST',
    body: JSON.stringify({ email, purpose: 'registration' }),
  });
}

// OTP for Registration: Step 2 — verify OTP + complete account creation
export async function verifyOtpAndRegister(params: {
  email: string;
  otp: string;
  username: string;
  password: string;
  full_name?: string;
}) {
  return request<{ token: string; user: import('@/types/icon').User }>('/auth/verify_otp.php', {
    method: 'POST',
    body: JSON.stringify({ ...params, purpose: 'registration' }),
  });
}

// Forgot Password: Step 1 — send OTP to registered email
export async function sendForgotPasswordOtp(email: string) {
  return request<{ sent: boolean; expires_in: number }>('/auth/send_otp.php', {
    method: 'POST',
    body: JSON.stringify({ email, purpose: 'forgot_password' }),
  });
}

// Forgot Password: Step 2 — verify OTP, get reset_token
export async function verifyForgotPasswordOtp(email: string, otp: string) {
  return request<{ reset_token: string; expires_in: number }>('/auth/verify_otp.php', {
    method: 'POST',
    body: JSON.stringify({ email, otp, purpose: 'forgot_password' }),
  });
}

// Forgot Password: Step 3 — set new password with reset_token
export async function resetPassword(resetToken: string, password: string) {
  return request<{ token: string; user: import('@/types/icon').User }>('/auth/reset_password.php', {
    method: 'POST',
    body: JSON.stringify({ reset_token: resetToken, password }),
  });
}


// Favorites
export async function getFavorites(style: 'outlined' | 'filled' = 'outlined') {
  return request<{ favorites: import('@/types/icon').IconItem[] }>(`/favorites/list.php?style=${style}`);
}

export async function addFavorite(iconId: number) {
  return request<{ is_favorited: boolean }>('/favorites/add.php', {
    method: 'POST',
    body: JSON.stringify({ icon_id: iconId }),
  });
}

export async function removeFavorite(iconId: number) {
  return request<{ is_favorited: boolean }>('/favorites/remove.php', {
    method: 'POST',
    body: JSON.stringify({ icon_id: iconId }),
  });
}

export async function checkFavorite(iconId: number) {
  return request<{ is_favorited: boolean }>(`/favorites/check.php?icon_id=${iconId}`);
}

// Collections
export async function getCollections() {
  return request<{ collections: import('@/types/icon').Collection[] }>('/collections/list.php');
}

export async function createCollection(name: string, description?: string, isPublic = false) {
  return request<{ collection: import('@/types/icon').Collection }>('/collections/create.php', {
    method: 'POST',
    body: JSON.stringify({ name, description, is_public: isPublic ? 1 : 0 }),
  });
}

export async function getCollection(id: number, style: 'outlined' | 'filled' = 'outlined') {
  return request<{ collection: import('@/types/icon').Collection }>(`/collections/single.php?id=${id}&style=${style}`);
}

export async function addIconToCollection(collectionId: number, iconId: number) {
  return request<null>('/collections/add_item.php', {
    method: 'POST',
    body: JSON.stringify({ collection_id: collectionId, icon_id: iconId }),
  });
}

export async function removeIconFromCollection(collectionId: number, iconId: number) {
  return request<null>('/collections/remove_item.php', {
    method: 'POST',
    body: JSON.stringify({ collection_id: collectionId, icon_id: iconId }),
  });
}

export async function deleteCollection(collectionId: number) {
  return request<null>('/collections/delete.php', {
    method: 'POST',
    body: JSON.stringify({ collection_id: collectionId }),
  });
}

// Downloads & Export Quota
export async function getQuotaStatus() {
  return request<import('@/types/icon').QuotaStatus>('/icons/quota.php');
}

export async function trackExport(params: {
  iconId: number;
  action: 'download' | 'copy';
  format?: 'svg' | 'png' | 'jsx';
  size?: number;
}) {
  return request<{
    allowed: boolean;
    quota: import('@/types/icon').QuotaStatus;
    require_login?: boolean;
    require_pro?: boolean;
  }>('/icons/track_export.php', {
    method: 'POST',
    body: JSON.stringify({
      icon_id: params.iconId,
      action: params.action,
      format: params.format || 'svg',
      size: params.size || 24,
    }),
  });
}

export async function logDownload(iconId: number, format: 'svg' | 'png', size: number) {
  return trackExport({ iconId, action: 'download', format, size });
}

export async function getDownloadHistory(style: 'outlined' | 'filled' = 'outlined') {
  return request<{ downloads: import('@/types/icon').DownloadHistoryItem[] }>(`/downloads/history.php?style=${style}`);
}

// ==========================================
// CMS / Content Pages
// ==========================================

export async function getContentPage(slug: string) {
  return request<import('@/types/cms').ContentPage>(`/content-pages/single.php?slug=${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
}

export async function getContentPagesList() {
  return request<{ pages: import('@/types/cms').ContentPage[]; is_admin: boolean }>('/content-pages/list.php', {
    cache: 'no-store',
  });
}

export async function createContentPage(data: {
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  status?: 'draft' | 'published';
}) {
  return request<import('@/types/cms').ContentPage>('/content-pages/create.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContentPage(data: {
  id?: number;
  slug?: string;
  new_slug?: string;
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

export async function deleteContentPage(idOrSlug: number | string) {
  const body = typeof idOrSlug === 'number' ? { id: idOrSlug } : { slug: idOrSlug };
  return request<{ id: number; slug: string }>('/content-pages/delete.php', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getPageRevisions(pageId: number) {
  return request<{ page_id: number; revisions: import('@/types/cms').ContentPageRevision[] }>(
    `/content-pages/revisions.php?page_id=${pageId}`,
    { cache: 'no-store' }
  );
}

// ==========================================
// Pricing Plans
// ==========================================

export async function getPricingPlans() {
  return request<{ plans: import('@/types/cms').PricingPlan[] }>('/pricing/list.php', {
    cache: 'no-store',
  });
}

export async function syncSubscription() {
  return request<{ synced_subscriptions: number; synced_orders: number; is_pro: boolean }>('/subscriptions/sync.php', {
    method: 'POST',
  });
}

export async function getUserBilling() {
  return request<import('@/types/icon').UserBillingData>('/subscriptions/my.php', {
    cache: 'no-store',
  });
}

export async function getTeamMembers() {
  return request<import('@/types/icon').TeamData>('/team/list.php', {
    cache: 'no-store',
  });
}

export async function addTeamMember(identifier: string) {
  return request<{
    success: boolean;
    message: string;
    member?: import('@/types/icon').TeamMember;
    total_seats?: number;
    used_seats?: number;
    remaining_seats?: number;
    data?: any;
  }>('/team/add.php', {
    method: 'POST',
    body: JSON.stringify({ identifier, email: identifier }),
  });
}

export async function removeTeamMember(id: number) {
  return request<{
    success: boolean;
    message: string;
    total_seats?: number;
    used_seats?: number;
    remaining_seats?: number;
  }>('/team/remove.php', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function respondTeamInvite(inviteId: number, action: 'accept' | 'approve' | 'decline' | 'reject') {
  return request<{
    success: boolean;
    message: string;
    status?: string;
    is_pro?: boolean;
  }>('/team/respond_invite.php', {
    method: 'POST',
    body: JSON.stringify({ invite_id: inviteId, action }),
  });
}

// ==========================================
// FAQ Items
// ==========================================

export async function getFaqItems(category?: string) {
  const param = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<{
    items: import('@/types/cms').FAQItem[];
    grouped: Record<string, import('@/types/cms').FAQItem[]>;
    categories: string[];
  }>(`/faq/list.php${param}`, {
    cache: 'no-store',
  });
}

// ==========================================
// Contact Form Submission
// ==========================================

export async function submitContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return request<{ id: number }>('/contact/submit.php', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================
// Admin Panel APIs
// ==========================================

export async function getAdminDashboardStats() {
  return request<import('@/types/admin').DashboardStats>('/admin/dashboard/stats.php', {
    cache: 'no-store',
  });
}

export async function getAdminIcons(params: {
  page?: number;
  limit?: number;
  q?: string;
  category_id?: number;
  status?: string;
  sort?: string;
}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', params.page.toString());
  if (params.limit) qp.set('limit', params.limit.toString());
  if (params.q) qp.set('q', params.q);
  if (params.category_id) qp.set('category_id', params.category_id.toString());
  if (params.status && params.status !== 'all') qp.set('status', params.status);
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
  }>(`/admin/icons/list.php?${qp.toString()}`, { cache: 'no-store' });
}

export async function getAdminIcon(idOrSlug: number | string) {
  const param = typeof idOrSlug === 'number' ? `id=${idOrSlug}` : `slug=${encodeURIComponent(idOrSlug)}`;
  return request<import('@/types/admin').AdminIconItem>(`/admin/icons/single.php?${param}`, {
    cache: 'no-store',
  });
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

export async function updateAdminIcon(data: {
  id: number;
  name?: string;
  slug?: string;
  category_id?: number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
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

export async function getAdminCategories() {
  return request<import('@/types/admin').AdminCategoryItem[]>('/admin/categories/list.php', {
    cache: 'no-store',
  });
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
  }>(`/admin/users/list.php?${qp.toString()}`, { cache: 'no-store' });
}

export async function updateAdminUserStatus(id: number, status?: 'active' | 'suspended', role?: 'user' | 'admin') {
  return request<{ id: number; status: string; role: string }>('/admin/users/update_status.php', {
    method: 'POST',
    body: JSON.stringify({ id, status, role }),
  });
}

export async function getAdminFavorites(page = 1, limit = 20) {
  return request<{
    top_icons: any[];
    recent: any[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/favorites/list.php?page=${page}&limit=${limit}`, { cache: 'no-store' });
}

export async function getAdminCollections(page = 1, limit = 20) {
  return request<{
    items: any[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/collections/list.php?page=${page}&limit=${limit}`, { cache: 'no-store' });
}

export async function getAdminDownloads(page = 1, limit = 20) {
  return request<{
    stats: { total: number; svg: number; png: number; today: number };
    top_icons: any[];
    items: any[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/admin/downloads/list.php?page=${page}&limit=${limit}`, { cache: 'no-store' });
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
  }>(`/admin/contact-messages/list.php?${qp.toString()}`, { cache: 'no-store' });
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
  }>(`/admin/audit-logs/list.php?${qp.toString()}`, { cache: 'no-store' });
}

// Notifications
export async function getNotifications() {
  return request<{
    notifications: import('@/types/icon').AppNotification[];
    unread_count: number;
    user_roles: string[];
  }>('/notifications/list.php', { cache: 'no-store' });
}

export async function markNotificationRead(id?: number | 'all') {
  return request('/notifications/mark_read.php', {
    method: 'POST',
    body: JSON.stringify(id === 'all' || !id ? { all: true } : { id }),
  });
}

export async function deleteNotification(id: number) {
  return request('/notifications/delete.php', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function clearAllReadNotifications() {
  return request('/notifications/delete.php', {
    method: 'POST',
    body: JSON.stringify({ clear_all_read: true }),
  });
}

