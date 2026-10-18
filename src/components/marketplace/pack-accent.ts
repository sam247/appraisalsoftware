import type { PackAccent } from "@/lib/marketplace";

/** One accent per category; tints stay inside the warm brand palette. */
export const PACK_ACCENT: Record<PackAccent, { chip: string; dot: string; soft: string; cover: string }> = {
  jade: {
    chip: "bg-accent text-accent-foreground",
    dot: "bg-primary",
    soft: "from-accent/70",
    cover: "bg-accent",
  },
  amber: {
    chip: "bg-[color-mix(in_oklab,var(--warm)_22%,white)] text-warm-foreground",
    dot: "bg-warm",
    soft: "from-[color-mix(in_oklab,var(--warm)_16%,white)]",
    cover: "bg-[color-mix(in_oklab,var(--warm)_22%,white)]",
  },
  blue: {
    chip: "bg-[color-mix(in_oklab,var(--chart-3)_16%,white)] text-[color-mix(in_oklab,var(--chart-3)_70%,black)]",
    dot: "bg-chart-3",
    soft: "from-[color-mix(in_oklab,var(--chart-3)_10%,white)]",
    cover: "bg-[color-mix(in_oklab,var(--chart-3)_18%,white)]",
  },
  teal: {
    chip: "bg-[color-mix(in_oklab,var(--chart-5)_16%,white)] text-[color-mix(in_oklab,var(--chart-5)_65%,black)]",
    dot: "bg-chart-5",
    soft: "from-[color-mix(in_oklab,var(--chart-5)_10%,white)]",
    cover: "bg-[color-mix(in_oklab,var(--chart-5)_18%,white)]",
  },
  rose: {
    chip: "bg-[color-mix(in_oklab,var(--chart-4)_14%,white)] text-[color-mix(in_oklab,var(--chart-4)_65%,black)]",
    dot: "bg-chart-4",
    soft: "from-[color-mix(in_oklab,var(--chart-4)_9%,white)]",
    cover: "bg-[color-mix(in_oklab,var(--chart-4)_16%,white)]",
  },
};
