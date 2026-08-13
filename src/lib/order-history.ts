import type { CartLine } from "@/types/menu";
import type { CheckoutValues } from "@/lib/validation/checkout";
import { cartTotal } from "@/lib/whatsapp";

const STORAGE_KEY = "b-bay-order-history-v1";
const MAX_ORDERS = 10;

export type SavedOrder = {
  id: string;
  createdAt: string;
  total: number;
  count: number;
  fulfillment: CheckoutValues["fulfillment"];
  payment: CheckoutValues["payment"];
  items: Array<{ name: string; quantity: number }>;
};

function isSavedOrder(value: unknown): value is SavedOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  const items = order.items;
  return (
    typeof order.id === "string" && typeof order.createdAt === "string" &&
    !Number.isNaN(Date.parse(order.createdAt)) && typeof order.total === "number" &&
    Number.isFinite(order.total) && order.total >= 0 && typeof order.count === "number" &&
    Number.isFinite(order.count) && (order.fulfillment === "delivery" || order.fulfillment === "pickup") &&
    (order.payment === "cash" || order.payment === "transfer") && Array.isArray(items) &&
    items.every((item) => Boolean(item && typeof item === "object" &&
      typeof (item as Record<string, unknown>).name === "string" &&
      typeof (item as Record<string, unknown>).quantity === "number" &&
      Number.isFinite((item as Record<string, unknown>).quantity)))
  );
}

export function readSavedOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter(isSavedOrder).slice(0, MAX_ORDERS);
  } catch {
    return [];
  }
}

export function saveOrderSummary(lines: CartLine[], checkout: CheckoutValues) {
  if (typeof window === "undefined") return;

  const order: SavedOrder = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    total: cartTotal(lines),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    fulfillment: checkout.fulfillment,
    payment: checkout.payment,
    items: lines.map((line) => ({ name: line.item.name, quantity: line.quantity })),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readSavedOrders()].slice(0, MAX_ORDERS)));
    window.dispatchEvent(new Event("b-bay-orders-updated"));
  } catch {
    // Order submission must not fail because local history cannot be persisted.
  }
}

export function clearSavedOrders() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("b-bay-orders-updated"));
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
