import type { Campaign } from "@/lib/types/database";
import { hasLaunchedCampaign } from "../workspace-state";

export type ReportEntry = {
  id: string; name: string; type: Campaign["campaign_type"]; status: Campaign["status"];
  completion: string; availability: string; available: boolean;
  date: string | null; dateLabel: string; timezone: string;
};

export function reportAvailability(campaign: Campaign, complete: number, hasQuestions: boolean, feedbackState?: string) {
  if (campaign.campaign_type === "feedback_360") {
    if (feedbackState === "available") return { available: true, availability: "Available" };
    if (feedbackState === "not_closed") return { available: false, availability: "Available after closure" };
    if (feedbackState === "insufficient_responses") return { available: false, availability: "Privacy minimum not met" };
    return { available: false, availability: "Report unavailable" };
  }
  if (!hasQuestions) return { available: false, availability: "No saved report questions" };
  if (!complete) return { available: false, availability: "Awaiting completed responses" };
  return { available: true, availability: campaign.status === "active" ? "Partial report available" : "Available" };
}

export function belongsInReports(campaign: Campaign) {
  return campaign.status !== "draft" && hasLaunchedCampaign(campaign);
}

export function filterReports(entries: ReportEntry[], query: string, type: string) {
  const needle = query.trim().toLocaleLowerCase("en-GB");
  return entries.filter((entry) => (type === "all" || entry.type === type) && entry.name.toLocaleLowerCase("en-GB").includes(needle));
}
