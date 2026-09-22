import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  SectionHeading,
} from "@/components/product/primitives";
import { Button } from "@/components/ui/button";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
} from "@/lib/links";
import { ROUTES } from "@/lib/routes";

/**
 * Homepage 360 section — live anonymous multi-rater campaigns, with free
 * guides and templates as supporting preparation material.
 */
export function UnderstandResultsSection() {
  return (
    <section id="feedback-360" className="bg-surface/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="360° feedback"
          title="Gather anonymous feedback from the people who see the work."
          copy="Invite managers, peers and direct reports into one campaign. Responses stay anonymous to your organisation until enough reviewers have completed and the campaign is closed."
          align="center"
        />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <a href={PRIMARY_CTA_URL}>{PRIMARY_CTA_LABEL}</a>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.feedback360Software}>
              See 360 feedback software
            </Link>
          </Button>
        </div>

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
      </div>
    </section>
  );
}

/** Back-compat alias */
export const Feedback360 = UnderstandResultsSection;
