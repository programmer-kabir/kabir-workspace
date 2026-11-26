// admin/src/types/cms.ts

export interface ContentPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
  creator_username?: string;
  creator_name?: string;
  updater_username?: string;
  updater_name?: string;
  revisions_count?: number;
}

export interface ContentPageRevision {
  id: number;
  page_id: number;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_by: number | null;
  created_at: string;
  updater_username?: string;
  updater_name?: string;
}

export interface PricingPlan {
  id: number;
  name: string;
  slug?: string;
  price: number;
  billing_period: string;
  description?: string;
  user_count?: number;
  extra_seat_price?: number;
  features: string[];
  cta_text: string;
  cta_url?: string;
  button_text?: string;
  is_popular: boolean;
  display_order: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  status?: 'draft' | 'published';
  is_active?: boolean;
}
