// frontend/types/admin.ts

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
