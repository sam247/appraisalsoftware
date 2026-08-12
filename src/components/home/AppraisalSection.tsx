import { Check } from "lucide-react";
import { Panel, ScoreBar, SectionHeading, StatusChip } from "@/components/product/primitives";

const questions = [
  { q: "What went well during this review period?", answered: true },
  { q: "Where did you find the biggest challenges?", answered: true },
  { q: "Which objectives were met in full?", answered: true },
  { q: "What support do you need next period?", answered: false },
];

export function AppraisalSection() {
  return (
    <section id="appraisals" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Appraisals"
          title="Structured employee reviews, not a blank document"
          copy="Every appraisal follows the same clear shape: review period, questions, competencies, manager comments and the employee's own words — all captured in one record."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Appraisal — Daniel Okoye" meta="Review period: Jan – Jun 2026">
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  DO
                </span>
                <div className="mr-auto">
                  <p className="text-sm font-semibold text-foreground">Daniel Okoye</p>
                  <p className="text-[11px] text-muted-foreground">
                    Account Manager · Reviewer: M. Chen
                  </p>
                </div>
                <StatusChip status="In progress" />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Questions
                </p>
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                  {questions.map((item) => (
                    <li key={item.q} className="flex items-center gap-3 px-3 py-2.5">
                      <span
                        className={
                          "flex size-4.5 items-center justify-center rounded-full " +
                          (item.answered ? "bg-positive/20 text-positive-foreground" : "bg-surface-2")
                        }
                      >
                        {item.answered ? <Check className="size-3" /> : null}
                      </span>
                      <span className="text-xs text-foreground">{item.q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Manager feedback
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    “Consistently strong with clients this period. Renewals up on last cycle. Next
                    step is coaching the two new starters.”
                  </p>
                </div>
                <div className="rounded-xl border border-warm/30 bg-warm/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-foreground">
                    Employee feedback
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    “I'd like clearer targets for the second half and more time to plan the account
                    reviews properly.”
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Competencies">
              <div className="space-y-3.5 p-5">
                <ScoreBar label="Client relationships" value={92} />
                <ScoreBar label="Commercial awareness" value={76} />
                <ScoreBar label="Planning" value={58} />
                <ScoreBar label="Coaching others" value={64} />
              </div>
            </Panel>
            <Panel title="Completion status">
              <div className="space-y-3 p-5 text-xs">
                {[
                  ["Self-assessment", "Complete"],
                  ["Manager review", "In progress"],
                  ["Review meeting", "Not started"],
                  ["Sign-off", "Not started"],
                ].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="text-foreground">{label}</span>
                    <StatusChip status={status as "Complete"} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
