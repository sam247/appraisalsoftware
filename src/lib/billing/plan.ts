import { plans } from "@/lib/pricing";

export interface WorkspaceEntitlement {
  plan: "legacy" | "free" | "pro" | "organisation";
  needs_review: boolean;
  can_operate: boolean;
  first_activated: boolean;
}

export function employeeCapacity(plan: WorkspaceEntitlement["plan"]): number | null {
  if (plan === "legacy") return null;
  return plans.find((p) => p.name.toLowerCase() === plan)!.employees;
}
