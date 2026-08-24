import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  CompletionRing,
  Panel,
  StatusChip,
} from "@/components/product/primitives";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_TRANSITION,
  PRIMARY_CTA_URL,
  SEE_HOW_IT_WORKS_HREF,
  SEE_HOW_IT_WORKS_LABEL,
} from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";

const campaigns = [
  {
    name: "Annual appraisals 2026",
    detail: "42 employees · Closes 30 Jun",
    progress: 78,
    status: "In progress" as const,
    reminders: "12 reminders sent",
  },
  {
    name: "360° feedback — Leadership",
    detail: "9 subjects · 54 reviewers",
    progress: 61,
    status: "In progress" as const,
    reminders: "Due in 5 days",
  },
  {
    name: "Probation reviews Q1",
    detail: "6 employees",
    progress: 100,
    status: "Complete" as const,
    reminders: "Closed",
  },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 grid-bg opacity-[0.3] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-5 pt-14 pb-16 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-positive" aria-hidden />
            Simple annual appraisal software for UK teams
          </span>
          <h1 className={`mt-6 ${marketingType.h1Home}`}>
            Annual Appraisal Software for UK Teams
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${marketingType.lead}`}>
            Run annual appraisals, employee reviews and 360° feedback without spreadsheets,
            paperwork or a heavyweight HR system.
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

        <div className="relative mt-14 sm:mt-16">
          <Panel title="Appraisal campaigns" meta="2 active" className="reveal">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
              <div className="border-b border-border p-4 sm:p-5 lg:border-r lg:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-foreground">Campaign status</h3>
                  <span className="text-[11px] text-muted-foreground">Completion & reminders</span>
                </div>
                <div className="mt-3 divide-y divide-border">
                  {campaigns.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{c.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{c.detail}</p>
                      </div>
                      <div className="hidden w-20 sm:block">
                        <div className="h-1.5 rounded-full bg-surface-2">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                      </div>
                      <StatusChip status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 bg-surface/50 p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <CompletionRing value={78} />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Annual appraisals 2026</p>
                    <p className="mt-1">33 of 42 complete</p>
                    <p className="mt-1">9 outstanding · reminders scheduled</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Next to chase
                  </p>
                  <ul className="mt-2 space-y-2">
                    {[
                      { name: "Daniel Okoye", role: "Manager review due" },
                      { name: "Priya Raman", role: "Self-assessment open" },
                      { name: "Tom Whitfield", role: "Not started" },
                    ].map((row) => (
                      <li key={row.name} className="flex items-center gap-2">
                        <Avatar
                          initials={row.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                          tone={row.name.length}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">{row.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{row.role}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
