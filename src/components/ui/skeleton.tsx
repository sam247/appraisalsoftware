import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Quiet placeholder block; the shimmer stops under reduced motion. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "rounded-md bg-[linear-gradient(90deg,var(--surface-2)_0%,var(--surface)_50%,var(--surface-2)_100%)] bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}
