import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  Panel,
  StatusChip,
} from "@/components/product/primitives";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_URL,
  SEE_HOW_IT_WORKS_HREF,
  SEE_HOW_IT_WORKS_LABEL,
} from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";

const participants = [
  { name: "Sarah Mitchell", role: "Account Manager", status: "Complete" as const },
  { name: "James Cooper", role: "Engineering", status: "In progress" as const },
  { name: "Priya Raman", role: "Marketing", status: "Not started" as const },
  { name: "Daniel Okoye", role: "Operations", status: "Complete" as const },
  { name: "Tom Whitfield", role: "Finance", status: "Complete" as const },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24 lg:pt-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        {/* Copy block */}
        <div className="reveal mx-auto max-w-[42rem] text-center">
          <h1 className={marketingType.h1Home}>
            Appraisals without
            <br className="hidden sm:block" />
            {" "}the HR system.
          </h1>
          <p className={`mx-auto mt-5 max-w-lg ${marketingType.lead}`}>
            Run annual appraisals, self-assessments and 360° feedback in one simple place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full px-7 sm:w-auto" asChild>
              <a href={PRIMARY_CTA_URL}>
                {PRIMARY_CTA_LABEL}
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full px-7 sm:w-auto"
              asChild
            >
              <a href={SEE_HOW_IT_WORKS_HREF}>{SEE_HOW_IT_WORKS_LABEL}</a>
            </Button>
          </div>
        </div>

        {/* Product demo — realistic campaign overview */}
        <div className="reveal relative mx-auto mt-16 max-w-4xl sm:mt-20" style={{ animationDelay: "0.15s" }}>
          <Panel title="Annual Appraisal 2026" meta="Live">
            {/* App nav — real software feel */}
            <div className="flex items-center gap-1 border-b border-border px-4 sm:px-6">
              {["Campaigns", "People", "Templates", "Results"].map((tab, i) => (
                <span
                  key={tab}
                  className={
                    "border-b-2 px-3 py-2.5 text-[11px] font-medium transition-colors " +
                    (i === 0
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground")
                  }
                >
                  {tab}
                </span>
              ))}
            </div>
            <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
              {/* Left: campaign overview */}
              <div className="border-b border-border p-5 sm:p-6 lg:border-r lg:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">24 employees</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Opens 1 May · Closes 30 Jun 2026
                    </p>
                  </div>
                  <StatusChip status="Collecting" />
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">75% complete</span>
                    <span className="text-[11px] text-muted-foreground">18 of 24</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full w-[75%] rounded-full bg-primary" />
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { n: "18", label: "Completed", color: "text-positive-foreground" },
                    { n: "4", label: "In progress", color: "text-warm-foreground" },
                    { n: "2", label: "Not started", color: "text-muted-foreground" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border p-2.5 text-center">
                      <p className={`text-lg font-semibold tabular-nums ${stat.color}`}>{stat.n}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Next reminder */}
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                  <span className="text-[11px] text-muted-foreground">
                    Next reminder: <span className="font-medium text-foreground">Monday 10am</span>
                  </span>
                </div>
              </div>

              {/* Right: participant list */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-foreground">Recent activity</p>
                  <span className="text-[10px] text-muted-foreground">5 of 24</span>
                </div>
                <div className="mt-3 space-y-1">
                  {participants.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          initials={p.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
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
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
