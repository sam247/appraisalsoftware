import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AvatarStack,
  CompletionRing,
  Panel,
  ScoreBar,
  StatusChip,
  Avatar,
} from "@/components/product/primitives";
import { DISCLOSURELY_START_FREE } from "@/lib/links";

const rows: {
  name: string;
  role: string;
  reviewers: string[];
  status: "Complete" | "In progress" | "Not started";
  progress: number;
}[] = [
  {
    name: "Amelia Hart",
    role: "Senior Designer",
    reviewers: ["JS", "PK", "RN", "AH"],
    status: "Complete",
    progress: 100,
  },
  {
    name: "Daniel Okoye",
    role: "Account Manager",
    reviewers: ["MC", "LT", "DO"],
    status: "In progress",
    progress: 66,
  },
  {
    name: "Priya Raman",
    role: "Team Lead",
    reviewers: ["SB", "HW", "PR", "TN"],
    status: "In progress",
    progress: 45,
  },
  {
    name: "Tom Whitfield",
    role: "Operations",
    reviewers: ["GR", "TW"],
    status: "Not started",
    progress: 0,
  },
  {
    name: "Sofia Marek",
    role: "Customer Success",
    reviewers: ["DO", "JS", "SM"],
    status: "Complete",
    progress: 100,
  },
  {
    name: "Idris Bello",
    role: "Finance Analyst",
    reviewers: ["KP", "IB"],
    status: "In progress",
    progress: 80,
  },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 pt-14 pb-16 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="reveal mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-positive" aria-hidden />
            Appraisals & 360° feedback for UK teams
          </span>
          <h1 className="mt-6 text-4xl font-semibold text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
            Employee Appraisal Software Built for Better Feedback
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Run appraisal cycles, employee reviews, 360° feedback and structured performance reviews
            without spreadsheets or complicated HR systems.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full rounded-full px-6 sm:w-auto" asChild>
              <a href={DISCLOSURELY_START_FREE}>
                Start your first cycle free
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full border-border bg-card px-6 sm:w-auto"
              asChild
            >
              <a href="#product">
                <Play className="size-4" />
                See how it works
              </a>
            </Button>
          </div>
        </div>

        <div className="relative mt-14 sm:mt-16">
          <Panel
            title="Mid-year appraisal cycle 2026"
            meta="Review period: Jan – Jun 2026 · 42 employees"
            className="reveal"
          >
            <div className="grid gap-0 lg:grid-cols-[1.55fr_1fr]">
              <div className="border-b border-border p-4 sm:p-5 lg:border-r lg:border-b-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Employees & reviewers</h3>
                  <span className="text-[11px] text-muted-foreground">Sorted by progress</span>
                </div>
                <div className="mt-3 divide-y divide-border">
                  {rows.map((r) => (
                    <div key={r.name} className="flex items-center gap-3 py-3">
                      <Avatar
                        initials={r.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                        tone={r.name.length}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">{r.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{r.role}</p>
                      </div>
                      <div className="hidden sm:block">
                        <AvatarStack people={r.reviewers} />
                      </div>
                      <div className="w-14 shrink-0">
                        <div className="h-1.5 rounded-full bg-surface-2">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${r.progress}%` }}
                          />
                        </div>
                      </div>
                      <StatusChip status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-5 bg-surface/60 p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  <CompletionRing value={78} />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">124 of 159 reviews</p>
                    <p className="mt-1">35 outstanding</p>
                    <p className="mt-1">Closes 30 June</p>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rating averages
                  </p>
                  <ScoreBar label="Communication" value={86} />
                  <ScoreBar label="Collaboration" value={78} />
                  <ScoreBar label="Ownership" value={64} />
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Feedback themes
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Clear communicator", "Supportive of peers", "Wants more direction", "Strong delivery"].map(
                      (t) => (
                        <span
                          key={t}
                          className="rounded-full bg-surface-2 px-2 py-1 text-[10px] font-medium text-foreground"
                        >
                          {t}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
