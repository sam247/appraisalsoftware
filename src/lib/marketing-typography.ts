/**
 * Shared marketing type scale — aligned with Disclosurely commercial patterns,
 * adapted for AppraisalSoftware's specialist calm (Montserrat display + muted body).
 */
export const marketingType = {
  h1: "font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl",
  h1Home:
    "font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem]",
  h2: "font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl",
  h3: "font-display text-lg font-semibold tracking-tight text-foreground",
  h3Card: "font-display text-xl font-semibold tracking-tight text-foreground",
  eyebrow:
    "text-xs font-semibold uppercase tracking-[0.16em] text-primary",
  lead: "text-lg leading-relaxed text-muted-foreground sm:text-xl",
  body: "text-base leading-7 text-muted-foreground",
  cardBody: "text-sm leading-relaxed text-muted-foreground",
} as const;

export type MarketingTypeToken = keyof typeof marketingType;
