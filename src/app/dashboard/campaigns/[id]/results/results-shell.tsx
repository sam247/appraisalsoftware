import { StatusBadge } from "@/app/dashboard/chrome";
import {
  campaignDate,
  campaignTypeLabel,
  statusTone,
} from "@/app/dashboard/campaigns/presentation";
import type { Campaign } from "@/lib/types/database";
import Link from "next/link";
import type { ReactNode } from "react";

export function ResultsShell({
  campaign,
  meta,
  children,
}: {
  campaign: Campaign;
  meta: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-5xl">
      <Link
        href={`/dashboard/campaigns/${campaign.id}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Campaign
      </Link>

      <header className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight text-foreground">
              {campaign.name}
            </h1>
            <StatusBadge tone={statusTone(campaign.status)}>
              {campaign.status === "closed" ? "Closed" : campaign.status}
            </StatusBadge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
      </header>

      <div className="mt-6">{children}</div>
    </div>
  );
}

export function resultsMetaLine(
  campaign: Campaign,
  extras: string[],
): string {
  const parts = [
    campaignTypeLabel(campaign.campaign_type),
    ...extras.filter(Boolean),
  ];
  if (campaign.closes_at) {
    parts.push(
      `Closed ${campaignDate(campaign.closes_at, campaign.timezone)}`,
    );
  }
  return parts.join(" · ");
}
