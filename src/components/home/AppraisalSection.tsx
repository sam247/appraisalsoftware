import Link from "next/link";
import { BrandMark } from "@/components/home/Logo";

import { Panel, SectionHeading } from "@/components/product/primitives";
import { ROUTES } from "@/lib/routes";

/**
 * Annual appraisals section — "Annual appraisals. Minus the annual headache."
 * Shows the branded one-question-at-a-time respondent experience.
 */
export function CompleteAppraisalSection() {
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Product demo */}
          <div className="order-2 lg:order-1">
            <Panel title="Your appraisal" meta="Planned form design · example" className="mx-auto max-w-md lg:max-w-none">
              <div className="relative min-h-[22rem] p-5 sm:p-8">
                {/* Organisation header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BrandMark size={28} />
                    <div>
                      <p className="text-[10px] font-medium text-foreground">appraisal.software</p>
                      <p className="text-[10px] text-muted-foreground">Annual performance review</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Question 3 of 8
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full w-[37.5%] rounded-full bg-primary" />
                </div>

                {/* Question */}
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

                {/* Answer area */}
                <div className="mt-6 rounded-xl border border-border bg-surface/80 p-4">
                  <p className="text-sm leading-relaxed text-foreground/80">
                    Renewals were ahead of target on my two largest accounts, and I onboarded two new
                    starters without dropping service levels…
                  </p>
                  <span
                    className="mt-3 inline-block h-4 w-0.5 animate-pulse bg-primary"
                    aria-hidden
                  />
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Back</span>
                  <span className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                    Continue
                  </span>
                </div>

                <p className="mt-6 text-center text-[10px] text-muted-foreground">
                  Illustrative form design · current responses are identified
                </p>
              </div>
            </Panel>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Annual appraisals"
              title="Annual appraisals. Minus the annual headache."
              copy="Collect employee and manager responses with clear questions. The panel shows a planned form design; the current app uses structured question forms."
            />
            <ul className="mt-8 space-y-3 text-sm text-foreground">
              {[
                "Reusable questions tailored to the review",
                "Employee and manager preparation before the meeting",
                "Self-assessment and manager review on the same campaign",
                "Identified responses in the current appraisal workflow",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
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
