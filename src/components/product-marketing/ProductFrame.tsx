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
        "overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-border bg-surface/50 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] text-primary">
            {eyebrow}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {title}
          </p>
        </div>
      </div>
      {description ? (
        <p className="sr-only">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
