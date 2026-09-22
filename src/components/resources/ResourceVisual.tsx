import type { ResourceContent } from "@/lib/resource-content";

type ProcessStep = {
  title: string;
  copy: string;
};

type QuestionGroupPreview = {
  title: string;
  copy: string;
  example?: string;
  count?: number;
};

const shellClassName = "border-b border-border bg-surface/50 py-10 sm:py-12";
const containerClassName = "mx-auto max-w-6xl px-5 lg:px-8";

export function ProcessRail({
  eyebrow = "A practical process",
  title,
  copy,
  steps,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  steps: ProcessStep[];
}) {
  return (
    <section className={shellClassName} aria-label={title}>
      <div className={containerClassName}>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl font-display text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              {copy}
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <span className="text-xs font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function QuestionGroupsPreview({
  groups,
}: {
  groups: QuestionGroupPreview[];
}) {
  return (
    <section className={shellClassName} aria-labelledby="question-groups-title">
      <div className={containerClassName}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              Start with the purpose
            </p>
            <h2
              id="question-groups-title"
              className="mt-3 font-display text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.75rem]"
            >
              Choose a small set of focused prompts
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Use the groups to build a balanced form, then remove anything that
            will not inform the review conversation.
          </p>
        </div>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <li key={group.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                {group.count ? (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {group.count} prompts
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {group.copy}
              </p>
              {group.example ? (
                <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-foreground">
                  “{group.example}”
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TemplateOverview({ resource }: { resource: ResourceContent }) {
  const template = resource.template ?? [];

  return (
    <section className={shellClassName} aria-labelledby="template-overview-title">
      <div className={containerClassName}>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              Template at a glance
            </p>
            <h2
              id="template-overview-title"
              className="mt-3 max-w-xl font-display text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.75rem]"
            >
              A usable starting point, not a long generic form
            </h2>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="border-t border-border pt-3">
                <dt className="font-medium text-foreground">Best for</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{resource.audience}</dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="font-medium text-foreground">Use it for</dt>
                <dd className="mt-1 leading-relaxed text-muted-foreground">{resource.intent}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold text-foreground">Sections in this template</p>
              <span className="text-xs text-muted-foreground">
                {template.length} sections
              </span>
            </div>
            <ol className="mt-4 divide-y divide-border border-y border-border">
              {template.map((block, index) => (
                <li key={block.title} className="flex gap-3 py-3.5">
                  <span className="text-xs font-semibold tabular-nums text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{block.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidencePattern({
  eyebrow,
  title,
  copy,
  steps,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  steps: string[];
}) {
  return (
    <section className={shellClassName} aria-label={title}>
      <div className={containerClassName}>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl font-display text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.75rem]">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              {copy}
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step} className="rounded-xl border border-border bg-card p-5">
                <span className="text-xs font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function ResourceVisual({ resource }: { resource: ResourceContent }) {
  if (resource.template) {
    return <TemplateOverview resource={resource} />;
  }

  if (resource.slug === "annual-appraisal-guide") {
    return (
      <ProcessRail
        eyebrow="The appraisal cycle"
        title="Prepare, compare, then turn the conversation into action"
        copy="A useful annual appraisal is a short process with a clear purpose. The form supports the conversation; it does not replace preparation or follow-up."
        steps={[
          { title: "Prepare", copy: "Share focused questions, review objectives and gather evidence from the whole period." },
          { title: "Compare", copy: "Discuss the employee’s reflection alongside the manager’s observations and context." },
          { title: "Agree", copy: "Set a small number of objectives, support actions, owners and dates." },
          { title: "Follow up", copy: "Book an earlier check-in so agreed actions are reviewed before next year." },
        ]}
      />
    );
  }

  if (resource.slug === "360-degree-feedback") {
    return (
      <ProcessRail
        eyebrow="A multi-rater process"
        title="From the subject’s purpose to useful development action"
        copy="360 feedback is an educational process, not a score collection exercise. Be clear about who can observe the work, what will be shared and how themes will be discussed."
        steps={[
          { title: "Define", copy: "Agree what the subject should understand or develop before choosing questions." },
          { title: "Invite", copy: "Choose reviewers with recent, relevant experience of the work." },
          { title: "Interpret", copy: "Compare themes and examples carefully; different groups see different parts of the role." },
          { title: "Act", copy: "Agree one or two practical changes, support and a date to revisit them." },
        ]}
      />
    );
  }

  if (resource.slug === "appraisal-answers") {
    return (
      <EvidencePattern
        eyebrow="A useful answer"
        title="Move from a general claim to evidence someone can discuss"
        copy="A strong self-appraisal answer does not need to sound polished. It needs to show what happened, what you contributed and what you will do next."
        steps={["Situation or objective", "Your contribution", "Result or evidence", "Learning or next step"]}
      />
    );
  }

  if (resource.slug === "appraisal-comments") {
    return (
      <EvidencePattern
        eyebrow="A fair manager comment"
        title="Describe the work, its effect and the support that follows"
        copy="Specific observations are easier to discuss and fairer to review than labels about someone’s character."
        steps={["Expected standard", "Observed behaviour or result", "Effect on the work", "Continue, change or support"]}
      />
    );
  }

  if (resource.slug === "appraisal-objectives") {
    return (
      <EvidencePattern
        eyebrow="Objective structure"
        title="Make the next period clear enough to review"
        copy="An objective should describe an outcome the person can influence, how progress will be seen and what support is available."
        steps={["Result to achieve", "Measure or evidence", "Target date", "Support and review point"]}
      />
    );
  }

  if (resource.slug === "360-feedback-examples") {
    return (
      <EvidencePattern
        eyebrow="Read the example carefully"
        title="A useful feedback theme connects behaviour to an action"
        copy="Fictional examples are here to show structure, not to provide a score or a product report. Look for the behaviour, its effect and the practical next step."
        steps={["Behaviour observed", "Effect on shared work", "Perspective or context", "Agreed development action"]}
      />
    );
  }

  if (resource.slug === "360-feedback-questions") {
    return (
      <QuestionGroupsPreview
        groups={resource.sections
          .slice(1, 5)
          .map((section) => ({
            title: section.title,
            copy: section.paragraphs[0] ?? "Choose observable behaviours relevant to the review.",
            count: section.items?.length,
            example: section.items?.[0],
          }))}
      />
    );
  }

  return (
    <section className={shellClassName} aria-labelledby="resource-overview-title">
      <div className={containerClassName}>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              Resource at a glance
            </p>
            <h2
              id="resource-overview-title"
              className="mt-3 max-w-xl font-display text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[1.75rem]"
            >
              Start with the question you need to answer
            </h2>
          </div>
          <dl className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                For
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground">{resource.audience}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                This page helps with
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground">{resource.intent}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
