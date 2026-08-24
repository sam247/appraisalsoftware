import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  Briefcase,
  CalendarClock,
  FileSpreadsheet,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  Eyebrow,
  Panel,
  SectionHeading,
  StatusChip,
} from "@/components/product/primitives";
import {
  DISCLOSURELY_URL,
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_TRANSITION,
  PRIMARY_CTA_URL,
  PRODUCT_PAGE_URL,
  SEE_HOW_IT_WORKS_HREF,
  SEE_HOW_IT_WORKS_LABEL,
} from "@/lib/links";
import { ROUTES } from "@/lib/routes";

const replacements = [
  "Word appraisal forms saved in shared drives",
  "Spreadsheet trackers that go stale mid-cycle",
  "Chasing managers and employees by email",
  "Lost review records from last year",
  "Inconsistent questions from team to team",
];

export function SpreadsheetSection() {
  return (
    <section id="replaces" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="The problem"
              title="The usual annual appraisal admin"
              copy="Most UK teams already know how they want appraisals to work. The friction is the paperwork around them — not the conversation itself."
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
              Prefer a starting form first? See the{" "}
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
              </Link>
              .
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
            <Panel title="Replaced by campaigns" meta="Live" className="relative mt-16">
              <div className="divide-y divide-border">
                {[
                  { name: "Annual appraisals 2026", n: "42 employees", p: 78, s: "In progress" as const },
                  { name: "360° — Leadership", n: "9 subjects", p: 55, s: "In progress" as const },
                  { name: "Probation reviews Q1", n: "6 employees", p: 100, s: "Complete" as const },
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
                    <StatusChip status={c.s} />
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

const audiences = [
  {
    icon: UserRound,
    title: "HR managers",
    copy: "Run a consistent annual cycle without rebuilding a tracker each year.",
  },
  {
    icon: Briefcase,
    title: "Operations managers",
    copy: "See which reviews are done and which still need a response.",
  },
  {
    icon: Building2,
    title: "Business owners",
    copy: "Keep appraisal records without buying a full HR suite for a small team.",
  },
];

export function WhoItsForSection() {
  return (
    <section id="who-its-for" className="border-y border-border bg-surface/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Who it is for"
          title="Small and growing UK teams"
          copy="Built for organisations that already run appraisals — or know they should — and want a simpler way to do it."
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {audiences.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-4.5" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          If you want appraisals without a full HR suite, this is the fit. If you need payroll,
          holidays and recruitment in the same product, look elsewhere.
        </p>
      </div>
    </section>
  );
}

const runPoints = [
  {
    icon: CalendarClock,
    title: "Set up the campaign",
    copy: "Name the cycle, pick the form, set open and close dates.",
  },
  {
    icon: Users,
    title: "Add recipients",
    copy: "Include employees, managers and — for 360 — the right reviewers.",
  },
  {
    icon: BellRing,
    title: "Track and remind",
    copy: "Watch completion, send reminders, and close the cycle cleanly.",
  },
];

export function RunAppraisalSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Run the appraisal"
              title="Campaigns, recipients, scheduling and reminders"
              copy="Create an appraisal or 360 campaign once. Everyone gets the right form, completion stays visible, and reminders replace the chase email."
            />
            <ul className="mt-8 space-y-5">
              {runPoints.map((point) => (
                <li key={point.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <point.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{point.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{point.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-muted-foreground">
              <Link
                href={ROUTES.annualAppraisalSoftware}
                className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
              >
                How annual appraisal software works
              </Link>
            </p>
          </div>
          <Panel title="Annual appraisals 2026" meta="In progress">
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">42 employees</p>
                  <p className="text-[11px] text-muted-foreground">Opens 1 May · Closes 30 Jun</p>
                </div>
                <StatusChip status="In progress" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["33", "Complete"],
                  ["6", "In progress"],
                  ["3", "Not started"],
                ].map(([n, label]) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <p className="text-lg font-semibold tabular-nums text-foreground">{n}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">Automated reminders</p>
                  <BellRing className="size-3.5 text-primary" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Outstanding respondents get a reminder before the close date — without another
                  spreadsheet chase.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Amelia Hart", status: "Complete" as const },
                  { name: "Daniel Okoye", status: "In progress" as const },
                  { name: "Tom Whitfield", status: "Not started" as const },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        initials={row.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      />
                      <span className="text-xs font-medium text-foreground">{row.name}</span>
                    </div>
                    <StatusChip status={row.status} />
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

export function DifferentiatorSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="rounded-2xl border border-border bg-surface/70 p-6 sm:p-10 lg:grid lg:grid-cols-2 lg:gap-12 lg:p-12">
          <div>
            <Eyebrow>Why this exists</Eyebrow>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Not a full HR system. Just a clean way to run appraisal cycles.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Appraisal Software does one job: help UK teams run annual appraisals, employee reviews
              and 360° feedback without spreadsheets, Word forms or email chasing.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Included</p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                <li>Appraisal and 360 campaigns</li>
                <li>Branded one-question forms</li>
                <li>Completion tracking and reminders</li>
                <li>Self vs Others reporting</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
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
          title="Useful whether or not you book a walkthrough"
          copy="Start with a form and a question set, then run the same structure in Appraisal Software."
          align="center"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <Link
              key={r.title}
              href={r.href}
              className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="w-fit rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
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

export function OwnershipSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <Eyebrow>Who makes it</Eyebrow>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Built and hosted by Disclosurely
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          AppraisalSoftware.co.uk is the specialist acquisition site for annual appraisals and 360°
          feedback. The product itself lives inside{" "}
          <a
            href={DISCLOSURELY_URL}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            Disclosurely
          </a>
          — a UK-focused employee integrity platform — with privacy-conscious feedback collection,
          organisation branding, and controlled reporting.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          <a
            href={PRODUCT_PAGE_URL}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            See Appraisals on Disclosurely
          </a>
        </p>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section id="walkthrough" className="px-5 pb-20 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-6 py-14 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 80% at 50% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to run your next appraisal cycle?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Book a walkthrough and we will show you campaign setup, the respondent experience and
            reporting for your team.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full px-6 sm:w-auto" asChild>
              <a href={PRIMARY_CTA_URL}>
                {PRIMARY_CTA_LABEL}
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-border bg-card px-6 sm:w-auto"
              asChild
            >
              <a href={SEE_HOW_IT_WORKS_HREF}>{SEE_HOW_IT_WORKS_LABEL}</a>
            </Button>
          </div>
          <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            {PRIMARY_CTA_TRANSITION}
          </p>
        </div>
      </div>
    </section>
  );
}

/** @deprecated Prefer OwnershipSection — kept name alias for any leftover imports */
export const PoweredBySection = OwnershipSection;
