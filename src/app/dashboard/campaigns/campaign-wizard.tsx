import Link from "next/link";
import { cn } from "@/lib/utils";

export type WizardStep = {
  key: string;
  label: string;
  description?: string;
};

/** Annual appraisal builder — Details → Questions → People → Review. */
export const ANNUAL_STEPS: WizardStep[] = [
  { key: "details", label: "Campaign details", description: "Name and schedule" },
  { key: "questions", label: "Questions", description: "Pick a question template" },
  { key: "people", label: "People", description: "Employees and managers" },
  { key: "review", label: "Review & send", description: "Confirm and launch" },
];

/** Anonymous 360 builder — Details → Questions → Reviewers → Review. */
export const FEEDBACK_STEPS: WizardStep[] = [
  {
    key: "details",
    label: "Campaign details",
    description: "Name, subject and schedule",
  },
  { key: "questions", label: "Questions", description: "Pick a question template" },
  { key: "reviewers", label: "Reviewers", description: "Invite the feedback cohort" },
  { key: "review", label: "Review & send", description: "Confirm and launch" },
];

/**
 * Shared, guided builder chrome. Presentational only (no client hooks), so it
 * can be rendered from both server and client step components. Each step renders
 * its own body and a {@link WizardFooter} with the navigation buttons.
 */
export function CampaignWizard({
  typeLabel,
  title,
  subtitle,
  steps,
  current,
  error,
  wide = false,
  aside,
  children,
}: {
  typeLabel: string;
  title: string;
  subtitle?: string;
  steps: WizardStep[];
  current: string;
  error?: string | null;
  wide?: boolean;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === current),
  );
  const step = steps[currentIndex];

  return (
    <div className={cn("mx-auto w-full", wide ? "max-w-6xl" : "max-w-5xl")}>
      <header className="min-w-0">
        <Link
          href="/dashboard/campaigns"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Campaigns
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 truncate text-xl font-medium tracking-tight text-foreground">
            {title}
          </h1>
          <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Draft
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {typeLabel}
          {subtitle ? ` · ${subtitle}` : ""}
        </p>
      </header>

      <MobileStepper
        steps={steps}
        currentIndex={currentIndex}
        className="mt-5 lg:hidden"
      />

      <div className="mt-5 grid gap-6 lg:mt-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <StepRail
          steps={steps}
          currentIndex={currentIndex}
          className="hidden lg:block"
        />

        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary">
              Step {currentIndex + 1} of {steps.length}
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {step?.label}
            </h2>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="mt-6">{children}</div>
          </div>
          {aside}
        </div>
      </div>
    </div>
  );
}

/** Footer row for step navigation — render as the last child inside a step. */
export function WizardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
      {children}
    </div>
  );
}

/** Compact confirmation stat strip used at the top of review steps. */
export function ReviewSummary({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-surface/70 px-4 py-3">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StepRail({
  steps,
  currentIndex,
  className,
}: {
  steps: WizardStep[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <nav aria-label="Campaign setup steps" className={className}>
      <ol className="space-y-1">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.key}>
              <div
                className={cn(
                  "flex gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  active && "bg-accent/50 ring-1 ring-primary/15",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    done && "bg-primary text-primary-foreground",
                    active && "border border-primary/50 bg-card text-primary",
                    !done && !active && "border border-border text-muted-foreground",
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      done || active
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                  {s.description && (
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileStepper({
  steps,
  currentIndex,
  className,
}: {
  steps: WizardStep[];
  currentIndex: number;
  className?: string;
}) {
  const step = steps[currentIndex];
  return (
    <div className={className} aria-label="Campaign setup progress">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{step?.label}</p>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}
        </p>
      </div>
      <div className="mt-2 flex gap-1">
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= currentIndex ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
