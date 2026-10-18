import type { Dimension, Insight, Scores } from "@/lib/reports/insights";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  Eye,
  Lightbulb,
  Scale,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

export interface RadarSeries {
  name: string;
  scores: Scores;
  /** "self" draws ink, "manager" draws the brand colour, "group" a soft fill. */
  tone: "self" | "manager" | "group";
}

const TONES = {
  self: { stroke: "var(--foreground)", fill: "color-mix(in oklab, var(--foreground) 8%, transparent)", dash: "4 3" },
  manager: { stroke: "var(--primary)", fill: "color-mix(in oklab, var(--primary) 18%, transparent)", dash: undefined },
  group: { stroke: "var(--primary)", fill: "color-mix(in oklab, var(--primary) 22%, transparent)", dash: undefined },
} as const;

function wrap(label: string, width = 14): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  if (lines.length > 2) return [lines[0], `${lines[1].slice(0, width - 1)}…`];
  return lines;
}

/** Radar for 3–10 dimensions with any number of overlaid series. */
export function RadarChart({
  dimensions,
  series,
  size = 340,
  title,
}: {
  dimensions: Dimension[];
  series: RadarSeries[];
  size?: number;
  title: string;
}) {
  const n = dimensions.length;
  if (n < 3 || n > 10) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.3;
  const point = (i: number, ratio: number) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = Math.min(1, Math.max(0, ratio)) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const rings = [0.2, 0.4, 0.6, 0.8, 1];
  const describe = series
    .map((s) => `${s.name}: ${dimensions.map((d) => `${d.label} ${s.scores[d.key] ?? "no rating"}`).join(", ")}`)
    .join(". ");

  return (
    <figure className="m-0">
      <svg viewBox={`-60 0 ${size + 120} ${size}`} className="mx-auto h-auto w-full max-w-[460px]" role="img" aria-label={`${title}. ${describe}`}>
        {rings.map((r) => (
          <polygon
            key={r}
            points={Array.from({ length: n }, (_, i) => {
              const p = point(i, r);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill={r === 1 ? "var(--surface)" : "none"}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {dimensions.map((_, i) => {
          const tip = point(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="var(--border)" strokeWidth={1} />;
        })}
        {series.map((s) => {
          const tone = TONES[s.tone];
          const pts = dimensions.map((d, i) => {
            const v = s.scores[d.key];
            return point(i, v == null ? 0 : v / d.max);
          });
          return (
            <g key={s.name}>
              <polygon
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill={tone.fill}
                stroke={tone.stroke}
                strokeWidth={2}
                strokeDasharray={tone.dash}
                strokeLinejoin="round"
              />
              {pts.map((p, i) =>
                s.scores[dimensions[i].key] == null ? null : (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill={tone.stroke} />
                ),
              )}
            </g>
          );
        })}
        {dimensions.map((d, i) => {
          const tip = point(i, 1.22);
          const lines = wrap(d.label);
          const anchor = Math.abs(tip.x - cx) < 8 ? "middle" : tip.x > cx ? "start" : "end";
          return (
            <text key={d.key} x={tip.x} y={tip.y - (lines.length - 1) * 6} textAnchor={anchor} dominantBaseline="middle" fill="var(--muted-foreground)" style={{ fontSize: 11 }}>
              {lines.map((line, j) => (
                <tspan key={j} x={tip.x} dy={j === 0 ? 0 : 12}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
      {series.length > 1 && (
        <figcaption className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden>
                <line x1="0" y1="3" x2="18" y2="3" stroke={TONES[s.tone].stroke} strokeWidth="2" strokeDasharray={TONES[s.tone].dash} />
              </svg>
              {s.name}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

/** Horizontal bars — the fallback when a radar would be unreadable. */
export function DimensionBars({ dimensions, series }: { dimensions: Dimension[]; series: RadarSeries[] }) {
  return (
    <ul className="space-y-3">
      {dimensions.map((d) => (
        <li key={d.key}>
          <p className="text-sm text-foreground">{d.label}</p>
          <div className="mt-1 space-y-1">
            {series.map((s) => {
              const v = s.scores[d.key];
              return (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${v == null ? 0 : (v / d.max) * 100}%`, background: TONES[s.tone].stroke, opacity: s.tone === "self" ? 0.75 : 1 }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {series.length > 1 ? `${s.name} ` : ""}
                    {v ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Colour scale for a score as a share of its maximum (low → high). */
function heatColour(ratio: number): string {
  if (ratio >= 0.8) return "color-mix(in oklab, var(--positive) 55%, white)";
  if (ratio >= 0.65) return "color-mix(in oklab, var(--positive) 28%, white)";
  if (ratio >= 0.5) return "color-mix(in oklab, var(--warm) 30%, white)";
  return "color-mix(in oklab, var(--destructive) 28%, white)";
}

export function Heatmap({
  dimensions,
  rows,
}: {
  dimensions: Dimension[];
  rows: Array<{ id: string; name: string; scores: Scores; href?: string }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-40 text-left text-xs font-medium text-muted-foreground">Person</th>
            {dimensions.map((d) => (
              <th key={d.key} scope="col" className="px-1 text-center align-bottom text-xs font-medium text-muted-foreground">
                <span className="line-clamp-2">{d.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="truncate pr-2 text-left font-medium text-foreground">
                {row.href ? (
                  <a href={row.href} className="hover:text-primary hover:underline">
                    {row.name}
                  </a>
                ) : (
                  row.name
                )}
              </th>
              {dimensions.map((d) => {
                const v = row.scores[d.key];
                return (
                  <td
                    key={d.key}
                    className="heat-cell h-9 rounded-md text-center tabular-nums text-foreground"
                    style={{ background: v == null ? "var(--surface)" : heatColour(v / d.max) }}
                    title={`${row.name} · ${d.label}: ${v ?? "no rating"}`}
                  >
                    {v ?? <span className="text-muted-foreground">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {[
          ["Below 50%", 0.4],
          ["50–64%", 0.55],
          ["65–79%", 0.7],
          ["80%+", 0.9],
        ].map(([label, r]) => (
          <span key={label as string} className="inline-flex items-center gap-1.5">
            <span className="heat-cell size-3 rounded-sm" style={{ background: heatColour(r as number) }} />
            {label}
          </span>
        ))}
      </p>
    </div>
  );
}

const INSIGHT_STYLE: Record<Insight["kind"], { icon: typeof Star; tint: string }> = {
  strength: { icon: Star, tint: "text-primary" },
  growth: { icon: TrendingUp, tint: "text-warm-foreground" },
  blind_spot: { icon: Eye, tint: "text-destructive" },
  hidden_strength: { icon: Sparkles, tint: "text-primary" },
  alignment: { icon: Scale, tint: "text-muted-foreground" },
  spread: { icon: ArrowDownRight, tint: "text-warm-foreground" },
  theme: { icon: Lightbulb, tint: "text-muted-foreground" },
};

export function InsightList({ insights, className }: { insights: Insight[]; className?: string }) {
  if (!insights.length) return null;
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {insights.map((insight, i) => {
        const { icon: Icon, tint } = INSIGHT_STYLE[insight.kind];
        return (
          <li key={i} className="report-avoid-break flex gap-3 rounded-xl border border-border bg-card p-4">
            <Icon className={cn("mt-0.5 size-5 shrink-0", tint)} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-foreground">{insight.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="report-avoid-break rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ThemeChips({ themes }: { themes: Array<{ term: string; count: number }> }) {
  if (!themes.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {themes.map((t) => (
        <li key={t.term} className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground">
          {t.term} <span className="text-xs text-muted-foreground">· {t.count} answers</span>
        </li>
      ))}
    </ul>
  );
}
