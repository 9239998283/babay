import { describe, expect, it } from "vitest";
import { calculateDiscount, createOrderRequestSchema } from "./orders";

const validOrder = {
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  trackingToken: "22222222-2222-4222-8222-222222222222",
  customerName: "Муса",
  customerPhone: "8 (988) 902-60-14",
  fulfillmentMethod: "delivery" as const,
  deliveryAddress: "Грозный, проспект Путина, 1",
  deliveryZoneId: "33333333-3333-4333-8333-333333333333",
  paymentMethod: "cash",
  promoCode: "",
  orderComment: "Позвонить заранее",
  items: [{ menuItemId: "44444444-4444-4444-8444-444444444444", quantity: 2, modifierIds: [], comment: "" }],
};

describe("server order input", () => {
  it("normalizes a valid Russian phone", () => {
    const result = createOrderRequestSchema.parse(validOrder);
    expect(result.customerPhone).toBe("+79889026014");
  });

  it("does not accept prices or totals supplied by the browser", () => {
    const result = createOrderRequestSchema.safeParse({ ...validOrder, total: 1, items: [{ ...validOrder.items[0], price: 1 }] });
    expect(result.success).toBe(false);
  });

  it("requires a delivery address only for delivery", () => {
    expect(createOrderRequestSchema.safeParse({ ...validOrder, deliveryAddress: "" }).success).toBe(false);
    expect(createOrderRequestSchema.safeParse({ ...validOrder, fulfillmentMethod: "pickup", deliveryAddress: "", deliveryZoneId: null }).success).toBe(true);
  });
});

describe("discount calculation", () => {
  it("calculates percent, cap and fixed discounts in integer roubles", () => {
    expect(calculateDiscount(1999, { discountType: "percent", value: 10 })).toBe(199);
    expect(calculateDiscount(5000, { discountType: "percent", value: 20, maximumDiscount: 600 })).toBe(600);
    expect(calculateDiscount(400, { discountType: "fixed", value: 1000 })).toBe(400);
  });
});
