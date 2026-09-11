/**
 * Marketing type scale — Inter-based, editorial hierarchy.
 * Headlines use semibold + tight tracking for composed feel.
 * Body uses regular weight with generous line-height.
 */
export const marketingType = {
  h1: "font-display text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-[2.75rem] lg:text-[3rem]",
  h1Home:
    "font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[3rem] lg:text-[3.5rem]",
  h2: "font-display text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[2rem] lg:text-[2.25rem]",
  h3: "font-display text-lg font-semibold tracking-[-0.02em] text-foreground",
  h3Card: "font-display text-xl font-semibold tracking-[-0.02em] text-foreground",
  eyebrow:
    "text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-primary",
  lead: "text-[1.0625rem] leading-relaxed text-muted-foreground sm:text-lg",
  body: "text-[0.9375rem] leading-[1.75] text-muted-foreground sm:text-base",
  cardBody: "text-sm leading-relaxed text-muted-foreground",
} as const;

export type MarketingTypeToken = keyof typeof marketingType;
