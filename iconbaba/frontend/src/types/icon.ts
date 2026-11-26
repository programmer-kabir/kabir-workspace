// frontend/types/icon.ts

export type IconStyle = 'outlined' | 'filled' | 'lineal-color' | 'flat' | 'gradient';

export interface IconStyleMeta {
  slug: IconStyle | string;
  name: string;
  is_multicolor: boolean;
  supports_stroke_edit: boolean;
  display_order?: number;
}

export type StrokeLinecap = 'round' | 'butt' | 'square';
export type StrokeLinejoin = 'round' | 'bevel' | 'miter';

export type IconTier = 'all' | 'free' | 'pro';

export interface IconItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  category_slug: string;
  pack_id?: number | null;
  pack_name?: string | null;
  pack_slug?: string | null;
  tags: string[];
  downloads_count: number;
  favorites_count: number;
  style: IconStyle | string;
  is_premium?: boolean;
  is_multicolor?: boolean;
  svg: string;
  v_data?: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  icon_count: number;
  pack_count?: number;
}

export interface PackPreviewIcon {
  id: number;
  name: string;
  slug: string;
  style: string;
  v_data?: string;
  svg?: string;
}

export interface PackItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  category_id: number;
  category_name: string;
  category_slug: string;
  family_slug?: string | null;
  primary_style: string;
  author_name: string;
  is_premium: boolean;
  is_featured: boolean;
  icon_count: number;
  downloads_count: number;
  favorites_count: number;
  available_styles: string[];
  preview_icons: PackPreviewIcon[];
  created_at?: string;
}

export interface PackDetail extends Omit<PackItem, 'available_styles'> {
  available_styles: IconStyleMeta[];
  icons: Array<{
    id: number;
    name: string;
    slug: string;
    tags: string[];
    is_premium: boolean;
    default_style: string;
    downloads_count: number;
    favorites_count: number;
    v_variants: Record<string, string>;
    variants?: Record<string, string>;
  }>;
}

export interface IconCustomization {
  size: number;
  color: string;
  strokeWidth: number;
  strokeLinecap: StrokeLinecap;
  strokeLinejoin: StrokeLinejoin;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: string;
  roles?: string[];
  is_pro?: boolean;
  subscription?: {
    id: number;
    plan_type: string;
    team_seats: number;
    status: string;
    renews_at?: string | null;
    ends_at?: string | null;
    card_brand?: string | null;
    card_last_four?: string | null;
    customer_portal_url?: string | null;
  } | null;
  pending_invites?: TeamInvitation[];
  stats?: {
    favorites_count: number;
    collections_count: number;
    downloads_count: number;
  };
}

export interface TeamInvitation {
  invite_id: number;
  subscription_id: number;
  plan_type: string;
  team_seats: number;
  owner_name: string;
  owner_username: string;
  owner_email: string;
  created_at: string;
}

export interface AppNotification {
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

export interface UserPayment {
  id: number;
  subscription_id?: number | null;
  lemonsqueezy_order_id?: string | null;
  order_number: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  card_brand?: string | null;
  card_last_four?: string | null;
  receipt_url?: string | null;
  created_at: string;
  plan_type?: string;
  team_seats?: number;
  total_seats?: number;
  used_seats?: number;
  remaining_seats?: number;
  renews_at?: string | null;
  ends_at?: string | null;
}

export interface UserBillingData {
  customer?: {
    name: string;
    email: string;
    user_id: number;
  };
  subscription: {
    id: number;
    plan_type: string;
    team_seats: number;
    total_seats?: number;
    used_seats?: number;
    remaining_seats?: number;
    lemonsqueezy_customer_id?: string | null;
    lemonsqueezy_subscription_id?: string | null;
    status: string;
    renews_at?: string | null;
    ends_at?: string | null;
    customer_portal_url?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    is_team_member?: boolean;
    owner?: {
      name: string;
      email: string;
    };
  } | null;
  payments: UserPayment[];
  total_spent: number;
  total_payments: number;
  is_pro: boolean;
}

export interface TeamMember {
  id: number;
  email: string;
  name: string;
  username?: string | null;
  role: string;
  status: 'pending' | 'active';
  is_pending?: boolean;
  is_registered?: boolean;
  created_at: string;
}

export interface TeamData {
  is_team: boolean;
  subscription_id?: number;
  total_seats?: number;
  used_seats?: number;
  pending_seats?: number;
  remaining_seats?: number;
  owner?: {
    user_id: number;
    name: string;
    email: string;
    role: string;
    is_owner: boolean;
    created_at?: string | null;
  };
  members?: TeamMember[];
  message?: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  items_count: number;
  is_owner?: boolean;
  created_at: string;
  updated_at: string;
  items?: IconItem[];
}

export interface DownloadHistoryItem {
  download_id: number;
  format: 'svg' | 'png';
  size: number;
  downloaded_at: string;
  icon: IconItem;
}

export interface QuotaStatus {
  plan: 'guest' | 'free' | 'pro';
  is_unlimited: boolean;
  used: number;
  limit: number | null;
  remaining: number;
  can_export: boolean;
  require_login: boolean;
  require_pro: boolean;
}

