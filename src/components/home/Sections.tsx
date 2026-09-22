"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Mail,
  BarChart3,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  Panel,
  SectionHeading,
  StatusChip,
} from "@/components/product/primitives";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
} from "@/lib/links";
import { ROUTES } from "@/lib/routes";

/* ═══════════════════════════════════════════════════
   1. WHAT WOULD YOU LIKE TO RUN? — Interactive selector
   ═══════════════════════════════════════════════════ */

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
    description: "Plan a thoughtful multi-rater review with practical guides, questions, examples and a ready-to-use template.",
    includes: ["Reviewer planning", "Useful 360 questions", "Example feedback", "Ready-to-use template"],
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
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
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

/* ═══════════════════════════════════════════════════
   2. CREATE → SEND → COLLECT → UNDERSTAND
   ═══════════════════════════════════════════════════ */

const workflowSteps = [
  {
    label: "Create",
    icon: ClipboardList,
    description: "Name the campaign, choose a form, set dates, add people.",
    ui: {
      title: "New campaign",
      fields: [
        { label: "Name", value: "Annual Appraisal 2026" },
        { label: "Form", value: "Annual review template" },
        { label: "Opens", value: "1 May 2026" },
        { label: "Closes", value: "30 Jun 2026" },
      ],
      meta: "24 employees added",
      action: "Launch campaign",
    },
  },
  {
    label: "Send",
    icon: Send,
    description: "Employees and managers receive a structured question form.",
    ui: {
      title: "Sending invitations",
      fields: [
        { label: "Recipients", value: "24 employees" },
        { label: "Form", value: "Annual review · 8 questions" },
        { label: "Reviewers", value: "Employee and manager" },
        { label: "Format", value: "Structured questions" },
      ],
      meta: "24 of 24 delivered",
      action: "View sent",
    },
  },
  {
    label: "Collect",
    icon: Mail,
    description: "Track who has finished. Send reminders for the rest.",
    ui: {
      title: "Annual Appraisal 2026",
      fields: [
        { label: "Complete", value: "18 of 24" },
        { label: "In progress", value: "4 employees" },
        { label: "Not started", value: "2 employees" },
        { label: "Next reminder", value: "Monday 10am" },
      ],
      meta: "75% complete",
      action: "Send reminder",
    },
  },
  {
    label: "Understand",
    icon: BarChart3,
    description: "Read employee and manager answers side by side.",
    ui: {
      title: "Campaign results",
      fields: [
        { label: "Responses", value: "24 of 24" },
        { label: "Avg. score", value: "4.1 / 5.0" },
        { label: "Results", value: "Self vs Manager answers" },
        { label: "360 view", value: "Planned addition" },
      ],
      meta: "Complete",
      action: "Review answers",
    },
  },
];

export function WorkflowStepsSection() {
  const [active, setActive] = useState(0);
  const current = workflowSteps[active];

  return (
    <section id="how-it-works" className="bg-surface/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Create. Send. Collect. Understand."
          copy="Four steps from reusable questions to a finished employee and manager appraisal cycle."
          align="center"
        />

        {/* 50/50 — steps left, product panel right */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Left: vertical step selector + description */}
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-1 lg:gap-1">
              {workflowSteps.map((step, i) => (
                <button
                  key={step.label}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                  className={
                    "group flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 text-center transition-all cursor-pointer lg:flex-row lg:gap-3 lg:px-4 lg:text-left " +
                    (i === active
                      ? "bg-primary/[0.06]"
                      : "hover:bg-surface")
                  }
                >
                  <span
                    className={
                      "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all " +
                      (i === active
                        ? "border-primary bg-primary text-primary-foreground"
                        : i < active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground group-hover:border-foreground/20")
                    }
                  >
                    <step.icon className="size-4" />
                  </span>
                  <div className="hidden min-w-0 lg:block">
                    <span
                      className={
                        "text-[13px] font-semibold transition-colors " +
                        (i === active ? "text-foreground" : "text-muted-foreground")
                      }
                    >
                      {step.label}
                    </span>
                    {i === active && (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {current.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      "text-[11px] font-semibold lg:hidden " +
                      (i === active ? "text-primary" : "text-muted-foreground")
                    }
                  >
                    {step.label}
                  </span>
                </button>
              ))}
            </div>
            {/* Mobile-only description */}
            <p className="text-sm leading-relaxed text-muted-foreground lg:hidden">
              {current.description}
            </p>
          </div>

          {/* Right: product panel */}
          <Panel title={current.ui.title} meta={`Illustrative example · ${current.ui.meta}`}>
            <div className="p-5 sm:p-6">
              <div className="space-y-3">
                {current.ui.fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5"
                  >
                    <span className="text-xs text-muted-foreground">{field.label}</span>
                    <span className="text-xs font-medium text-foreground">{field.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                  {current.ui.action}
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   3. POSITIONING — "You don't need another HR system"
   ═══════════════════════════════════════════════════ */

const hrSuiteItems = [
  "Payroll",
  "Recruitment",
  "Absence management",
  "Benefits",
  "Learning",
  "Workforce planning",
  "Performance suite",
  "Appraisals",
];

const appraisalItems = [
  "Appraisals",
  "Employee self-assessments",
  "Manager responses",
];

export function PositioningSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Why this exists"
          title="You don't need another HR system."
          copy="Most appraisal software is buried inside a platform you don't need. We built the appraisal part only."
          align="center"
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {/* Traditional HR suite */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Traditional HR suite
            </p>
            <ul className="mt-5 space-y-2.5">
              {hrSuiteItems.map((item) => (
                <li
                  key={item}
                  className={
                    "flex items-center gap-2.5 text-sm " +
                    (item === "Appraisals"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground/60 line-through decoration-border")
                  }
                >
                  <span
                    className={
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] " +
                      (item === "Appraisals" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40")
                    }
                  >
                    {item === "Appraisals" ? "✓" : "—"}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Appraisal Software */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Appraisal Software
            </p>
            <ul className="mt-5 space-y-2.5">
              {appraisalItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm font-medium text-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
              No payroll. No absence. No recruitment. No configuration maze.
              Just a clean way to run appraisal cycles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   4. CAMPAIGN MANAGEMENT
   ═══════════════════════════════════════════════════ */

const campaignPeople = [
  { name: "Amelia Hart", role: "Team Lead", status: "Complete" as const },
  { name: "Daniel Okoye", role: "Product Manager", status: "Complete" as const },
  { name: "James Cooper", role: "Engineering", status: "In progress" as const },
  { name: "Priya Raman", role: "Marketing", status: "Not started" as const },
];

export function CampaignSection() {
  return (
    <section className="border-t border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Campaign management"
              title="Know who's done and who's not."
              copy="See completion across the whole cycle. Send reminders for outstanding forms instead of chasing by email."
            />
            <ul className="mt-8 space-y-3 text-sm text-foreground">
              {[
                "One view of every employee's status",
                "Configured campaign reminders for outstanding forms",
                "Manager and employee responses on the same record",
                "Read employee and manager answers when responses arrive",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Panel title="Annual Appraisal 2026" meta="Illustrative example">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">24 people</p>
                  <p className="text-[11px] text-muted-foreground">Closes 30 Jun 2026</p>
                </div>
                <StatusChip status="Collecting" />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["18", "Complete"],
                  ["4", "In progress"],
                  ["2", "Not started"],
                ].map(([n, label]) => (
                  <div key={label} className="rounded-lg border border-border p-2.5">
                    <p className="text-lg font-semibold tabular-nums text-foreground">{n}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1">
                {campaignPeople.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        initials={p.name.split(" ").map((n) => n[0]).join("")}
                        tone={p.name.length}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{p.role}</p>
                      </div>
                    </div>
                    <StatusChip status={p.status} />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                <CalendarCheck className="size-3.5 text-primary" />
                <span className="text-[11px] text-muted-foreground">
                  Next reminder: <span className="font-medium text-foreground">Monday</span>
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   5. TEMPLATES
   ═══════════════════════════════════════════════════ */

const templates = [
  {
    name: "Annual Employee Appraisal",
    questions: 8,
    sections: ["Objectives", "Performance", "Development", "Next steps"],
    href: ROUTES.annualAppraisalTemplate,
  },
  {
    name: "Employee Self Assessment",
    questions: 6,
    sections: ["Performance", "Strengths", "Gaps", "Career goals"],
    href: ROUTES.selfAppraisalTemplate,
  },
  {
    name: "Personal Development Plan",
    questions: 7,
    sections: ["Goal", "Practice", "Support", "Progress"],
    href: ROUTES.personalDevelopmentPlanTemplate,
  },
  {
    name: "360 Leadership Feedback",
    questions: 10,
    sections: ["Communication", "Leadership", "Collaboration", "Development"],
    href: ROUTES.feedback360Template,
  },
  {
    name: "Probation Review",
    questions: 5,
    sections: ["Role clarity", "Performance", "Support", "Outcome"],
    href: ROUTES.probationReviewTemplate,
  },
];

export function TemplatesSection() {
  return (
    <section id="templates" className="bg-surface/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Templates"
          title="Start from a template. Reuse it next time."
          copy="Pick a starting form, customise the questions, then use the same structure every cycle."
          align="center"
        />

        <p className="mt-6 text-center text-sm"><Link className="underline underline-offset-4" href="/templates">Browse all free templates</Link></p>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link
              key={t.name}
              href={t.href}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Template
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Copy or print
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{t.name}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.sections.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <span className="mt-4 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Use this template →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   6. PRICING
   ═══════════════════════════════════════════════════ */

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="A focused appraisal product."
          copy="Create an appraisal workspace and start with the focused workflow your team needs."
          align="center"
        />

        {/* 50/50 — text left, card right */}
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Start with reusable questions, collect employee and manager responses, track completion and review both perspectives in one place. The product is designed for teams that want appraisal software without a wider HR suite.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-foreground">
              {[
                "Appraisal campaigns",
                "Employee self-assessments and manager responses",
                "Completion tracking and reminders",
                "Customisable form templates",
                "Self vs Manager results",
                "Structured respondent forms",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-primary/20 bg-card p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Current workflow
            </p>
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
              Employee and manager appraisals.
            </p>
            <div className="my-8 border-t border-border" />
            <p className="text-sm font-semibold text-foreground">Create your workspace</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Set up an account and explore the appraisal workflow.
            </p>
            <Button className="mt-6 w-full" asChild>
              <a href={PRIMARY_CTA_URL}>
                {PRIMARY_CTA_LABEL}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   7. FAQ
   ═══════════════════════════════════════════════════ */

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
      "The current workflow supports employee self-assessments and manager reviews using reusable questions. You can adapt the questions for your review process. Use the 360 guides and templates when you are planning a multi-rater exercise.",
  },
  {
    question: "How does 360° feedback work?",
    answer:
      "A 360 exercise gathers observations from several relationships. Our free guides, questions, examples and templates help you choose reviewers, explain the process and prepare a useful discussion.",
  },
  {
    question: "Is feedback anonymous?",
    answer:
      "Current appraisal campaigns use identified employee and manager responses. For 360 exercises, explain how feedback will be handled before collecting it and remember that comments can identify their author.",
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
          <dl className="space-y-4">
            {homeFaqs.map((item) => (
              <div key={item.question} className="rounded-xl border border-border bg-card p-5">
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
    <section className="px-5 pb-20 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card px-6 py-16 text-center sm:px-12">
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

/* ═══════════════════════════════════════════════════
   LEGACY EXPORTS — kept for any stale imports
   ═══════════════════════════════════════════════════ */

/** @deprecated Use named section exports. */
export const SpreadsheetSection = CampaignSection;
export const WhoItsForSection = WorkflowTypesSection;
export const RunAppraisalSection = WorkflowStepsSection;
export const DifferentiatorSection = PositioningSection;
export const ResourcesSection = TemplatesSection;
export const OwnershipSection = PositioningSection;
export const CtaSection = FinalCtaSection;
export const PoweredBySection = PositioningSection;
