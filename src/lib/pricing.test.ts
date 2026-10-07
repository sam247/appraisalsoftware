import { describe, expect, it } from "vitest";
import { plans, paidPlans, planContactHref } from "./pricing";
describe("public commercial plans", () => {
  it("keeps approved prices and capacity aligned", () => {
    expect(
      plans.map((p) => [
        p.name,
        p.price,
        p.employees,
        p.campaigns,
        p.admins,
        p.setup,
      ]),
    ).toEqual([
      ["Free", "£0", 10, 1, 1, false],
      ["Pro", "£39.99", 75, 5, 3, false],
      ["Organisation", "£89.99", 250, 20, 10, true],
    ]);
    expect(paidPlans.map((p) => p.name)).toEqual(["Pro", "Organisation"]);
  });
  it("preselects pricing and the paid plan in enquiries", () => {
    for (const p of paidPlans) {
      const url = new URL(
        planContactHref(p.name),
        "https://appraisalsoftware.co.uk",
      );
      expect(url.pathname).toBe("/contact");
      expect(url.searchParams.get("type")).toBe("pricing");
      expect(url.searchParams.get("plan")).toBe(p.name);
    }
  });
});
