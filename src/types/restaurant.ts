export type OpeningHoursDay = {
  enabled: boolean;
  open: string;
  close: string;
};

export type OpeningHours = Record<string, OpeningHoursDay>;

export type RestaurantSettings = {
  id: boolean;
  establishment_name: string;
  address: string;
  phone: string;
  whatsapp_phone: string;
  orders_open: boolean;
  opening_hours: OpeningHours;
  minimum_order: number;
  preparation_minutes: number;
  delivery_minutes: number;
  payment_methods: string[];
  updated_at?: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  minimum_order: number;
  is_active: boolean;
  sort_order: number;
};

export type PromoCode = {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
};

export type PublicRestaurantConfig = {
  settings: RestaurantSettings;
  deliveryZones: DeliveryZone[];
};

