import { cn } from "@/lib/utils";

export const CREATION_STEPS = [
  { key: "setup", label: "Setup" },
  { key: "people", label: "People" },
  { key: "review", label: "Review & send" },
] as const;

export type CreationStepKey = (typeof CREATION_STEPS)[number]["key"];

export default function CreationProgress({
  current,
  className,
}: {
  current: CreationStepKey;
  className?: string;
}) {
  const currentIndex = CREATION_STEPS.findIndex((s) => s.key === current);

  return (
    <div className={className}>
      <div
        className="flex flex-wrap gap-1.5 sm:hidden"
        aria-label="Creation progress"
      >
        {CREATION_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <span
              key={step.key}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                active
                  ? "bg-accent font-medium text-accent-foreground ring-1 ring-primary/25"
                  : done
                    ? "bg-surface font-medium text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {done ? (
                <span aria-hidden className="text-primary">
                  ✓
                </span>
              ) : null}
              {step.label}
            </span>
          );
        })}
      </div>
      <ol
        aria-label="Creation progress"
        className="hidden items-center gap-0 sm:flex"
      >
        {CREATION_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.key} className="flex min-w-0 items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1.5 h-px w-4 shrink-0 sm:w-6 md:w-8",
                    done || active ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]",
                  active
                    ? "font-semibold text-foreground"
                    : done
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "border border-primary/50 bg-accent text-accent-foreground"
                        : "border border-border text-transparent",
                  )}
                >
                  {done ? "✓" : active ? "·" : ""}
                </span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
