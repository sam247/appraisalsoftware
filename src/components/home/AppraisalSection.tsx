import Link from "next/link";
import { SectionHeading } from "@/components/product/primitives";
import { ROUTES } from "@/lib/routes";
import { RespondentProof } from "@/components/product-marketing/RespondentProof";

/**
 * Annual appraisals section — "Annual appraisals. Minus the annual headache."
 * Shows the branded one-question-at-a-time respondent experience.
 */
export function CompleteAppraisalSection() {
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Reused live respondent form */}
          <div className="order-2 lg:order-1">
            <RespondentProof />
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Annual appraisals"
              title="Annual appraisals. Minus the annual headache."
              copy="Collect employee and manager responses with clear questions in structured respondent forms."
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
