import Link from "next/link";

import { Panel, SectionHeading } from "@/components/product/primitives";
import { ROUTES } from "@/lib/routes";

/**
 * Complete the appraisal — branded one-question-at-a-time respondent experience.
 * Major product differentiator visual.
 */
export function CompleteAppraisalSection() {
  return (
    <section id="complete" className="border-y border-border bg-surface/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="order-2 lg:order-1">
            <Panel title="Your appraisal" meta="Acme Ltd" className="mx-auto max-w-md lg:max-w-none">
              <div className="relative min-h-[22rem] p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                      AL
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Acme Ltd</p>
                      <p className="text-[10px] text-muted-foreground">Annual performance review</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">Question 3 of 8</span>
                </div>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full w-[37.5%] rounded-full bg-primary" />
                </div>

                <div className="mt-8">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Performance
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground sm:text-xl">
                    What went well during this review period?
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Be specific about outcomes, delivery and how you worked with others.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-surface/80 p-4">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    Renewals were ahead of target on my two largest accounts, and I onboarded two
                    new starters without dropping service levels…
                  </p>
                  <span className="mt-3 inline-block h-4 w-0.5 animate-pulse bg-primary" aria-hidden />
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Back</span>
                  <span className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                    Continue
                  </span>
                </div>

                <p className="mt-6 text-center text-[10px] text-muted-foreground">
                  Responses stay with your organisation · Anonymous options available on 360
                </p>
              </div>
            </Panel>
          </div>

          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Complete the appraisal"
              title="One question at a time — branded for your organisation"
              copy="Employees and reviewers open a clear, modern form: your logo and brand colour, one question per screen, and a calm path from welcome to done. No Word attachment. No lost email thread."
            />
            <ul className="mt-8 space-y-3 text-sm text-foreground">
              {[
                "Organisation logo and brand colour on the respond flow",
                "One question at a time so forms get finished",
                "Self-assessment and manager reviews on the same campaign",
                "Anonymous collection available where you choose it for 360",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-muted-foreground">
              <Link
                href={ROUTES.employeeAppraisalSoftware}
                className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
              >
                Employee appraisal software
              </Link>
              {" · "}
              <Link
                href={ROUTES.appraisalQuestions}
                className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
              >
                Browse appraisal questions
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Back-compat alias */
export const AppraisalSection = CompleteAppraisalSection;
