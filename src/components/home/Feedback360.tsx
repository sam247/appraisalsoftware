import { Panel, ScoreBar, SectionHeading, StatusChip } from "@/components/product/primitives";

const sources = [
  { label: "Self", people: ["AH"], note: "1 response" },
  { label: "Manager", people: ["JS"], note: "1 response" },
  { label: "Peers", people: ["PK", "RN", "MC"], note: "3 responses" },
  { label: "Direct reports", people: ["LT", "HW"], note: "2 responses" },
];

export function Feedback360() {
  return (
    <section id="feedback-360" className="relative overflow-hidden bg-surface/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="360° feedback"
          title="Feedback from every direction, in one place"
          copy="Collect input from managers, colleagues, direct reports and the employee themselves — then see it side by side instead of buried in inboxes."
          align="center"
        />

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="relative rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-4">
              {sources.map((s) => (
                <div
                  key={s.label}
                  className="group rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex -space-x-2">
                    {s.people.map((p, i) => (
                      <span
                        key={p}
                        className={
                          "inline-flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-surface group-hover:ring-card " +
                          (i % 2 === 0 ? "bg-primary/15 text-primary" : "bg-warm/25 text-warm-foreground")
                        }
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                AH
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Amelia Hart</p>
                <p className="text-[11px] text-muted-foreground">7 of 7 responses received</p>
              </div>
              <StatusChip status="Complete" />
            </div>
          </div>

          <Panel title="360° feedback report — Amelia Hart" meta="Aggregated · Anonymised peer input">
            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Overall rating
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">4.3</p>
                  <p className="text-[11px] text-muted-foreground">out of 5 · 7 reviewers</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Self vs. others
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">+0.4</p>
                  <p className="text-[11px] text-muted-foreground">Others rate higher than self</p>
                </div>
              </div>
              <div className="space-y-3.5 rounded-xl border border-border p-4">
                <ScoreBar label="Communication" value={88} compare={72} />
                <ScoreBar label="Collaboration" value={84} compare={80} />
                <ScoreBar label="Leadership" value={70} compare={62} />
                <ScoreBar label="Problem solving" value={90} compare={84} />
                <p className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary" /> Reviewer average
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-warm" /> Self-assessment
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">Anonymous peer comment</p>
                  <StatusChip status="Anonymous" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  “Amelia is the person everyone goes to when a project stalls. Would like to see her
                  hand over more of the detail work so she has room to lead.”
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}
