import type { Organization } from "@/lib/types/database";

/** Paid plans hide the sidebar Upgrade CTA. Missing/unknown → free. */
const PAID_PLANS = new Set(["paid", "pro", "business", "ultimate"]);

export function isFreePlan(org: Pick<Organization, "settings">): boolean {
  const plan = org.settings?.plan;
  return typeof plan !== "string" || !PAID_PLANS.has(plan.toLowerCase());
}
