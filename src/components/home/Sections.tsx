"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/product/primitives";
import { PRIMARY_CTA_LABEL, PRIMARY_CTA_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const workflowTypes = [
  {
    label: "Annual Appraisal",
    description: "A yearly review between employee and manager. Set objectives, review performance, agree development goals.",
    includes: ["Objectives review", "Performance feedback", "Development goals", "Manager comments"],
    href: ROUTES.annualAppraisalSoftware,
    linkLabel: "Annual appraisal software",
  },
  {
    label: "360° Feedback",
    description: "Invite managers, peers and direct reports into an anonymous multi-rater campaign, then release combined feedback after closure.",
    includes: ["Subject and reviewers", "Anonymous collection", "Reusable questions", "Combined results after close"],
    href: ROUTES.feedback360Software,
    linkLabel: "360 feedback software",
  },
  {
    label: "Self Assessment",
    description: "Employees reflect on their own performance before the review meeting. Paired with manager feedback.",
    includes: ["Employee reflection", "Objective review", "Strengths and gaps", "Paired with manager"],
    href: ROUTES.employeeAppraisalSoftware,
    linkLabel: "Employee appraisal software",
  },
  {
    label: "Employee Feedback",
    description: "Run a structured employee and manager appraisal with reusable questions and a clear record of the review.",
    includes: ["Employee reflection", "Manager response", "Completion tracking", "Review record"],
    href: ROUTES.employeeAppraisalSoftware,
    linkLabel: "Employee appraisal software",
  },
  {
    label: "Probation Review",
    description: "Use a focused probation review template to structure the conversation and agree practical next steps.",
    includes: ["Probation-specific form", "Role expectations", "Manager observations", "Next steps"],
    href: ROUTES.probationReviewTemplate,
    linkLabel: "Probation review template",
  },
];

export function WorkflowTypesSection() {
  const [active, setActive] = useState(0);
  const current = workflowTypes[active];

  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Flexible"
          title="What would you like to run?"
          copy="Some teams still stitch appraisals together from Word documents, PDFs, spreadsheets and email. Choose a focused workflow, then keep questions, responses and completion in one place."
          align="center"
        />

        <noscript><div className="mt-6 space-y-4">{workflowTypes.slice(1).map((workflow) => <p key={workflow.label}><Link className="underline" href={workflow.href}>{workflow.label}</Link>: {workflow.description}</p>)}</div></noscript>
        {/* 50/50 — vertical selector left, content right */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.5fr] lg:items-start lg:gap-12">
          {/* Left: selector tabs */}
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {workflowTypes.map((wt, i) => (
              <button
                key={wt.label}
                aria-pressed={i === active}
                  onClick={() => setActive(i)}
                className={
                  "rounded-lg border px-4 py-2.5 text-left text-[13px] font-medium transition-all cursor-pointer lg:w-full lg:px-4 lg:py-3 " +
                  (i === active
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/15 hover:text-foreground")
                }
              >
                {wt.label}
              </button>
            ))}
          </div>

          {/* Right: content card */}
          <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8">
            <p className="text-[15px] leading-relaxed text-foreground">
              {current.description}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {current.includes.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href={current.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {current.linkLabel}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
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
    question: "Can we run appraisals without a full HR system?",
    answer:
      "Yes. Appraisal Software focuses on employee and manager appraisals. No payroll, no absence management and no recruitment. If you already know how your appraisals should work, this is the process around them.",
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
  {
    question: "Who is this for?",
    answer:
      "UK organisations that already run appraisals — or know they should — and want a simpler way to do it. Especially owners, managers and small HR teams seeking a focused review process.",
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
