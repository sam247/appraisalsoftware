import RespondForm from "@/app/r/[token]/respond-form";
import type { CampaignQuestion } from "@/lib/types/database";
import { ProductFrame } from "./ProductFrame";

const questions: CampaignQuestion[] = [
  {
    id: "marketing-preview-question-1",
    campaign_id: "marketing-preview",
    organization_id: "marketing-preview",
    sort_order: 1,
    type: "text",
    prompt: "What went well during this review period?",
    help_text: "Be specific about outcomes, delivery and how you worked with others.",
    required: true,
    options: [],
    scale: {},
    stable_key: "preview_went_well",
    competency_key: "performance",
    competency_label: "Performance",
    section_key: "performance",
    section_label: "Performance",
    source_template_question_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "marketing-preview-question-2",
    campaign_id: "marketing-preview",
    organization_id: "marketing-preview",
    sort_order: 2,
    type: "rating",
    prompt: "How effectively did you meet your objectives?",
    help_text: null,
    required: true,
    options: [],
    scale: { min: 1, max: 5, min_label: "Not met", max_label: "Exceeded" },
    stable_key: "preview_objectives",
    competency_key: "objectives",
    competency_label: "Objectives",
    section_key: "objectives",
    section_label: "Objectives",
    source_template_question_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

export function RespondentProof() {
  return (
    <ProductFrame
      title="Annual Appraisal 2026"
      description="The same structured respondent experience supports employee self-assessments and manager reviews."
      className="mx-auto max-w-xl"
    >
      <div className="max-h-[34rem] overflow-hidden bg-background">
        <RespondForm
          token="marketing-preview"
          campaignName="Annual Appraisal 2026"
          questions={questions}
          relationship="self"
          alreadySubmitted={false}
          orgName="Northstar Studio"
          orgBrandColor="#24734a"
          initialAnswers={[]}
        />
      </div>
    </ProductFrame>
  );
}
