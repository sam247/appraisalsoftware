import { describe, expect, it } from "vitest";
import { GROUP_ORDER, packAccess, packBySlug, packs, packTemplateQuestions } from "./marketplace";

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

  it("keeps the slugs purchases were made under", () => {
    for (const slug of ["annual-appraisal-pack", "probation-review-pack", "leadership-360-pack", "engineering-ladder-pack", "sales-performance-pack"])
      expect(packBySlug(slug)).toBeDefined();
  });

  it("gives every pack a group, nations, review date and a changelog for its version", () => {
    for (const pack of packs) {
      expect(GROUP_ORDER).toContain(pack.group);
      expect(pack.nations.length).toBeGreaterThan(0);
      expect(pack.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(pack.reviewed))).toBe(false);
      expect(pack.version).toBeGreaterThanOrEqual(1);
      expect(pack.changelog.map((c) => c.version)).toContain(pack.version);
      expect(pack.questions.length).toBeLessThanOrEqual(25);
      if (!pack.includedWithPro) expect(pack.price).toBeGreaterThanOrEqual(2900);
    }
  });

  it("states a supported basis for every sector pack", () => {
    for (const pack of packs.filter((p) => p.group !== "Review types" && p.group !== "Roles & teams")) expect(pack.basis).toBeTruthy();
  });

  it("never claims compliance, approval or endorsement", () => {
    const banned = /\b(compliant|compliance with|approved|guarantee[sd]?|meets the requirements|certified by|endorsed|accredited)\b/i;
    for (const pack of packs) {
      for (const text of [pack.name, pack.summary, pack.basis ?? "", pack.seoTitle ?? "", ...pack.benefits]) expect(text).not.toMatch(banned);
      if (pack.basis) expect(pack.basis).toMatch(/^Designed to support /);
    }
  });

  it("gives later versions their own stable keys", () => {
    const probation = packBySlug("probation-review-pack")!;
    expect(packTemplateQuestions(probation)[0].stable_key).toBe(`probation-review-pack@v${probation.version}:0`);
    expect(packTemplateQuestions(annual)[0].stable_key).toBe("annual-appraisal-pack:0");
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
