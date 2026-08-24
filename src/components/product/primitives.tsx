import { cn } from "@/lib/utils";
import { marketingType } from "@/lib/marketing-typography";

export function Panel({
  className,
  children,
  title,
  meta,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
  meta?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.1rem] border border-border bg-surface shadow-[0_34px_80px_-48px_rgba(15,23,42,0.55)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-card/80 px-4 py-3">
        <span className="size-2 rounded-full bg-[#f87171]/80" aria-hidden />
        <span className="size-2 rounded-full bg-[#fbbf24]/80" aria-hidden />
        <span className="size-2 rounded-full bg-[#34d399]/80" aria-hidden />
        {title ? (
          <span className="ml-2 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        ) : null}
        {meta ? (
          <span className="ml-auto hidden truncate rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:block">
            {meta}
          </span>
        ) : null}
      </div>
      <div className="bg-card">{children}</div>
    </div>
  );
}

const avatarTones = [
  "bg-primary/15 text-primary",
  "bg-warm/25 text-warm-foreground",
  "bg-positive/20 text-positive-foreground",
  "bg-accent text-accent-foreground",
];

export function Avatar({
  initials,
  tone = 0,
  className,
}: {
  initials: string;
  tone?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-card",
        avatarTones[tone % avatarTones.length],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({ people }: { people: string[] }) {
  return (
    <div className="flex -space-x-2">
      {people.map((p, i) => (
        <Avatar key={p + i} initials={p} tone={i} />
      ))}
    </div>
  );
}

export function StatusChip({
  status,
}: {
  status: "Complete" | "In progress" | "Not started" | "Anonymous" | "Safe to share" | "Restricted";
}) {
  const tones: Record<string, string> = {
    Complete: "bg-positive/15 text-positive-foreground",
    "In progress": "bg-primary/10 text-primary",
    "Not started": "bg-muted text-muted-foreground",
    Anonymous: "bg-warm/20 text-warm-foreground",
    "Safe to share": "bg-positive/15 text-positive-foreground",
    Restricted: "bg-warm/20 text-warm-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
        tones[status],
      )}
    >
      {status}
    </span>
  );
}

export function ScoreBar({
  label,
  value,
  compare,
}: {
  label: string;
  value: number;
  compare?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {(value / 20).toFixed(1)}
          {compare !== undefined ? (
            <span className="ml-1 text-[10px] text-muted-foreground/70">
              self {(compare / 20).toFixed(1)}
            </span>
          ) : null}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-2">
        <div
          className="h-1.5 rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${value}%` }}
        />
        {compare !== undefined ? (
          <span
            className="absolute top-[-3px] size-[9px] -translate-x-1/2 rounded-full border-2 border-card bg-warm"
            style={{ left: `${compare}%` }}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}

export function CompletionRing({
  value,
  label = "complete",
  size = 96,
}: {
  value: number;
  label?: string;
  size?: number;
}) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" className="stroke-surface-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          className="stroke-primary"
        />
      </svg>
      <span className="absolute text-center">
        <span className="block text-lg font-semibold tabular-nums text-foreground">{value}%</span>
        <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className={marketingType.eyebrow}>{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className={cn(marketingType.h2, eyebrow ? "mt-4" : undefined)}>{title}</h2>
      {copy ? <p className={cn("mt-4", marketingType.body)}>{copy}</p> : null}
    </div>
  );
}
