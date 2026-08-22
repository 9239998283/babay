import { describe, expect, it } from "vitest";
import { isRestaurantAcceptingOrders } from "./restaurant-hours";
import type { RestaurantSettings } from "@/types/restaurant";

const settings: RestaurantSettings = {
  id: true,
  establishment_name: "Бабай",
  address: "Грозный",
  phone: "+7 988 902-60-14",
  whatsapp_phone: "79889026014",
  orders_open: true,
  opening_hours: Object.fromEntries(Array.from({ length: 7 }, (_, index) => [String(index + 1), { enabled: true, open: "10:00", close: "23:00" }])),
  minimum_order: 0,
  preparation_minutes: 30,
  delivery_minutes: 60,
  payment_methods: ["cash", "transfer"],
};

describe("restaurant hours", () => {
  it("combines the manual switch with the Moscow schedule", () => {
    expect(isRestaurantAcceptingOrders(settings, new Date("2026-08-24T09:00:00Z"))).toBe(true);
    expect(isRestaurantAcceptingOrders(settings, new Date("2026-08-24T21:00:00Z"))).toBe(false);
    expect(isRestaurantAcceptingOrders({ ...settings, orders_open: false }, new Date("2026-08-24T09:00:00Z"))).toBe(false);
  });

  it("supports a schedule that crosses midnight", () => {
    const overnight = { ...settings, opening_hours: { ...settings.opening_hours, "1": { enabled: true, open: "18:00", close: "02:00" }, "2": { enabled: false, open: "10:00", close: "23:00" } } };
    expect(isRestaurantAcceptingOrders(overnight, new Date("2026-08-24T20:00:00Z"))).toBe(true);
    expect(isRestaurantAcceptingOrders(overnight, new Date("2026-08-24T22:30:00Z"))).toBe(true);
  });
});
