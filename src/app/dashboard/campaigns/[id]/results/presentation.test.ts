import { describe, expect, it } from "vitest";
import {
  areasToDiscuss,
  average,
  buildAnnualRatingPairs,
  feedback360OverallAverage,
  feedback360RatingProfile,
  shortPrompt,
} from "./presentation";
import type { CampaignQuestion, ResponseAnswer } from "@/lib/types/database";

function question(
  overrides: Partial<CampaignQuestion> & Pick<CampaignQuestion, "id" | "prompt">,
): CampaignQuestion {
  return {
    campaign_id: "c",
    organization_id: "o",
    sort_order: 0,
    type: "rating",
    help_text: null,
    required: true,
    options: [],
    scale: { min: 1, max: 5 },
    stable_key: null,
    competency_key: null,
    competency_label: null,
    section_key: null,
    section_label: null,
    source_template_question_id: null,
    created_at: "",
    ...overrides,
  };
}

function answer(
  overrides: Partial<ResponseAnswer> &
    Pick<ResponseAnswer, "id" | "campaign_question_id">,
): ResponseAnswer {
  return {
    response_id: "r",
    organization_id: "o",
    numeric_value: null,
    text_value: null,
    choice_values: [],
    saved_at: "",
    ...overrides,
  };
}

describe("results presentation", () => {
  it("averages ratings honestly and surfaces discussable gaps", () => {
    expect(average([4, 5, 3])).toBe(4);
    expect(average([])).toBeNull();

    const qs = [
      question({
        id: "q1",
        prompt: "Communication quality",
        competency_label: "Communication",
      }),
      question({ id: "q2", prompt: "Delivery quality", competency_label: "Delivery" }),
    ];
    const pairs = buildAnnualRatingPairs(
      qs,
      {
        q1: answer({ id: "a1", campaign_question_id: "q1", numeric_value: 5 }),
        q2: answer({ id: "a2", campaign_question_id: "q2", numeric_value: 4 }),
      },
      {
        q1: answer({ id: "a3", campaign_question_id: "q1", numeric_value: 3 }),
        q2: answer({ id: "a4", campaign_question_id: "q2", numeric_value: 4 }),
      },
    );
    expect(pairs[0]?.label).toBe("Communication");
    expect(areasToDiscuss(pairs).map((a) => a.label)).toEqual(["Communication"]);
  });

  it("builds 360 rating profiles from report questions only", () => {
    const profile = feedback360RatingProfile([
      {
        question_id: "1",
        prompt: "Leadership",
        type: "rating",
        answer_count: 5,
        average: 3.2,
        comments: null,
      },
      {
        question_id: "2",
        prompt: "Comment",
        type: "text",
        answer_count: 5,
        average: null,
        comments: ["x"],
      },
    ]);
    expect(profile).toHaveLength(1);
    expect(feedback360OverallAverage(profile)).toBe(3.2);
    expect(shortPrompt("A".repeat(50)).endsWith("…")).toBe(true);
  });
});
