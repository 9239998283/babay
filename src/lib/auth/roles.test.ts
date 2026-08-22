import { describe, expect, it } from "vitest";
import { isAdminUser } from "./roles";

describe("administrator authorization", () => {
  it("trusts only server-controlled app metadata", () => {
    expect(isAdminUser({ app_metadata: { role: "admin" } })).toBe(true);
    expect(isAdminUser({ app_metadata: { role: "customer" } })).toBe(false);
    expect(isAdminUser({ app_metadata: {} })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
});
