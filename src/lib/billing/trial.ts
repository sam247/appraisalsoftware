export const trialReleased = process.env.NEXT_PUBLIC_TRIAL_READY === "true";
export const trialCta = trialReleased ? "Start your 14-day free trial" : "Create a workspace";
export interface WorkspaceEntitlement { plan: "legacy" | "trial" | "pro" | "organisation"; trial_ends_at: string | null; can_operate: boolean; first_activated: boolean; }
