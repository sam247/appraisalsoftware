import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SetupStep } from "./campaigns/presentation";

/** Quiet status pill — reuse on Home and campaign cockpit. */
export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "ready" | "warn" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "accent" && "bg-accent text-accent-foreground",
        tone === "ready" && "bg-warm/25 text-warm-foreground",
        tone === "warn" && "bg-destructive/10 text-destructive",
        tone === "muted" && "bg-surface text-muted-foreground",
        tone === "neutral" && "bg-surface text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Draft setup progress — horizontal on desktop, compact summary on mobile.
 * Only for genuine configuration completeness.
 */
export function SetupSteps({
  steps,
  percent,
}: {
  steps: SetupStep[];
  percent: number;
}) {
  const current = steps.find((s) => !s.done) ?? steps[steps.length - 1];

  return (
    <div className="w-full">
      {/* Mobile: current step + % */}
      <div className="flex items-baseline justify-between gap-3 sm:hidden">
        <p className="text-sm text-foreground">
          <span className="font-medium">{current?.label}</span>
          <span className="text-muted-foreground">
            {" "}
            · {percent}% ready
          </span>
        </p>
      </div>
      <ol className="mt-1.5 flex flex-wrap gap-x-1 gap-y-1 text-xs sm:hidden">
        {steps.map((step) => (
          <li
            key={step.key}
            className={cn(
              "rounded-full px-2 py-0.5",
              step.done
                ? "bg-accent/80 text-accent-foreground"
                : step.key === current?.key
                  ? "bg-surface font-medium text-foreground ring-1 ring-border"
                  : "text-muted-foreground",
            )}
          >
            {step.done ? "✓ " : ""}
            {step.label}
          </li>
        ))}
      </ol>

      {/* Desktop: horizontal rail */}
      <div className="hidden items-center gap-3 sm:flex">
        <ol className="flex min-w-0 flex-1 items-center gap-0">
          {steps.map((step, i) => {
            const currentIdx = steps.findIndex((s) => !s.done);
            const active =
              currentIdx === i ||
              (currentIdx === -1 && i === steps.length - 1);
            return (
              <li key={step.key} className="flex min-w-0 items-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "mx-1.5 h-px w-4 shrink-0 sm:w-6 md:w-8",
                      steps[i - 1]?.done ? "bg-primary/35" : "bg-border",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]",
                    step.done && "text-foreground",
                    !step.done && active && "font-semibold text-foreground",
                    !step.done && !active && "text-muted-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      step.done && "bg-primary text-primary-foreground",
                      !step.done &&
                        active &&
                        "border border-primary/50 bg-accent text-accent-foreground",
                      !step.done &&
                        !active &&
                        "border border-border text-transparent",
                    )}
                  >
                    {step.done ? "✓" : active ? "·" : ""}
                  </span>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {percent}% ready
        </p>
      </div>
    </div>
  );
}

/** Live/closed response progress in the same header territory as setup. */
export function ResponseStrip({
  label,
  complete,
  total,
  percent,
  meta,
  attention,
}: {
  label: string;
  complete: number;
  total: number;
  percent: number;
  meta?: string;
  attention?: string;
}) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {total > 0 && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {complete} of {total} complete · {percent}%
          </p>
        )}
      </div>
      {total > 0 ? (
        <progress
          aria-label="Response completion"
          max={total}
          value={complete}
          className="mt-2 h-1.5 w-full accent-primary"
        />
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No invitations yet.</p>
      )}
      {(meta || attention) && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            attention ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {attention ?? meta}
        </p>
      )}
    </div>
  );
}

/**
 * Next action — prominent on Home; compact contextual callout in campaign.
 */
export function NextAction({
  label,
  detail,
  href,
  children,
  compact = false,
  tone = "default",
}: {
  label: string;
  detail?: string;
  href?: string;
  children?: React.ReactNode;
  compact?: boolean;
  tone?: "default" | "warn";
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-[3px] py-2.5 pl-3.5 pr-3",
          tone === "warn"
            ? "border-l-destructive bg-destructive/5"
            : "border-l-primary bg-accent/40",
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Next
          </p>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {detail && (
            <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
          )}
        </div>
        {(href || children) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {href && (
              <Link
                href={href}
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {label}
              </Link>
            )}
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Next
      </p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{label}</p>
      {detail && (
        <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
      )}
      {(href || children) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {href && (
            <Link
              href={href}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {label}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function AttentionRow({
  href,
  badge,
  badgeTone,
  title,
  detail,
  actionLabel,
}: {
  href: string;
  badge: string;
  badgeTone?: "neutral" | "accent" | "ready" | "warn" | "muted";
  title: string;
  detail: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-border py-2 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_auto]"
    >
      <p className="min-w-0 truncate text-sm font-medium text-foreground group-hover:text-primary">
        {title}
      </p>
      <StatusBadge tone={badgeTone}>{badge}</StatusBadge>
      <p className="col-span-2 min-w-0 truncate text-xs text-muted-foreground sm:col-span-1">
        {detail}
      </p>
      <span className="col-start-2 row-start-1 shrink-0 text-sm font-medium text-primary sm:col-start-auto sm:row-start-auto">
        {actionLabel} →
      </span>
    </Link>
  );
}
