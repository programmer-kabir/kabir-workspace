export interface PlatformInfo {
  name: string;
  id: string;
  color: string;
  badge: string;
}

export interface VideoFormat {
  formatId: string;
  resolution: string;
  qualityName: string;
  height: number;
  ext: string;
  hasAudio: boolean;
  size: string | null;
  rawSize?: number | null;
  url?: string | null;
}

export interface AudioFormat {
  formatId: string;
  ext: string;
  codec: string;
  bitrate: string;
  size: string | null;
  rawSize?: number | null;
  url?: string | null;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  duration: string | null;
  rawDuration: number;
  uploader: string;
  uploaderUrl?: string | null;
  viewCount?: string | null;
  platform: PlatformInfo;
  originalUrl: string;
  videoFormats: VideoFormat[];
  hasAudioFormats: boolean;
  bestAudio?: AudioFormat | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  isVerified?: boolean;
  referralCode?: string;
}

export interface DashboardStats {
  totalDownloads: number;
  successfulDownloads: number;
  failedDownloads: number;
  activeQueueJobs: number;
  plan: string;
  quota: {
    daily: number;
    usedDaily: number;
    remainingDaily: number;
    monthly: number;
    usedMonthly: number;
    remainingMonthly: number;
  };
  platformStats: { platform: string; count: number }[];
  downloadTrend: { date: string; label: string; count: number }[];
  recentDownloads: HistoryItem[];
}

export interface QueueJob {
  id: string;
  user_id?: string;
  url: string;
  platform: string;
  format_id?: string;
  type: string;
  quality?: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress: number;
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  file_size?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryItem {
  id: number;
  user_id: string;
  job_id?: string;
  url: string;
  platform: string;
  title: string;
  thumbnail?: string;
  format_id?: string;
  type: string;
  resolution?: string;
  file_size?: string;
  duration?: string;
  created_at: string;
}

export interface FavoriteItem {
  id: number;
  user_id: string;
  url: string;
  platform: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  collection: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface ActivityItem {
  id: number;
  user_id: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'active' | 'revoked';
  isEnabled: boolean;
  monthlyQuota: number;
  requestsThisMonth: number;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ApiLog {
  id: number;
  api_key_id?: string;
  user_id?: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  ip_address?: string;
  error_message?: string | null;
  created_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secretMasked: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  user_id: string;
  event: string;
  payload: any;
  response_status?: number | null;
  response_body?: string | null;
  attempt: number;
  max_attempts: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  error_message?: string | null;
  created_at: string;
  delivered_at?: string | null;
}

export interface DeveloperStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
  plan: string;
  quota: {
    monthlyLimit: number;
    usedThisMonth: number;
    remainingMonth: number;
  };
  usageTrend: { date: string; label: string; count: number }[];
  endpointBreakdown: { endpoint: string; method: string; count: number }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'free' | 'pro' | 'enterprise';
  priceMonthlyBdt: number;
  priceYearlyBdt: number;
  dailyDownloadQuota: number;
  monthlyDownloadQuota: number;
  apiRpm: number;
  apiMonthlyQuota: number;
  maxConcurrentJobs: number;
  features: string[];
}

export interface PaymentMethod {
  id: string;
  name: string;
  identifier: string;
  account_number: string;
  account_type: string;
  instructions: string;
  is_enabled?: number;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  plan_id: string;
  plan_slug: string;
  plan_name?: string;
  payment_method_id: string;
  payment_method_name: string;
  sender_number: string;
  transaction_id: string;
  amount: number;
  billing_period: 'monthly' | 'yearly';
  status: 'pending' | 'approved' | 'rejected';
  screenshot_url?: string | null;
  admin_note?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionDetails {
  currentPlan: string;
  planDetails: {
    name: string;
    slug: string;
    dailyQuota: number;
    monthlyQuota: number;
    apiRpm: number;
    apiMonthlyQuota: number;
    maxConcurrentJobs: number;
  };
  subscription: {
    id: string;
    billingPeriod: string;
    startsAt: string;
    expiresAt: string;
    daysRemaining: number | null;
    status: string;
  } | null;
  pendingPayment: {
    id: string;
    transactionId: string;
    planSlug: string;
    methodName: string;
    amount: number;
    createdAt: string;
  } | null;
}

export interface AdminPaymentStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalRevenueBdt: number;
}
