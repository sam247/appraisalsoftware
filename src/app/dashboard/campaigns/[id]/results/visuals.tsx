import { cn } from "@/lib/utils";

/** Dual markers on a 1–max track for Self vs Manager. */
export function ComparisonTrack({
  self,
  manager,
  max,
  className,
}: {
  self: number | null;
  manager: number | null;
  max: number;
  className?: string;
}) {
  const pct = (v: number) =>
    `${Math.min(100, Math.max(0, ((v - 1) / Math.max(1, max - 1)) * 100))}%`;

  return (
    <div
      className={cn("relative h-3 w-full max-w-xs", className)}
      role="img"
      aria-label={
        self !== null && manager !== null
          ? `Self ${self}, Manager ${manager}, scale 1 to ${max}`
          : self !== null
            ? `Self ${self} of ${max}`
            : manager !== null
              ? `Manager ${manager} of ${max}`
              : "No ratings yet"
      }
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {self !== null && (
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
          style={{ left: pct(self) }}
          title={`Self ${self}`}
        />
      )}
      {manager !== null && (
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-accent"
          style={{ left: pct(manager) }}
          title={`Manager ${manager}`}
        />
      )}
    </div>
  );
}

/** Restrained radar for 3–8 anonymous rating dimensions. */
export function FeedbackRadar({
  dimensions,
  max = 5,
}: {
  dimensions: Array<{ label: string; average: number }>;
  max?: number;
}) {
  if (dimensions.length < 3 || dimensions.length > 8) return null;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const n = dimensions.length;

  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = (Math.min(max, Math.max(0, value)) / max) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const grid = [1, 2, 3, 4, 5].filter((g) => g <= max);
  const poly = dimensions
    .map((d, i) => {
      const p = point(i, d.average);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full max-w-[240px]"
      role="img"
      aria-label="Feedback profile chart"
    >
      {grid.map((g) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = point(i, g);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon
            key={g}
            points={pts}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
        );
      })}
      {dimensions.map((_, i) => {
        const tip = point(i, max);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={tip.x}
            y2={tip.y}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={poly}
        fill="currentColor"
        className="text-primary/20"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {dimensions.map((d, i) => {
        const tip = point(i, max * 1.18);
        const short =
          d.label.length > 18 ? `${d.label.slice(0, 17).trimEnd()}…` : d.label;
        return (
          <text
            key={d.label + i}
            x={tip.x}
            y={tip.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            style={{ fontSize: 9 }}
          >
            {short}
          </text>
        );
      })}
    </svg>
  );
}
