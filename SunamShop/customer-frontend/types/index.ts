export interface Category {
  id: number;
  parent_id: number | null;
  name_bn: string;
  name_en: string;
  slug: string;
  icon?: string;
  image?: string;
  display_order: number;
}

export interface DeliveryZoneArea {
  id: number;
  delivery_zone_id: number;
  area_name_bn: string;
  area_name_en: string;
  postal_code: string;
}

export interface DeliveryZone {
  id: number;
  zone_name_bn: string;
  zone_name_en: string;
  slug: string;
  delivery_charge: number;
  min_order_amount: number;
  estimated_delivery_time: string;
  areas: DeliveryZoneArea[];
}

export interface Product {
  id: number;
  category_id: number;
  category_name_bn: string;
  category_name_en: string;
  name_bn: string;
  name_en: string;
  slug: string;
  sku: string;
  unit: string;
  selling_price: string;
  discount_price: string | null;
  stock_quantity: string;
  sourcing_type: 'OWN_STOCK' | 'LOCAL_MARKET' | 'BOTH';
  is_variable_weight: number;
  weight_tolerance_percentage: string;
  availability_status: string;
  is_featured: number;
  primary_image?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  message: string;
  data: T;
  errors: any;
  meta: {
    timestamp: string;
    version: string;
    pagination?: {
      current_page: number;
      limit: number;
      total_items: number;
      total_pages: number;
    };
  };
}
