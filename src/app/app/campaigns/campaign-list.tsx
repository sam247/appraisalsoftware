import Link from "next/link";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";
import { campaignLabels, campaignDate, responseProgress } from "./presentation";

export default function CampaignList({
  campaigns,
  assignments,
}: {
  campaigns: Campaign[];
  assignments: CampaignAssignment[];
}) {
  return (
    <div className="divide-y divide-border">
      {campaigns.map((campaign) => {
        const progress = responseProgress(
          assignments.filter((a) => a.campaign_id === campaign.id),
        );
        return (
          <Link
            key={campaign.id}
            href={`/app/campaigns/${campaign.id}`}
            className="group block py-6 focus-visible:outline-primary"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className={`text-sm font-medium ${campaign.status === "active" ? "text-primary" : "text-muted-foreground"}`}
                >
                  {campaignLabels[campaign.status]}
                </span>
                <h3 className="font-display mt-2 text-xl font-semibold group-hover:text-primary break-words">
                  {campaign.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {campaign.campaign_type === "feedback_360"
                    ? "Anonymous 360"
                    : "Annual appraisal"}
                  {campaign.status === "scheduled" && campaign.opens_at
                    ? ` · Sends ${campaignDate(campaign.opens_at, campaign.timezone, true)}`
                    : ""}
                  {campaign.closes_at
                    ? ` · Closes ${campaignDate(campaign.closes_at, campaign.timezone)}`
                    : ""}
                </p>
              </div>
              <span className="text-sm text-primary">
                {campaign.status === "draft"
                  ? "Continue setup"
                  : "Open campaign"}{" "}
                →
              </span>
            </div>
            {progress.total > 0 && (
              <div className="mt-4 max-w-md">
                <div className="flex justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    {progress.complete} of {progress.total} responses complete
                  </span>
                  <span>{progress.percent}%</span>
                </div>
                <progress
                  aria-label={`${campaign.name} response completion`}
                  max={progress.total}
                  value={progress.complete}
                  className="mt-2 h-2 w-full accent-primary"
                />
                {progress.attention > 0 && (
                  <p className="mt-2 text-sm text-destructive">
                    {progress.attention} invitation
                    {progress.attention === 1 ? "" : "s"} could not be delivered
                  </p>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
