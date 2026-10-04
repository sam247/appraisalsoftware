import type { Campaign } from "@/lib/types/database";

/** Archived drafts are not evidence that a workspace has launched a campaign. */
export function hasLaunchedCampaign(campaign: Pick<Campaign, "status" | "questions_frozen_at" | "send_claimed_at">) {
  return ["scheduled", "active", "closed"].includes(campaign.status) ||
    (campaign.status === "archived" && !!(campaign.questions_frozen_at || campaign.send_claimed_at));
}

export function onboardingState(campaigns: Campaign[], activePeople: number, readyDraftIds: Set<string>) {
  const complete = campaigns.some(hasLaunchedCampaign);
  const draft = campaigns.filter((campaign) => campaign.status === "draft")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
  const steps = [
    { label: "Add people", done: complete || activePeople > 0, href: "/dashboard/people", description: "Add employees and their default managers, or import your team." },
    { label: "Prepare a campaign", done: complete || campaigns.some((campaign) => campaign.status === "draft" && readyDraftIds.has(campaign.id)), href: draft ? `/dashboard/campaigns/${draft.id}` : "/dashboard/campaigns/new", description: "Choose participants, prepare the form, and set the timing." },
    { label: "Send or schedule", done: complete, href: draft ? `/dashboard/campaigns/${draft.id}` : "/dashboard/campaigns/new", description: "Review the saved setup and launch your first appraisal or feedback cycle." },
  ];
  return { complete, draft, steps, percent: Math.round(steps.filter((step) => step.done).length / steps.length * 100) };
}
