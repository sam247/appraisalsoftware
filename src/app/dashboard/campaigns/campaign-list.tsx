import Link from "next/link";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";
import {
  campaignLabels,
  campaignDate,
  responseProgress,
  campaignTypeLabel,
  statusTone,
} from "./presentation";
import { StatusBadge } from "../chrome";

export default function CampaignList({
  campaigns,
  assignments,
}: {
  campaigns: Campaign[];
  assignments: CampaignAssignment[];
}) {
  return (
    <div className="divide-y divide-border border-t border-border">
      {campaigns.map((campaign) => {
        const progress = responseProgress(
          assignments.filter((a) => a.campaign_id === campaign.id),
        );
        return (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="group block py-3.5 focus-visible:outline-primary"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={statusTone(campaign.status)}>
                    {campaignLabels[campaign.status]}
                  </StatusBadge>
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-foreground group-hover:text-primary break-words">
                  {campaign.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {campaignTypeLabel(campaign.campaign_type)}
                  {campaign.status === "scheduled" && campaign.opens_at
                    ? ` · Sends ${campaignDate(campaign.opens_at, campaign.timezone, true)}`
                    : ""}
                  {campaign.closes_at
                    ? ` · Closes ${campaignDate(campaign.closes_at, campaign.timezone)}`
                    : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-primary">
                {campaign.status === "draft"
                  ? "Continue setup"
                  : campaign.status === "closed"
                    ? "Open"
                    : "Open"}{" "}
                →
              </span>
            </div>
            {campaign.status !== "draft" && progress.total > 0 && (
              <div className="mt-2 max-w-md">
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>
                    {progress.complete} of {progress.total} complete
                    {progress.outstanding > 0
                      ? ` · ${progress.outstanding} outstanding`
                      : ""}
                  </span>
                  <span>{progress.percent}%</span>
                </div>
                <progress
                  aria-label={`${campaign.name} response completion`}
                  max={progress.total}
                  value={progress.complete}
                  className="mt-1 h-1.5 w-full accent-primary"
                />
                {progress.attention > 0 && (
                  <p className="mt-1 text-xs text-destructive">
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
