import { describe, expect, it } from "vitest";
import { isFreePlan } from "./plan";

describe("isFreePlan", () => {
  it("treats missing plan as free", () => {
    expect(isFreePlan({ settings: {} })).toBe(true);
  });

  it("hides upgrade for paid plans", () => {
    expect(isFreePlan({ settings: { plan: "pro" } })).toBe(false);
    expect(isFreePlan({ settings: { plan: "PAID" } })).toBe(false);
  });
});
