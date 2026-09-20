import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader, AttentionRow } from "./chrome";
import {
  buildAttentionItems,
  campaignLabels,
  campaignTypeLabel,
  statusTone,
  type AttentionKind,
} from "./campaigns/presentation";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
} from "@/lib/types/database";

const KIND_BADGE: Record<AttentionKind, string> = {
  needs_setup: "Needs setup",
  ready_to_send: "Ready to send",
  scheduled: "Scheduled",
  collecting: "Collecting",
  delivery_issue: "Delivery issue",
  ready_to_close: "Ready to close",
  view_results: "Complete",
};

export default async function OverviewPage() {
  const { org, userId } = await requireOrgAdmin();
  const supabase = await createClient();
  const [campaignResult, assignmentResult, subjectResult, profileResult] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("*")
        .eq("organization_id", org.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      supabase
        .from("campaign_assignments")
        .select("*")
        .eq("organization_id", org.id),
      supabase
        .from("campaign_subjects")
        .select("campaign_id")
        .eq("organization_id", org.id),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle(),
    ]);
  if (campaignResult.error || assignmentResult.error || subjectResult.error)
    throw new Error("Unable to load your workspace");

  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const assignments = (assignmentResult.data ?? []) as CampaignAssignment[];
  const subjects = (subjectResult.data ?? []) as Pick<
    CampaignSubject,
    "campaign_id"
  >[];

  const subjectCounts: Record<string, number> = {};
  for (const s of subjects) {
    subjectCounts[s.campaign_id] = (subjectCounts[s.campaign_id] ?? 0) + 1;
  }

  const attention = buildAttentionItems(campaigns, assignments, subjectCounts);
  const actionItems = attention.filter((i) =>
    ["needs_setup", "ready_to_send", "delivery_issue", "ready_to_close"].includes(
      i.kind,
    ),
  );
  const actionCampaignIds = new Set(actionItems.map((i) => i.campaign.id));
  const activeItems = attention.filter(
    (i) =>
      ["scheduled", "collecting"].includes(i.kind) &&
      !actionCampaignIds.has(i.campaign.id),
  );
  const recentItems = attention
    .filter((i) => i.kind === "view_results")
    .slice(0, 5);

  const firstName = firstNameFrom(
    profileResult.data?.full_name ?? null,
  );
  const title = firstName
    ? `${dayGreeting(org.timezone || "Europe/London")}, ${firstName}`
    : "Home";

  return (
    <div className="w-full max-w-4xl space-y-8">
      <PageHeader
        title={title}
        subtitle="Here's what's happening with your appraisals."
      />

      {actionItems.length > 0 ? (
        <WorkSection title="Needs your attention" count={actionItems.length}>
          {actionItems.map((item) => (
            <AttentionRow
              key={`${item.kind}-${item.campaign.id}`}
              href={`/dashboard/campaigns/${item.campaign.id}`}
              badge={KIND_BADGE[item.kind]}
              badgeTone={statusTone(item.kind)}
              title={item.title}
              detail={homeDetail(item.campaign, item.detail)}
              actionLabel={
                item.kind === "ready_to_send"
                  ? "Review and send"
                  : item.actionLabel
              }
            />
          ))}
        </WorkSection>
      ) : (
        <section className="border-t border-border pt-4">
          <h2 className="text-sm font-semibold text-foreground">
            You&apos;re all caught up
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No appraisals need your attention.
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            + Create appraisal
          </Link>
        </section>
      )}

      {activeItems.length > 0 && (
        <WorkSection title="In progress" count={activeItems.length}>
          {activeItems.map((item) => (
            <AttentionRow
              key={`${item.kind}-${item.campaign.id}`}
              href={`/dashboard/campaigns/${item.campaign.id}`}
              badge={
                item.kind === "scheduled"
                  ? campaignLabels.scheduled
                  : KIND_BADGE[item.kind]
              }
              badgeTone={statusTone(item.kind)}
              title={item.title}
              detail={homeDetail(item.campaign, item.detail)}
              actionLabel={item.actionLabel}
            />
          ))}
        </WorkSection>
      )}

      {recentItems.length > 0 && (
        <WorkSection title="Recently completed" count={recentItems.length}>
          {recentItems.map((item) => (
            <AttentionRow
              key={`${item.kind}-${item.campaign.id}`}
              href={`/dashboard/campaigns/${item.campaign.id}/results`}
              badge={KIND_BADGE[item.kind]}
              badgeTone="muted"
              title={item.title}
              detail={homeDetail(item.campaign, item.detail)}
              actionLabel={item.actionLabel}
            />
          ))}
        </WorkSection>
      )}

      <p className="text-xs text-muted-foreground">
        <Link href="/dashboard/campaigns" className="hover:text-foreground">
          See all campaigns →
        </Link>
      </p>
    </div>
  );
}

function homeDetail(campaign: Campaign, detail: string): string {
  const type = campaignTypeLabel(campaign.campaign_type);
  if (!detail || detail === "—") return type;
  return `${type} · ${detail}`;
}

function firstNameFrom(fullName: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first || null;
}

function dayGreeting(timezone: string): string {
  const hour = Number(
    new Date().toLocaleString("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function WorkSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="border-t border-border">{children}</div>
    </section>
  );
}
