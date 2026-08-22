import { z } from "zod";
import { orderStatuses } from "@/types/orders";
import { russianPhoneSchema } from "./phone";

export const orderLineInputSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  modifierIds: z.array(z.string().uuid()).max(30).default([]),
  comment: z.string().trim().max(250).default(""),
}).strict();

const orderPricingInputFields = {
  items: z.array(orderLineInputSchema).min(1).max(100),
  fulfillmentMethod: z.enum(["delivery", "pickup"]),
  deliveryZoneId: z.string().uuid().nullable(),
  promoCode: z.string().trim().max(40).default(""),
} as const;

export const orderQuoteRequestSchema = z.object(orderPricingInputFields).strict().superRefine((value, context) => {
  if (value.fulfillmentMethod === "delivery" && !value.deliveryZoneId) {
    context.addIssue({ code: "custom", path: ["deliveryZoneId"], message: "Выберите зону доставки" });
  }
});

export const createOrderRequestSchema = z.object({
  ...orderPricingInputFields,
  idempotencyKey: z.string().uuid(),
  trackingToken: z.string().uuid(),
  customerName: z.string().trim().min(2).max(80),
  customerPhone: russianPhoneSchema,
  deliveryAddress: z.string().trim().max(250).default(""),
  paymentMethod: z.string().trim().min(2).max(40),
  orderComment: z.string().trim().max(500).default(""),
}).strict().superRefine((value, context) => {
  if (value.fulfillmentMethod === "delivery") {
    if (!value.deliveryZoneId) {
      context.addIssue({ code: "custom", path: ["deliveryZoneId"], message: "Выберите зону доставки" });
    }
    if (value.deliveryAddress.length < 5) {
      context.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Укажите адрес доставки" });
    }
  }
});

export const publicOrderLookupSchema = z.object({
  orderNumber: z.string().trim().regex(/^BB-\d{6}-\d{5,}$/),
  trackingToken: z.string().uuid(),
}).strict();

export const adminOrderFiltersSchema = z.object({
  search: z.string().trim().max(80).default(""),
  status: z.enum(orderStatuses).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
}).strict();

export const adminOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
  cancelledReason: z.string().trim().max(300).optional(),
}).strict().superRefine((value, context) => {
  if (value.status === "cancelled" && (!value.cancelledReason || value.cancelledReason.length < 3)) {
    context.addIssue({ code: "custom", path: ["cancelledReason"], message: "Укажите причину отмены" });
  }
});

const openingHoursDaySchema = z.object({
  enabled: z.boolean(),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).strict();

export const restaurantSettingsSchema = z.object({
  establishment_name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(2).max(250),
  phone: z.string().trim().min(5).max(40),
  whatsapp_phone: z.string().trim().regex(/^\d{10,15}$/),
  orders_open: z.boolean(),
  opening_hours: z.record(z.string(), openingHoursDaySchema),
  minimum_order: z.number().int().min(0).max(100_000),
  preparation_minutes: z.number().int().min(1).max(480),
  delivery_minutes: z.number().int().min(1).max(720),
  payment_methods: z.array(z.enum(["cash", "transfer"])).min(1),
}).strict();

export const deliveryZoneSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).nullable(),
  fee: z.number().int().min(0).max(100_000),
  minimum_order: z.number().int().min(0).max(100_000),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
}).strict();

export const promoCodeSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().int().positive().max(100_000),
  minimum_order: z.number().int().min(0).max(100_000),
  maximum_discount: z.number().int().positive().max(100_000).nullable(),
  starts_at: z.iso.datetime().nullable(),
  ends_at: z.iso.datetime().nullable(),
  usage_limit: z.number().int().positive().nullable(),
  is_active: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.discount_type === "percent" && value.discount_value > 100) {
    context.addIssue({ code: "custom", path: ["discount_value"], message: "Процент не может быть больше 100" });
  }
  if (value.starts_at && value.ends_at && value.ends_at <= value.starts_at) {
    context.addIssue({ code: "custom", path: ["ends_at"], message: "Дата окончания должна быть позже начала" });
  }
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type OrderQuoteRequest = z.infer<typeof orderQuoteRequestSchema>;

export function calculateDiscount(
  subtotal: number,
  promo: { discountType: "percent" | "fixed"; value: number; maximumDiscount?: number | null },
) {
  const raw = promo.discountType === "percent" ? Math.floor(subtotal * promo.value / 100) : promo.value;
  return Math.min(subtotal, promo.maximumDiscount ? Math.min(raw, promo.maximumDiscount) : raw);
}

