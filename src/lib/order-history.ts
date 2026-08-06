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

export function readSavedOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((order): order is SavedOrder => Boolean(order && typeof order === "object" && "id" in order));
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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readSavedOrders()].slice(0, MAX_ORDERS)));
  window.dispatchEvent(new Event("b-bay-orders-updated"));
}

export function clearSavedOrders() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("b-bay-orders-updated"));
}
