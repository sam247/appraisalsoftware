import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SetupStep } from "./campaigns/presentation";

/** Quiet status pill — reuse on Home and campaign cockpit. */
export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warn" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "accent" && "bg-accent text-accent-foreground",
        tone === "warn" && "bg-destructive/10 text-destructive",
        tone === "muted" && "bg-surface text-muted-foreground",
        tone === "neutral" && "bg-surface text-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** Draft setup checklist — separate from live response progress. */
export function SetupSteps({
  steps,
  percent,
}: {
  steps: SetupStep[];
  percent: number;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Setup</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {percent}% ready
        </p>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground",
              )}
            >
              {step.done ? "✓" : ""}
            </span>
            <span
              className={
                step.done ? "text-foreground" : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Primary next-step panel for Home and cockpit. */
export function NextAction({
  label,
  detail,
  href,
  children,
}: {
  label: string;
  detail?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Next
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{label}</p>
      {detail && (
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      )}
      {(href || children) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
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
  badgeTone?: "neutral" | "accent" | "warn" | "muted";
  title: string;
  detail: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 border-b border-border px-1 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={badgeTone}>{badge}</StatusBadge>
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {title}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <span className="shrink-0 text-sm font-medium text-primary">
        {actionLabel} →
      </span>
    </Link>
  );
}
