import { describe, expect, it } from "vitest";
import {
  accentBorder,
  accentForWhiteText,
  DEFAULT_BRAND_COLOR,
  normalizeBrandColor,
  PLATFORM_JADE,
} from "./branding";

describe("branding helpers", () => {
  it("normalises 3-digit hex", () => {
    expect(normalizeBrandColor("#0a8")).toBe("#00aa88");
  });

  it("rejects invalid colours", () => {
    expect(normalizeBrandColor("red")).toBeNull();
    expect(normalizeBrandColor("#gg0000")).toBeNull();
  });

  it("falls back to jade when accent is too light for white text", () => {
    expect(accentForWhiteText("#f5f5f5")).toBe(PLATFORM_JADE);
    expect(accentForWhiteText("#0d4f3c")).not.toBe(PLATFORM_JADE);
  });

  it("uses default border accent when unset", () => {
    expect(accentBorder(null)).toBe(DEFAULT_BRAND_COLOR);
  });
});
