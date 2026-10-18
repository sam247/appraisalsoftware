/**
 * Stripe prices are addressed by lookup key, so the same code works against
 * test and live accounts. `scripts/stripe-setup.mjs` creates them.
 */
export type PaidPlan = "pro" | "organisation";
export type BillingInterval = "month" | "year";

export const PRICE_LOOKUP_KEYS: Record<PaidPlan, Record<BillingInterval, string>> = {
  pro: { month: "as_pro_monthly", year: "as_pro_annual" },
  organisation: { month: "as_org_monthly", year: "as_org_annual" },
};

/** Annual = ten months: two months free. Amounts in pence; no VAT is charged. */
export const PRICE_AMOUNTS: Record<PaidPlan, Record<BillingInterval, number>> = {
  pro: { month: 3999, year: 39990 },
  organisation: { month: 8999, year: 89990 },
};

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === "pro" || value === "organisation";
}

export function isInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

/** Reverse lookup used by the webhook: which plan does a price belong to? */
export function planForLookupKey(
  key: string | null | undefined,
): { plan: PaidPlan; interval: BillingInterval } | null {
  for (const plan of ["pro", "organisation"] as const)
    for (const interval of ["month", "year"] as const)
      if (PRICE_LOOKUP_KEYS[plan][interval] === key) return { plan, interval };
  return null;
}

export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;
}
