import { describe, expect, it } from "vitest";
import { packAccess, packBySlug, packs, packTemplateQuestions } from "./marketplace";

const annual = packBySlug("annual-appraisal-pack")!;
const leadership = packBySlug("leadership-360-pack")!;
const sales = packBySlug("sales-performance-pack")!;
const none = new Set<string>();

describe("catalogue", () => {
  it("has unique slugs and well-formed questions", () => {
    expect(new Set(packs.map((p) => p.slug)).size).toBe(packs.length);
    for (const pack of packs) {
      expect(pack.slug).toMatch(/^[a-z0-9-]{3,64}$/);
      expect(pack.questions.length).toBeGreaterThanOrEqual(10);
      const rows = packTemplateQuestions(pack);
      for (const row of rows.filter((r) => r.type === "rating")) {
        expect(row.scale).toMatchObject({ min: 1, max: 5 });
        expect(row.competency_label).toBeTruthy();
      }
    }
  });

  it("keeps 360 packs to rating and written questions", () => {
    for (const pack of packs.filter((p) => p.campaignType === "feedback_360"))
      expect(pack.questions.every((q) => q.type === "rating" || q.type === "text")).toBe(true);
  });
});

describe("packAccess", () => {
  it("gives Pro-included packs to paid and early-access plans only", () => {
    expect(packAccess(annual, "pro", none)).toBe("included");
    expect(packAccess(annual, "organisation", none)).toBe("included");
    expect(packAccess(annual, "legacy", none)).toBe("included");
    expect(packAccess(annual, "free", none)).toBe("available");
  });

  it("makes purchases permanent", () => {
    expect(packAccess(sales, "free", new Set(["sales-performance-pack"]))).toBe("owned");
  });

  it("requires a plan that can run 360 for 360 packs", () => {
    expect(packAccess(leadership, "free", none)).toBe("needs_pro");
    expect(packAccess(leadership, "free", new Set(["leadership-360-pack"]))).toBe("needs_pro");
    expect(packAccess(leadership, "pro", none)).toBe("available");
    expect(packAccess(leadership, "pro", new Set(["leadership-360-pack"]))).toBe("owned");
  });
});
