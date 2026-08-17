import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Users,
  ClipboardCheck,
  BarChart3,
  Building2,
  Briefcase,
  UserRound,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow, Panel, SectionHeading, StatusChip } from "@/components/product/primitives";
import { EARLY_ACCESS_URL, DISCLOSURELY_URL } from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Create an appraisal cycle",
    copy: "Name the cycle, set the review period and choose the form you want people to complete.",
  },
  {
    icon: Users,
    title: "Add employees and managers",
    copy: "Put each person in the cycle with the manager who needs to respond.",
  },
  {
    icon: ListChecks,
    title: "Send appraisal or 360° feedback forms",
    copy: "Send the same questions to the right people, including peers or direct reports if you need 360° input.",
  },
  {
    icon: BarChart3,
    title: "Track completion and keep a clean review record",
    copy: "See what is outstanding, send reminders, and keep each appraisal in one place.",
  },
];

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="border-y border-border bg-surface/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
              Four steps, every cycle
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Set up the cycle once. The forms, responses and completion status stay together until
              the review is finished.
            </p>
          </div>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-4.5" />
                </span>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{s.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.copy}</p>
              {i < steps.length - 1 ? (
                <ArrowRight
                  className="absolute top-1/2 -right-3 hidden size-4 -translate-y-1/2 text-border md:block"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const replacements = [
  "Word appraisal forms saved in shared drives",
  "Spreadsheet trackers that go stale mid-cycle",
  "Chasing managers and employees by email",
  "Lost review records from last year",
  "Inconsistent appraisal questions from team to team",
];

export function SpreadsheetSection() {
  return (
    <section id="replaces" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="What it replaces"
              title="The usual annual appraisal admin"
              copy="Most UK teams already know how they want appraisals to work. The problem is the paperwork around them. Appraisal Software replaces the manual process, not your judgement."
            />
            <ul className="mt-8 space-y-3">
              {replacements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ArrowRight className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              See the{" "}
              <Link
                href={ROUTES.annualAppraisalTemplate}
                className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
              >
                annual appraisal template
              </Link>{" "}
              and{" "}
              <Link
                href={ROUTES.appraisalQuestions}
                className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
              >
                appraisal questions
              </Link>{" "}
              if you want a starting point before you set up a cycle.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -top-4 left-3 right-10 rotate-[-3deg] rounded-xl border border-border bg-surface p-3 opacity-70">
              <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <FileSpreadsheet className="size-3.5" />
                appraisals_2026_FINAL_v7.xlsx
              </div>
              <div className="mt-2 space-y-1.5">
                {[70, 45, 88, 30].map((w, i) => (
                  <div key={i} className="h-2 rounded bg-surface-2" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
            <Panel title="Appraisal cycles" meta="2 active" className="relative mt-16">
              <div className="divide-y divide-border">
                {[
                  { name: "Annual appraisals 2026", n: "42 employees", p: 78, s: "In progress" },
                  { name: "360° feedback — Leadership", n: "9 employees", p: 55, s: "In progress" },
                  { name: "Probation reviews Q1", n: "6 employees", p: 100, s: "Complete" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.n}</p>
                    </div>
                    <div className="w-16">
                      <div className="h-1.5 rounded-full bg-surface-2">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${c.p}%` }} />
                      </div>
                    </div>
                    <StatusChip status={c.s as "Complete"} />
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

const features = [
  {
    icon: ClipboardCheck,
    title: "Appraisal cycles",
    copy: "Run an annual review period with a start date, close date and a clear list of who is included.",
  },
  {
    icon: FileText,
    title: "Reusable appraisal forms",
    copy: "Write the questions once and use the same form next year, with small edits if you need them.",
  },
  {
    icon: Users,
    title: "360° feedback",
    copy: "Collect extra input from peers or direct reports when a review needs more than a manager form.",
  },
  {
    icon: UserRound,
    title: "Manager and employee responses",
    copy: "Keep self-assessment and manager comments on the same appraisal record.",
  },
  {
    icon: BarChart3,
    title: "Completion tracking",
    copy: "See who has finished, who has started and who has not opened the form yet.",
  },
  {
    icon: BellRing,
    title: "Email reminders",
    copy: "Send a reminder for outstanding forms instead of writing another chase email.",
  },
  {
    icon: FileSpreadsheet,
    title: "Reporting and export",
    copy: "Pull a readable record of scores, comments and completion for the cycle.",
  },
  {
    icon: ShieldCheck,
    title: "Secure records",
    copy: "Keep appraisal responses in one place rather than scattered across inboxes and shared folders.",
  },
  {
    icon: ListChecks,
    title: "Optional anonymous feedback",
    copy: "Turn anonymity on for 360° responses where people need to speak more freely.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-y border-border bg-surface/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="What you get in an appraisal cycle"
          copy="Enough to run annual appraisals properly. Not a wider HR product around it."
          align="center"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-4.5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.copy}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Read more on{" "}
          <Link
            href={ROUTES.annualAppraisalSoftware}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            annual appraisal software
          </Link>
          ,{" "}
          <Link
            href={ROUTES.employeeAppraisalSoftware}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            employee appraisal software
          </Link>{" "}
          and{" "}
          <Link
            href={ROUTES.feedback360Software}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            360 feedback software
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

const audiences = [
  {
    icon: UserRound,
    title: "HR managers",
    copy: "Run a consistent annual cycle without building a new tracker each year.",
  },
  {
    icon: Briefcase,
    title: "Operations managers",
    copy: "See which reviews are done and which still need a manager response.",
  },
  {
    icon: Building2,
    title: "Business owners",
    copy: "Keep appraisal records without buying a full HR suite for a small team.",
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Who it is for"
          title="Small and growing UK teams"
          copy="Built for organisations that already run appraisals, or know they should, and want a simpler way to do it."
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {audiences.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="size-4.5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          If you want appraisals without buying a full HR suite, this is the intended fit. If you
          need payroll, holidays and recruitment in the same product, look elsewhere.
        </p>
      </div>
    </section>
  );
}

export function DifferentiatorSection() {
  return (
    <section className="pb-20 sm:pb-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="rounded-3xl border border-border bg-surface/70 p-6 sm:p-10 lg:grid lg:grid-cols-2 lg:gap-12 lg:p-12">
          <div>
            <Eyebrow>Why this exists</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
              Not a full HR system. Just a clean way to run appraisal cycles.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Appraisal Software does one job: help UK teams run annual appraisals, employee reviews
              and 360° feedback without spreadsheets, Word forms or email chasing.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Included</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li>Appraisal cycles and forms</li>
                <li>Manager and employee responses</li>
                <li>Completion tracking and reminders</li>
                <li>A record of each review</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Not included
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Payroll or holiday booking</li>
                <li>Recruitment or onboarding</li>
                <li>A wider HR suite to configure</li>
                <li>A complicated performance platform</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const resources = [
  {
    title: "Annual appraisal template",
    copy: "A simple annual appraisal form covering objectives, performance, development and next steps.",
    tag: "Template",
    href: ROUTES.annualAppraisalTemplate,
  },
  {
    title: "Appraisal questions",
    copy: "Practical questions for UK teams, grouped by performance, objectives, strengths and development.",
    tag: "Guide",
    href: ROUTES.appraisalQuestions,
  },
  {
    title: "360° feedback template",
    copy: "Example questions for managers, peers and direct reports, including optional anonymity.",
    tag: "Template",
    href: ROUTES.feedback360Template,
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="border-y border-border bg-surface/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Templates & questions"
          title="Useful whether or not you sign up"
          copy="Start with a form and a question set, then run the same structure in Appraisal Software."
          align="center"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {r.tag}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{r.copy}</p>
              <span className="mt-4 text-xs font-semibold text-primary">Read the page</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PoweredBySection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <p className="text-sm font-semibold text-foreground">
          Appraisal Software is built by{" "}
          <a
            href={DISCLOSURELY_URL}
            className="underline decoration-border underline-offset-2 transition-colors hover:text-primary"
          >
            Disclosurely
          </a>
          .
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          It uses the same secure feedback infrastructure, so appraisal responses, anonymity settings
          and records are handled with the same care.
        </p>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section id="early-access" className="px-5 pb-20 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 px-6 py-14 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 80% at 50% 0%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Request early access
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tell us about your team and the appraisal cycle you want to run. We will set you up when
            it is ready.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full rounded-full px-6 sm:w-auto" asChild>
              <a href={EARLY_ACCESS_URL}>
                Request early access
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-border bg-card px-6 sm:w-auto"
              asChild
            >
              <a href="#features">View appraisal features</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
