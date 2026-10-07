import Link from "next/link";
import { ArrowRight, ClipboardCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/product/primitives";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const workflowTypes = [
  {
    label: "Employee Appraisals",
    icon: ClipboardCheck,
    description: "Collect identified employee and manager responses in one place. Run annual, mid-year or other review periods with reusable questions and a clear record.",
    href: ROUTES.employeeAppraisalSoftware,
    linkLabel: "Explore employee appraisal software",
  },
  {
    label: "360 Appraisals",
    icon: UsersRound,
    description: "Invite managers, peers and direct reports into an anonymous multi-rater campaign. Release combined feedback after closure to prepare a development conversation.",
    href: ROUTES.feedback360Software,
    linkLabel: "Explore 360 appraisals",
  },
];

export function WorkflowTypesSection() {
  return (
    <section className="border-t border-border bg-surface/40 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading eyebrow="Two focused workflows" title="What would you like to run?" copy="Employee and manager appraisals, or anonymous feedback from a wider circle. Choose the process that fits your review." align="center" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {workflowTypes.map((workflow) => (
            <Link key={workflow.label} href={workflow.href} className="marketing-card group rounded-2xl border border-border bg-card p-7 sm:p-9 hover:border-primary/40">
              <workflow.icon className="size-8 text-primary" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-5 text-2xl font-semibold">{workflow.label}</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">{workflow.description}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:underline">{workflow.linkLabel}<ArrowRight className="size-4" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const homeFaqs = [
  {
    question: "What is appraisal software?",
    answer:
      "Software for running employee appraisal cycles: create forms, send them to the right people, track who has finished, and keep a record of each review.",
  },
  {
    question: "What types of review can we run?",
    answer:
      "You can run annual employee and manager appraisals, and anonymous 360 feedback campaigns for a single subject with multiple reviewers. Reusable question templates keep both workflows consistent.",
  },
  {
    question: "How does 360° feedback work?",
    answer:
      "Create a 360 campaign for one person, invite at least five reviewers, and collect responses through secure personal links. Combined anonymous results unlock after closure once enough reviewers have completed. Free guides and templates help you plan the questions and conversation.",
  },
  {
    question: "Is feedback anonymous?",
    answer:
      "Annual appraisals use identified employee and manager responses. 360 campaigns show combined feedback without reviewer names or response times. Written comments may still identify their author, so explain that before collecting responses.",
  },
];

export function HomeFaqSection() {
  return (
    <section id="faq" className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        {/* 50/50 — heading left, FAQs right */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <SectionHeading
              title="Frequently asked questions"
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Common questions about running appraisals and 360° feedback with Appraisal Software.
            </p>
          </div>
          <dl className="divide-y divide-border border-t border-border">
            {homeFaqs.map((item) => (
              <div key={item.question} className="py-5">
                <dt className="text-[15px] font-semibold text-foreground">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   8. FINAL CTA
   ═══════════════════════════════════════════════════ */

export function FinalCtaSection() {
  return (
    <section className="marketing-contrast px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl py-5 text-center">
        <h2 className="font-display text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[2rem]">
          Your next appraisal cycle
          <br />
          could be this simple.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
          Create the campaign. Send the forms. Collect the responses. Understand the results.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full px-7 sm:w-auto" asChild>
            <a href={PRIMARY_CTA_URL}>
              {PRIMARY_CTA_LABEL}
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
