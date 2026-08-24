import Link from "next/link";
import { Download } from "lucide-react";

import {
  Panel,
  ScoreBar,
  SectionHeading,
  StatusChip,
} from "@/components/product/primitives";
import { ROUTES } from "@/lib/routes";

const sources = [
  { label: "Self", people: ["AH"], note: "1 response" },
  { label: "Manager", people: ["JS"], note: "1 response" },
  { label: "Peers", people: ["PK", "RN", "MC"], note: "3 responses" },
  { label: "Direct reports", people: ["LT", "HW"], note: "2 responses" },
];

/**
 * Understand the results — reporting, 360 Self vs Others, privacy, downloads.
 */
export function UnderstandResultsSection() {
  return (
    <section id="feedback-360" className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Understand the results"
          title="Clear reporting — including 360 Self vs Others"
          copy="See completion, competency or area scores, and how self-assessment compares with feedback from others. Share only what is safe to share."
          align="center"
        />

        <div className="mt-14 grid items-start gap-8 lg:grid-cols-[0.95fr_1.15fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                360 subject
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {sources.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex -space-x-2">
                      {s.people.map((p, i) => (
                        <span
                          key={p}
                          className={
                            "inline-flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-surface " +
                            (i % 2 === 0
                              ? "bg-primary/15 text-primary"
                              : "bg-warm/25 text-warm-foreground")
                          }
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  AH
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Amelia Hart</p>
                  <p className="text-[11px] text-muted-foreground">7 of 7 responses · ready to report</p>
                </div>
                <StatusChip status="Complete" />
              </div>
            </div>
            <ul className="space-y-2 px-1 text-sm text-muted-foreground">
              <li>Subject-based 360 with self, manager, peer and direct-report relationships</li>
              <li>Anonymous-by-default collection where you choose it</li>
              <li>PDF and CSV export from privacy-filtered results</li>
            </ul>
          </div>

          <Panel title="360 report — Amelia Hart" meta="Aggregated">
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <StatusChip status="Safe to share" />
                  <StatusChip status="Anonymous" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  <Download className="size-3" />
                  Download PDF
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Overall
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">4.3</p>
                  <p className="text-[11px] text-muted-foreground">out of 5 · 7 reviewers</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Self vs Others
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">+0.4</p>
                  <p className="text-[11px] text-muted-foreground">Others rate higher than self</p>
                </div>
              </div>

              <div className="space-y-3.5 rounded-xl border border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Area scores
                </p>
                <ScoreBar label="Communication" value={88} compare={72} />
                <ScoreBar label="Collaboration" value={84} compare={80} />
                <ScoreBar label="Leadership" value={70} compare={62} />
                <ScoreBar label="Problem solving" value={90} compare={84} />
                <p className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary" /> Others
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-warm" /> Self
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
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

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link
            href={ROUTES.feedback360Software}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            360 feedback software
          </Link>
          {" · "}
          <Link
            href={ROUTES.feedback360Template}
            className="font-medium text-foreground underline decoration-border underline-offset-2 hover:text-primary"
          >
            360 feedback template
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Back-compat alias */
export const Feedback360 = UnderstandResultsSection;
