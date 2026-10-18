import { describe, expect, it } from "vitest";
import type { CampaignQuestion, ResponseAnswer } from "@/lib/types/database";
import {
  buildDimensions,
  deriveInsights,
  recurringThemes,
  scoreDimensions,
  summariseTeam,
  type SubjectScores,
} from "./insights";

const q = (id: string, prompt: string, extra: Partial<CampaignQuestion> = {}) =>
  ({ id, prompt, type: "rating", scale: { min: 1, max: 5 }, competency_label: null, competency_key: null, ...extra }) as CampaignQuestion;
const a = (questionId: string, value: number) =>
  ({ campaign_question_id: questionId, numeric_value: value }) as ResponseAnswer;

describe("dimensions and scoring", () => {
  it("groups questions by competency and averages within a dimension", () => {
    const dims = buildDimensions([
      q("1", "Plans work well", { competency_label: "Organisation", competency_key: "org" }),
      q("2", "Meets deadlines", { competency_label: "Organisation", competency_key: "org" }),
      q("3", "Explains clearly"),
      { ...q("4", "Any comments?"), type: "text" } as CampaignQuestion,
    ]);
    expect(dims.map((d) => d.label)).toEqual(["Organisation", "Explains clearly"]);
    const scores = scoreDimensions(dims, { "1": a("1", 4), "2": a("2", 5) });
    expect(scores).toEqual({ org: 4.5, "explains clearly": null });
  });
});

const dims = buildDimensions([q("c", "Communication"), q("d", "Delivery"), q("l", "Leadership")]);
const person = (name: string, self: number[], manager: number[]): SubjectScores => ({
  subjectId: name,
  name,
  selfSubmitted: true,
  managerSubmitted: true,
  self: { communication: self[0], delivery: self[1], leadership: self[2] },
  manager: { communication: manager[0], delivery: manager[1], leadership: manager[2] },
});

describe("insights", () => {
  it("finds strengths, growth areas and blind spots from the ratings", () => {
    const insights = deriveInsights(
      dims,
      { communication: 5, delivery: 3, leadership: 5 },
      { communication: 5, delivery: 2, leadership: 3 },
      { audience: "person", name: "Alex" },
    );
    const kinds = insights.map((i) => i.kind);
    expect(kinds).toContain("strength");
    expect(insights.find((i) => i.kind === "strength")!.title).toContain("Communication");
    expect(insights.find((i) => i.kind === "growth")!.title).toContain("Delivery");
    expect(insights.find((i) => i.kind === "blind_spot")!.title).toContain("Leadership");
    expect(insights.find((i) => i.kind === "alignment")!.detail).toContain("of 3");
  });

  it("calls out hidden strengths when managers rate higher", () => {
    const insights = deriveInsights(dims, { communication: 2, delivery: 4, leadership: 4 }, { communication: 4, delivery: 4, leadership: 4 }, { audience: "person" });
    expect(insights.find((i) => i.kind === "hidden_strength")!.title).toContain("Communication");
  });

  it("summarises the team and spots areas that vary across people", () => {
    const subjects = [person("A", [5, 4, 4], [5, 4, 4]), person("B", [4, 4, 4], [2, 4, 4]), person("C", [3, 4, 4], [1, 4, 4])];
    const team = summariseTeam(dims, subjects);
    expect(team.manager.communication).toBe(2.7);
    expect(team.alignment).toBe(78); // 7 of 9 pairs within a point
    const insights = deriveInsights(dims, team.self, team.manager, { audience: "team", subjects });
    expect(insights.find((i) => i.kind === "spread")!.title).toContain("Communication");
  });

  it("never invents insights when there are no ratings", () => {
    expect(deriveInsights(dims, {}, {}, { audience: "team" })).toEqual([]);
  });
});

describe("recurringThemes", () => {
  it("counts a word once per answer and ignores filler words", () => {
    const themes = recurringThemes([
      "Great at mentoring and mentoring again",
      "Mentoring juniors is a real strength",
      "Needs to improve estimates; estimates slip",
      "Estimates could be tighter",
      "Good work this year",
    ]);
    expect(themes).toEqual([
      { term: "estimates", count: 2 },
      { term: "mentoring", count: 2 },
    ]);
  });
});
