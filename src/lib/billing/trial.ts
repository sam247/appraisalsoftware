export const trialReleased = process.env.NEXT_PUBLIC_TRIAL_READY === "true";
export const trialCta = "Start free trial";
export interface WorkspaceEntitlement { plan: "legacy" | "trial" | "pro" | "organisation"; trial_ends_at: string | null; can_operate: boolean; first_activated: boolean; }
