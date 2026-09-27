import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RespondForm from "./respond-form";
import type { CampaignQuestion } from "@/lib/types/database";

const question: CampaignQuestion = {
  id: "question", campaign_id: "campaign", organization_id: "org", sort_order: 0,
  type: "rating", prompt: "How did the year go?", help_text: "Consider your goals.", required: true,
  options: [], scale: { min: 1, max: 5 }, stable_key: null, competency_key: null,
  competency_label: null, section_key: null, section_label: null,
  source_template_question_id: null, created_at: "2026-01-01",
};

function render(anonymous: boolean, previewQuestionIndex?: number) {
  return renderToStaticMarkup(createElement(RespondForm, {
    preview: true, previewQuestionIndex, token: "", campaignName: "Annual review", questions: [question],
    relationship: anonymous ? "peer" : "self", alreadySubmitted: false, initialAnswers: [],
    anonymous, subjectName: "Alex", orgName: "Example Ltd",
  }));
}

describe("respondent-faithful preview", () => {
  it("starts the full preview at the real cover and identifies it as non-submitting", () => {
    const html = render(false);
    expect(html).toContain("Your self-appraisal");
    expect(html).toContain("Nothing you enter will be saved or submitted");
    expect(html).not.toContain("How did the year go?");
  });
  it("renders the actual question step in the edit canvas for Annual and anonymous 360", () => {
    const annual = render(false, 0);
    const feedback = render(true, 0);
    expect(annual).toContain("How did the year go?");
    expect(annual).toContain("Consider your goals.");
    expect(feedback).toContain("How did the year go?");
    expect(feedback).toContain("Submit feedback");
  });
});
