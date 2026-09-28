// admin/src/types/admin.ts

export interface DashboardStats {
  counts: {
    total_icons: number;
    published_icons: number;
    draft_icons: number;
    total_categories: number;
    total_users: number;
    total_downloads: number;
    total_favorites: number;
    total_collections: number;
    unread_messages: number;
  };
  recent_icons: Array<{
    id: number;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    category_name: string;
    svg_content?: string;
  }>;
  recent_downloads: Array<{
    id: number;
    format: 'svg' | 'png';
    size: number;
    created_at: string;
    icon_name: string;
    icon_slug: string;
    username: string;
    email: string;
  }>;
  recent_users: Array<{
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: 'user' | 'admin';
    roles?: string[];
    status: 'active' | 'suspended';
    created_at: string;
  }>;
  recent_audit: Array<{
    id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    details: any;
    created_at: string;
    username: string;
    full_name: string;
  }>;
}

export interface AdminIconItem {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  tags: string;
  tags_array?: string[];
  status: 'draft' | 'published' | 'archived';
  is_premium?: boolean;
  downloads_count: number;
  favorites_count: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  category_name: string;
  category_slug: string;
  creator_username?: string;
  variants?: {
    outlined?: string;
    filled?: string;
  };
}

export interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  status: 'active' | 'inactive';
  description?: string;
  created_at: string;
  updated_at: string;
  total_icons: number;
  published_icons: number;
  draft_icons: number;
  icon_count: number;
}

export interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  roles?: string[];
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  favorites_count: number;
  collections_count: number;
  downloads_count: number;
}

export interface AdminContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: any;
  ip_address: string;
  created_at: string;
  user_id: number;
  username: string;
  full_name: string;
}

export interface SystemRoleItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  users_count: number;
}

export interface BillingStats {
  total_revenue: number;
  total_payments: number;
  active_subscribers: number;
  total_subscriptions_all: number;
  plans: {
    solo: number;
    team: number;
  };
}

export interface AdminSubscriptionItem {
  id: number;
  user_id: number;
  plan_type: 'solo' | 'team';
  team_seats: number;
  lemonsqueezy_customer_id: string;
  lemonsqueezy_subscription_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  renews_at: string | null;
  ends_at: string | null;
  customer_portal_url: string | null;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  last_payment_amount?: string | null;
  last_payment_currency?: string | null;
  last_order_number?: string | null;
  is_currently_active: boolean;
}

export interface AdminPaymentItem {
  id: number;
  user_id: number;
  subscription_id: number | null;
  lemonsqueezy_order_id: string;
  order_number: string;
  amount: string;
  currency: string;
  status: string;
  payment_method: string | null;
  card_brand: string | null;
  card_last_four: string | null;
  receipt_url: string | null;
  created_at: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  plan_type?: string | null;
  team_seats?: number | null;
  subscription_status?: string | null;
}

export interface AdminNotification {
  id: number;
  user_id: number | null;
  target_role: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  action_data?: any;
  icon: string;
  is_read: boolean;
  created_at: string;
}
