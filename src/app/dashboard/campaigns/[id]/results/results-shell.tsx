import { StatusBadge } from "@/app/dashboard/chrome";
import {
  campaignDate,
  campaignTypeLabel,
  statusTone,
} from "@/app/dashboard/campaigns/presentation";
import { ResultsBrandMasthead } from "@/components/branding/org-identity";
import type { Campaign } from "@/lib/types/database";
import Link from "next/link";
import type { ReactNode } from "react";

export function ResultsShell({
  campaign,
  meta,
  orgName,
  orgLogoUrl,
  children,
}: {
  campaign: Campaign;
  meta: string;
  orgName?: string;
  orgLogoUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-5"><Link href="/dashboard/reports" className="text-sm text-primary hover:underline">← Reports</Link><Link
        href={`/dashboard/campaigns/${campaign.id}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Campaign
      </Link></div>

      {orgName ? (
        <div className="mt-3">
          <ResultsBrandMasthead orgName={orgName} logoUrl={orgLogoUrl} />
        </div>
      ) : null}

      <header className="page-header mt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] md:text-[28px] font-semibold tracking-tight text-foreground">
              {campaign.name}
            </h1>
            <StatusBadge tone={statusTone(campaign.status)}>
              {campaign.status === "closed" ? "Closed" : campaign.status}
            </StatusBadge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
      </header>

      <div className="report-content mt-8">{children}</div>
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
      `${["closed", "archived"].includes(campaign.status) ? "Close date" : "Closes"} ${campaignDate(campaign.closes_at, campaign.timezone)}`,
    );
  }
  return parts.join(" · ");
}
