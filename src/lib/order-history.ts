import { orderStatuses, type CreatedOrder, type OrderStatus } from "@/types/orders";

const STORAGE_KEY = "b-bay-server-orders-v2";
const MAX_ORDERS = 20;

export type SavedOrderReference = {
  orderNumber: string;
  trackingToken: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
};

function isSavedOrderReference(value: unknown): value is SavedOrderReference {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return typeof order.orderNumber === "string"
    && /^BB-\d{6}-\d{5,}$/.test(order.orderNumber)
    && typeof order.trackingToken === "string"
    && /^[0-9a-f-]{36}$/i.test(order.trackingToken)
    && typeof order.createdAt === "string"
    && !Number.isNaN(Date.parse(order.createdAt))
    && typeof order.total === "number"
    && typeof order.status === "string"
    && orderStatuses.includes(order.status as OrderStatus);
}

export function readSavedOrders(): SavedOrderReference[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter(isSavedOrderReference).slice(0, MAX_ORDERS) : [];
  } catch {
    return [];
  }
}

export function saveOrderReference(order: CreatedOrder) {
  if (typeof window === "undefined") return;
  const reference: SavedOrderReference = {
    orderNumber: order.orderNumber,
    trackingToken: order.trackingToken,
    createdAt: order.createdAt,
    total: order.total,
    status: order.status,
  };
  try {
    const previous = readSavedOrders().filter((item) => item.orderNumber !== reference.orderNumber);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([reference, ...previous].slice(0, MAX_ORDERS)));
    window.dispatchEvent(new Event("b-bay-orders-updated"));
  } catch {
    // The order is already stored on the server; local references are optional.
  }
}

export function updateSavedOrderStatus(orderNumber: string, status: OrderStatus) {
  if (typeof window === "undefined") return;
  try {
    const orders = readSavedOrders().map((order) => order.orderNumber === orderNumber ? { ...order, status } : order);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Status remains available from the server when local storage is unavailable.
  }
}

export function clearSavedOrders() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("b-bay-orders-updated"));
  } catch {
    // Only the local index is cleared; server orders are never deleted here.
  }
}
