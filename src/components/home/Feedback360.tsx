import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  SectionHeading,
} from "@/components/product/primitives";
import { ROUTES } from "@/lib/routes";

/**
 * 360 resource links. The product release gate remains off, so this surface
 * must not present fictional reporting as an available feature.
 */
export function UnderstandResultsSection() {
  return (
    <section id="feedback-360" className="bg-surface/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="360° feedback resources"
          title="Prepare for a useful 360 review."
          copy="Use clear questions, practical examples and a proportionate process when you need feedback from more than one perspective."
          align="center"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ROUTES.feedback360Guide, "Understand 360 feedback", "Learn what the process is for and where privacy needs careful explanation."],
            [ROUTES.feedback360Questions, "Choose useful questions", "Use behaviour-focused prompts for different reviewer relationships."],
            [ROUTES.feedback360Examples, "See example feedback", "Use fictional comments and themes to prepare the review conversation."],
            [ROUTES.feedback360Template, "Start with a template", "Copy or print a practical 360 feedback form for your own process."],
          ].map(([href, title, copy]) => (
            <Link key={href} href={href} className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Explore resource <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          The current product focuses on annual employee and manager appraisals.{" "}
          <Link href={ROUTES.annualAppraisalSoftware} className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary">
            See annual appraisal software
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Back-compat alias */
export const Feedback360 = UnderstandResultsSection;
