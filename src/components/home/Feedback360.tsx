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

const competencies = [
  { label: "Communication", value: 88, compare: 72 },
  { label: "Leadership", value: 70, compare: 62 },
  { label: "Collaboration", value: 84, compare: 80 },
  { label: "Decision Making", value: 82, compare: 74 },
  { label: "Development", value: 78, compare: 68 },
];

/**
 * 360 Feedback section — "the strongest visual moment on the page."
 * Shows Self vs Others reporting with competency bars and perspective breakdown.
 */
export function UnderstandResultsSection() {
  return (
    <section id="feedback-360" className="bg-surface/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="360° feedback · planned"
          title="Prepare for more perspectives."
          copy="Multi-rater collection and Self vs Others reporting are planned. This fictional illustration shows the intended direction, not features available in the current app."
          align="center"
        />

        <div className="mt-14 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: 360 subject overview */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Perspectives
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {sources.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-surface p-3">
                    <div className="flex -space-x-1.5">
                      {s.people.map((p, i) => (
                        <span
                          key={p}
                          className={
                            "inline-flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-surface " +
                            (i % 2 === 0
                              ? "bg-primary/12 text-primary"
                              : "bg-warm/20 text-warm-foreground")
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

              {/* Subject card */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  AH
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Amelia Hart</p>
                  <p className="text-[11px] text-muted-foreground">
                    7 of 7 responses · ready to report
                  </p>
                </div>
                <StatusChip status="Complete" />
              </div>
            </div>

            <ul className="space-y-2 px-1 text-sm text-muted-foreground">
              <li>Subject-based 360 with self, manager, peer and direct-report feedback</li>
              <li>Planned anonymity controls; current appraisals are identified</li>
              <li>PDF and CSV exports are planned</li>
            </ul>
          </div>

          {/* Right: 360 report panel */}
          <Panel title="360 report — Amelia Hart" meta="Planned report · fictional example">
            <div className="space-y-5 p-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <StatusChip status="Safe to share" />
                  <StatusChip status="Anonymous" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground">
                  <Download className="size-3" />
                  PDF export · planned
                </span>
              </div>

              {/* Summary scores */}
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

              {/* Competency scores */}
              <div className="space-y-3.5 rounded-xl border border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Competency scores
                </p>
                {competencies.map((c) => (
                  <ScoreBar key={c.label} label={c.label} value={c.value} compare={c.compare} />
                ))}
                <p className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary" /> Others
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-warm" /> Self
                  </span>
                </p>
              </div>

              {/* Peer comment */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">Anonymous peer comment</p>
                  <StatusChip status="Anonymous" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  &ldquo;Amelia is the person everyone goes to when a project stalls. Would like to see her
                  hand over more of the detail work so she has room to lead.&rdquo;
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
