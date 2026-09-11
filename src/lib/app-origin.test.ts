import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAppOrigin, respondentUrl } from "@/lib/app-origin";

describe("app origin", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
    delete process.env.APP_ORIGIN;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("uses explicit NEXT_PUBLIC_APP_ORIGIN", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://app.appraisalsoftware.co.uk/";
    expect(getAppOrigin()).toBe("https://app.appraisalsoftware.co.uk");
  });

  it("uses production canonical host when VERCEL_ENV=production", () => {
    process.env.VERCEL_ENV = "production";
    expect(getAppOrigin()).toBe("https://app.appraisalsoftware.co.uk");
  });

  it("builds respondent URL from origin + token", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://app.appraisalsoftware.co.uk";
    expect(respondentUrl("deadbeef")).toBe(
      "https://app.appraisalsoftware.co.uk/r/deadbeef",
    );
  });

  it("rejects unsafe token shapes", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://app.appraisalsoftware.co.uk";
    expect(() => respondentUrl("a/b")).toThrow();
  });
});
