import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus } from "./orders";

describe("order status transitions", () => {
  it("allows the operational happy path", () => {
    expect(canTransitionOrderStatus("new", "confirmed")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "preparing")).toBe(true);
    expect(canTransitionOrderStatus("preparing", "ready")).toBe(true);
    expect(canTransitionOrderStatus("ready", "courier")).toBe(true);
    expect(canTransitionOrderStatus("courier", "delivered")).toBe(true);
  });

  it("blocks skipped and terminal transitions", () => {
    expect(canTransitionOrderStatus("new", "delivered")).toBe(false);
    expect(canTransitionOrderStatus("delivered", "cancelled")).toBe(false);
    expect(canTransitionOrderStatus("cancelled", "new")).toBe(false);
  });
});
