import {
  ArrowRight,
  BellRing,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Sparkles,
  Users,
  ClipboardCheck,
  BarChart3,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarStack,
  CompletionRing,
  Eyebrow,
  Panel,
  ScoreBar,
  SectionHeading,
  StatusChip,
} from "@/components/product/primitives";
import { DISCLOSURELY_START_FREE, DISCLOSURELY_URL } from "@/lib/links";

export function SpreadsheetSection() {
  return (
    <section id="product" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="No more admin"
              title="Appraisals without the spreadsheet administration"
              copy="Replace appraisal spreadsheets, Word forms, email chasing and scattered feedback with one simple appraisal process. Set the cycle up once and every form, reviewer and response stays in the same place."
            />
            <ul className="mt-8 space-y-3">
              {[
                "One record per employee, per review period",
                "Automatic reminders for outstanding reviews",
                "Reusable forms so every cycle starts ready",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ArrowRight className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
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
                  { name: "Mid-year appraisals 2026", n: "42 employees", p: 78, s: "In progress" },
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

const steps = [
  {
    icon: ClipboardCheck,
    title: "Create appraisal",
    copy: "Pick a form, set the review period and name the cycle.",
  },
  {
    icon: Users,
    title: "Invite participants",
    copy: "Send forms to teams and groups, with scheduled reminders as needed.",
  },
  {
    icon: ListChecks,
    title: "Collect feedback",
    copy: "Everyone completes their part, with reminders as needed.",
  },
  {
    icon: BarChart3,
    title: "Review results",
    copy: "Scores, comments and themes gathered into one report.",
  },
];

export function WorkflowSection() {
  return (
    <section className="border-y border-border bg-surface/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
              Four steps, every cycle
            </h2>
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

export function FormsSection() {
  return (
    <section className="pt-20 pb-10 sm:pt-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Running a cycle"
          title="Run every appraisal cycle from one place"
          copy="Set up the forms you reuse each period, then follow progress until every review is in."
          align="center"
        />
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Panel title="Form library" meta="6 templates">
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {[
                ["Annual appraisal", "12 questions · 5 competencies"],
                ["360° feedback", "9 questions · anonymous peers"],
                ["Probation review", "7 questions · 3 competencies"],
                ["Quarterly check-in", "5 questions"],
              ].map(([name, meta]) => (
                <div
                  key={name}
                  className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <FileText className="size-4 text-primary" />
                  <p className="mt-3 text-xs font-semibold text-foreground">{name}</p>
                  <p className="text-[11px] text-muted-foreground">{meta}</p>
                </div>
              ))}
              <div className="rounded-xl border border-dashed border-border p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-foreground">Question set: Leadership</p>
                <div className="mt-3 space-y-2">
                  {[
                    "How effectively does this person set direction?",
                    "How well do they develop the people around them?",
                    "How do they handle difficult conversations?",
                  ].map((q) => (
                    <p
                      key={q}
                      className="rounded-lg bg-surface px-3 py-2 text-[11px] text-muted-foreground"
                    >
                      {q}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
          <div className="lg:order-first">
            <SectionHeading
              eyebrow="Forms & questions"
              title="Reusable appraisal forms and question sets"
              copy="Build the questions and competencies your organisation actually uses, save them as templates and reuse them across teams and review periods. Adjust once and every future cycle picks it up."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrackingSection() {
  return (
    <section className="pt-10 pb-20 sm:pb-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Tracking"
              title="Always know what's outstanding"
              copy="See completion at a glance across the whole cycle, drill into who hasn't responded yet, and send a polite nudge without writing another follow-up email."
            />
          </div>
          <Panel title="Outstanding reviews" meta="35 of 159 remaining">
            <div className="flex items-center gap-5 border-b border-border p-5">
              <CompletionRing value={78} size={84} />
              <div className="grid flex-1 grid-cols-2 gap-3 text-xs">
                {[
                  ["124", "Completed"],
                  ["21", "In progress"],
                  ["14", "Not started"],
                  ["3", "Overdue"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-lg border border-border bg-surface px-3 py-2">
                    <p className="text-base font-semibold tabular-nums text-foreground">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "Rachel Nolan", ctx: "Peer review · Amelia Hart", status: "Not started" },
                { name: "Gareth Rees", ctx: "Manager review · Tom Whitfield", status: "In progress" },
                { name: "Hannah Wells", ctx: "Direct report · Priya Raman", status: "Not started" },
              ].map(({ name, ctx, status }) => (
                <div key={name} className="flex items-center gap-3 p-4">
                  <Avatar
                    initials={name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                    tone={name.length}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{ctx}</p>
                  </div>
                  <StatusChip status={status as "Complete"} />
                  <button className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary">
                    <BellRing className="size-3" />
                    Nudge
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

export function ReportsSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Reports & AI themes"
          title="Feedback brought together into something readable"
          copy="Scores, written comments and 360° input are combined into a single report — with AI-assisted themes that summarise what reviewers actually said."
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel title="Team report — Client Services" meta="Mid-year 2026">
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["4.1", "Team average"],
                  ["+0.3", "vs. last cycle"],
                  ["96%", "Participation"],
                ].map(([n, l]) => (
                  <div key={l} className="rounded-xl border border-border bg-surface p-3">
                    <p className="text-xl font-semibold tabular-nums text-foreground">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3.5 rounded-xl border border-border p-4">
                <ScoreBar label="Communication" value={86} />
                <ScoreBar label="Collaboration" value={81} />
                <ScoreBar label="Ownership" value={69} />
                <ScoreBar label="Development of others" value={58} />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <AvatarStack people={["AH", "DO", "PR", "TW", "GR"]} />
                <p className="text-[11px] text-muted-foreground">
                  14 employees · 61 reviews included
                </p>
              </div>
            </div>
          </Panel>
          <Panel title="AI feedback themes" meta="Generated from 61 responses">
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
                <Sparkles className="size-4 text-primary" />
                <p className="text-[11px] text-muted-foreground">
                  Summarised from written feedback. Always reviewed by a human before sharing.
                </p>
              </div>
              {[
                ["Strength", "Responsiveness to clients", "Mentioned in 38 of 61 responses"],
                ["Strength", "Willingness to help colleagues", "Mentioned in 29 responses"],
                ["Theme", "Clearer priorities wanted", "Mentioned in 17 responses"],
                ["Development", "More coaching for new starters", "Mentioned in 11 responses"],
              ].map(([tag, title, meta]) => (
                <div key={title} className="rounded-xl border border-border p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {tag}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{meta}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

export function AnonymousSection() {
  return (
    <section className="pb-20 sm:pb-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid items-center gap-8 rounded-3xl border border-border bg-surface/70 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Anonymity</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
              Anonymous feedback where it&apos;s appropriate
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Choose whether responses are attributed or anonymous, with settings to help protect
              respondent identity in shared reports.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            {[
              "“Gives really clear briefs — easiest person here to work with.”",
              "“Sometimes takes on too much rather than delegating.”",
            ].map((c) => (
              <div key={c} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
                    <EyeOff className="size-3" />
                  </span>
                  <span className="text-[11px] font-semibold text-foreground">Direct report</span>
                  <StatusChip status="Anonymous" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const resources = [
  {
    title: "360° Feedback Question Generator",
    copy: "Build a question set for any role in a couple of clicks.",
    tag: "Tool",
  },
  {
    title: "Employee Appraisal Template",
    copy: "A structured appraisal form you can use this cycle.",
    tag: "Template",
  },
  {
    title: "360° Feedback Template",
    copy: "Manager, peer, direct report and self questions.",
    tag: "Template",
  },
  {
    title: "Appraisal Questions",
    copy: "Example questions by competency and seniority.",
    tag: "Guide",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="border-y border-border bg-surface/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Free tools & resources"
          title="Useful whether or not you sign up"
          copy="Practical templates and tools for anyone running appraisals or 360° feedback."
          align="center"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((r) => (
            <div
              key={r.title}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {r.tag}
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">{r.title}</p>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{r.copy}</p>
              <span className="mt-4 text-xs font-semibold text-muted-foreground">Coming soon</span>
            </div>
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
          It runs on the same secure feedback infrastructure, so appraisal responses, anonymity
          settings and records are handled with the same care.
        </p>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section id="pricing" className="px-5 pb-20 lg:px-8">
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
            Start your first appraisal cycle
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Set up a review period, invite participants and see the reports for yourself on
            Disclosurely.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full rounded-full px-6 sm:w-auto" asChild>
              <a href={DISCLOSURELY_START_FREE}>
                Start free
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-border bg-card px-6 sm:w-auto"
              asChild
            >
              <a href="#product">See how it works</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
