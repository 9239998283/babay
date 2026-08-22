export const orderStatuses = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "courier",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  courier: "Передан курьеру",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const orderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["courier", "delivered", "cancelled"],
  courier: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  return from === to || orderStatusTransitions[from].includes(to);
}

export type OrderQuote = {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  promoCode: string | null;
  minimumOrder: number;
};

export type CreatedOrder = OrderQuote & {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  duplicate: boolean;
  trackingToken: string;
};

export type PublicOrderStatus = {
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  fulfillmentMethod: "delivery" | "pickup";
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
};

export type AdminOrderItem = {
  id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  modifiers: Array<{ id: string; name: string; price: number }>;
  modifiers_total: number;
  item_comment: string | null;
  line_total: number;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status_updated_at: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_method: "delivery" | "pickup";
  delivery_address: string | null;
  delivery_zone_id: string | null;
  delivery_zone_name: string | null;
  payment_method: string;
  promo_code: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total: number;
  order_comment: string | null;
  status: OrderStatus;
  cancelled_reason: string | null;
  order_items: AdminOrderItem[];
};

