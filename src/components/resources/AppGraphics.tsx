import RespondForm from "@/app/r/[token]/respond-form";
import { Avatar, StatusChip } from "@/components/product/primitives";
import { ProductFrame } from "@/components/product-marketing/ProductFrame";
import { ResultsProof } from "@/components/product-marketing/ResultsProof";
import type { AppGraphic } from "@/lib/resource-content";
import type { CampaignQuestion } from "@/lib/types/database";

/*
 * Resource-page figures built from the real product components, so the
 * screens shown in guides match what people see in Appraisal Software.
 * All names and organisations are fictional.
 */

function question(
  id: string,
  sortOrder: number,
  prompt: string,
  options: { type?: CampaignQuestion["type"]; help?: string; section: string; scale?: CampaignQuestion["scale"] },
): CampaignQuestion {
  const key = options.section.toLowerCase().replace(/\W+/g, "_");
  return {
    id: `resource-preview-${id}`,
    campaign_id: "resource-preview",
    organization_id: "resource-preview",
    sort_order: sortOrder,
    type: options.type ?? "text",
    prompt,
    help_text: options.help ?? null,
    required: true,
    options: [],
    scale: options.scale ?? {},
    stable_key: `resource_${id}`,
    competency_key: key,
    competency_label: options.section,
    section_key: key,
    section_label: options.section,
    source_template_question_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

const forms = {
  "self-appraisal-form": {
    campaignName: "Annual Appraisal 2026",
    relationship: "self",
    questions: [
      question("achievement", 1, "Which achievement from this review period are you most proud of?", {
        section: "Achievements",
        help: "Name the objective or situation, what you did and what changed as a result.",
      }),
      question("objectives", 2, "How effectively did you meet your agreed objectives?", {
        type: "rating",
        section: "Objectives",
        scale: { min: 1, max: 5, min_label: "Not met", max_label: "Exceeded" },
      }),
      question("support", 3, "What support would help you most in the next period?", { section: "Support" }),
    ],
  },
  "probation-form": {
    campaignName: "Six-month probation review",
    relationship: "manager",
    questions: [
      question("expectations", 1, "How consistently is the employee meeting the standards agreed for the role?", {
        type: "rating",
        section: "Role expectations",
        scale: { min: 1, max: 5, min_label: "Not yet", max_label: "Consistently" },
      }),
      question("evidence", 2, "Give one example that supports your rating.", {
        section: "Role expectations",
        help: "Describe a specific task or situation, rather than a general impression.",
      }),
      question("support", 3, "What support or training has been provided, and what is still needed?", { section: "Support" }),
    ],
  },
  "objectives-form": {
    campaignName: "Annual Appraisal 2026",
    relationship: "self",
    questions: [
      question("next-objective", 1, "Propose one objective for the next review period.", {
        section: "Next period",
        help: "Describe the result, how progress will be measured, the target date and any support you need.",
      }),
      question("progress", 2, "How much progress did you make on last year’s objectives?", {
        type: "rating",
        section: "Objectives",
        scale: { min: 1, max: 5, min_label: "Little", max_label: "Fully met" },
      }),
    ],
  },
} as const;

function FormPreview({ graphic }: { graphic: keyof typeof forms }) {
  const form = forms[graphic];
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-border bg-card">
      <RespondForm
        preview
        compact
        token="resource-preview"
        campaignName={form.campaignName}
        questions={[...form.questions]}
        relationship={form.relationship}
        alreadySubmitted={false}
        orgName="Northstar Studio"
        orgLogoUrl="/marketing/northstar-logo.svg"
        orgBrandColor="#24734a"
        initialAnswers={[]}
      />
    </div>
  );
}

const campaignPeople = [
  { name: "Amelia Hart", initials: "AH", self: "Complete", manager: "Complete" },
  { name: "Daniel Okafor", initials: "DO", self: "Complete", manager: "In progress" },
  { name: "Sofia Mendes", initials: "SM", self: "In progress", manager: "Not started" },
  { name: "Tom Reid", initials: "TR", self: "Not started", manager: "Not started" },
] as const;

function CampaignProgress() {
  return (
    <ProductFrame eyebrow="Campaign" title="Annual Appraisal 2026" description="Track which self-assessments and manager responses are complete before the review meetings.">
      <div className="p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Responses</p>
          <p className="text-xs tabular-nums text-muted-foreground">3 of 8 complete · closes 14 Nov</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full w-[37.5%] rounded-full bg-primary" />
        </div>
        <div className="mt-5 hidden grid-cols-[1fr_7rem_7rem] gap-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
          <span>Employee</span>
          <span>Self</span>
          <span>Manager</span>
        </div>
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {campaignPeople.map((person, index) => (
            <li key={person.name} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 sm:grid-cols-[1fr_7rem_7rem]">
              <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-foreground">
                <Avatar initials={person.initials} tone={index} />
                <span className="truncate">{person.name}</span>
              </span>
              <span className="hidden sm:block"><StatusChip status={person.self} /></span>
              <span className="flex gap-1.5 sm:block">
                <span className="sm:hidden"><StatusChip status={person.self} /></span>
                <StatusChip status={person.manager} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Reminders go to anyone with an outstanding response.</p>
      </div>
    </ProductFrame>
  );
}

function Feedback360Summary() {
  const rows = [
    ["Explains priorities clearly", 4.2],
    ["Follows through on commitments", 4.5],
    ["Shares information early", 3.6],
  ] as const;
  return (
    <ProductFrame eyebrow="360 feedback results" title="Casey Morgan" description="Combined anonymous reviewer ratings, released after the campaign closes.">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Combined reviewer ratings</p>
          <StatusChip status="Anonymous" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Closed · 7 reviewers responded · names and response times are not shown</p>
        <dl className="mt-5 space-y-4">
          {rows.map(([label, score]) => (
            <div key={label}>
              <div className="flex justify-between gap-3 text-sm">
                <dt className="text-foreground">{label}</dt>
                <dd className="shrink-0 font-semibold tabular-nums">{score.toFixed(1)} / 5</dd>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(score / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-semibold text-foreground">Written feedback · theme</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">“Handovers are clear and well organised. When priorities change, an earlier explanation of what can wait would help.”</p>
        </div>
      </div>
    </ProductFrame>
  );
}

export function AppGraphicView({ graphic }: { graphic: AppGraphic }) {
  switch (graphic) {
    case "self-appraisal-form":
    case "probation-form":
    case "objectives-form":
      return <FormPreview graphic={graphic} />;
    case "self-vs-manager":
      return <ResultsProof />;
    case "campaign-progress":
      return <CampaignProgress />;
    case "feedback-360-summary":
      return <Feedback360Summary />;
  }
}
