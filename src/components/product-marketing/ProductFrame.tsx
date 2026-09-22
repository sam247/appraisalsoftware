import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ProductFrame({
  eyebrow = "Appraisal Software",
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_-30px_oklch(0.46_0.12_158/0.45)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border bg-surface/70 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            {eyebrow}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {title}
          </p>
        </div>
        <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">
          Product preview
        </span>
      </div>
      {description ? (
        <p className="border-b border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
