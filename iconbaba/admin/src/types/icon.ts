// admin/src/types/icon.ts

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  roles?: string[];
  status?: 'active' | 'suspended';
  created_at: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  icon_count: number;
  display_order: number;
}
