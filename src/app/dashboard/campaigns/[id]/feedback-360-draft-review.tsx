import {
  CampaignWizard,
  FEEDBACK_STEPS,
  ReviewSummary,
} from "../campaign-wizard";
import SendControls from "./send-controls";
import { campaignDate } from "../presentation";
import type {
  Campaign,
  CampaignAssignment,
  Person,
  TemplateQuestion,
} from "@/lib/types/database";

export default function Feedback360DraftReview({
  campaign,
  subject,
  assignments,
  peopleById,
  questions,
  templateName,
  ready,
}: {
  campaign: Campaign;
  subject: Person | null;
  assignments: CampaignAssignment[];
  peopleById: Record<string, Person>;
  questions: TemplateQuestion[];
  templateName: string | null;
  ready: boolean;
}) {
  const subjectLabel = subject?.full_name || subject?.email || "Subject";
  const closeLabel = campaign.closes_at
    ? campaignDate(campaign.closes_at, campaign.timezone)
    : "Not set";

  return (
    <CampaignWizard
      typeLabel="Anonymous 360"
      title={campaign.name}
      steps={FEEDBACK_STEPS}
      current="review"
      wide
    >
      <div className="space-y-6">
        <ReviewSummary
          items={[
            { label: "Type", value: "Anonymous 360" },
            { label: "Subject", value: subjectLabel },
            { label: "Reviewers", value: String(assignments.length) },
            { label: "Close date", value: closeLabel },
          ]}
        />

        <section>
          <h3 className="text-sm font-semibold text-foreground">Privacy</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>{assignments.length} reviewers selected</li>
            <li>
              {assignments.length >= 5
                ? "Minimum reviewer cohort met"
                : "Need at least five reviewers"}
            </li>
            <li>
              Results available only after closure and at least five completed
              reviewer responses
            </li>
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            Setup is locked — create a new draft to change subject, reviewers, or
            questions.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">Reviewers</h3>
          <ul className="mt-2 divide-y divide-border/60 border-y border-border/60 text-sm">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-foreground">
                  {peopleById[a.respondent_person_id]?.full_name ||
                    peopleById[a.respondent_person_id]?.email ||
                    "Reviewer"}
                </span>
                <span className="capitalize text-muted-foreground">
                  {(a.relationship || "other").replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">Questions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {templateName ?? "Template"} · {questions.length} questions
          </p>
          {questions.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Preview questions
              </summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {questions.map((q) => (
                  <li key={q.id}>{q.prompt}</li>
                ))}
              </ol>
            </details>
          )}
        </section>

        {ready && (
          <SendControls
            feedback
            campaignId={campaign.id}
            timezone={campaign.timezone}
          />
        )}
      </div>
    </CampaignWizard>
  );
}
