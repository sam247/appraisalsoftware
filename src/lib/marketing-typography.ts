/**
 * Marketing type scale — Inter-based, editorial hierarchy.
 * Display: tight tracking + semibold for composure.
 * Body: generous line-height, slightly muted.
 * Eyebrow: small, wide-tracked, brand accent.
 */
export const marketingType = {
  h1: "font-display text-[2.5rem] font-semibold leading-[1.06] tracking-[-0.04em] text-ink sm:text-[2.75rem] lg:text-[3rem]",
  h1Home:
    "font-display text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.25rem] lg:text-[2.5rem]",
  h2: "font-display text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2rem] lg:text-[2.25rem]",
  h3: "font-display text-lg font-semibold tracking-[-0.025em] text-foreground",
  h3Card: "font-display text-xl font-semibold tracking-[-0.025em] text-foreground",
  eyebrow:
    "text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-primary",
  lead: "text-[1.0625rem] leading-[1.65] text-muted-foreground sm:text-lg",
  body: "text-[0.9375rem] leading-[1.75] text-muted-foreground sm:text-base",
  cardBody: "text-sm leading-relaxed text-muted-foreground",
} as const;

export type MarketingTypeToken = keyof typeof marketingType;
