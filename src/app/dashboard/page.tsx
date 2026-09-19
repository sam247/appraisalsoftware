import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PageHeader, AttentionRow } from "./chrome";
import {
  buildAttentionItems,
  campaignLabels,
  statusTone,
  type AttentionKind,
} from "./campaigns/presentation";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";

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
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const enabled360 = process.env.ENABLE_360_FEEDBACK === "true";
  const [campaignResult, peopleResult, assignmentResult, subjectResult] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("*")
        .eq("organization_id", org.id)
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      supabase
        .from("people")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .is("archived_at", null),
      supabase
        .from("campaign_assignments")
        .select("*")
        .eq("organization_id", org.id),
      supabase
        .from("campaign_subjects")
        .select("campaign_id")
        .eq("organization_id", org.id),
    ]);
  if (
    campaignResult.error ||
    peopleResult.error ||
    assignmentResult.error ||
    subjectResult.error
  )
    throw new Error("Unable to load your workspace");

  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const assignments = (assignmentResult.data ?? []) as CampaignAssignment[];
  const subjects = (subjectResult.data ?? []) as Pick<
    CampaignSubject,
    "campaign_id"
  >[];
  const peopleCount = peopleResult.count ?? 0;
  const hasPeople = peopleCount > 0;

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
  // A campaign that needs attention should not also appear under In progress.
  const activeItems = attention.filter(
    (i) =>
      ["scheduled", "collecting"].includes(i.kind) &&
      !actionCampaignIds.has(i.campaign.id),
  );
  const recentItems = attention
    .filter((i) => i.kind === "view_results")
    .slice(0, 5);

  const hasWork =
    actionItems.length > 0 || activeItems.length > 0 || recentItems.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Home"
        subtitle="Appraisals and feedback across your team."
      />

      <StartSurface enabled360={enabled360} />

      {!campaigns.length && !hasPeople && (
        <p className="text-sm text-muted-foreground">
          Add people first, then start an annual appraisal
          {enabled360 ? " or 360 feedback" : ""}.
        </p>
      )}

      {!campaigns.length && hasPeople && (
        <p className="text-sm text-muted-foreground">
          Your directory is ready. Start an appraisal when you are.
        </p>
      )}

      {actionItems.length > 0 && (
        <WorkSection title="Needs attention" count={actionItems.length}>
          {actionItems.map((item) => (
            <AttentionRow
              key={`${item.kind}-${item.campaign.id}`}
              href={
                item.kind === "view_results"
                  ? `/dashboard/campaigns/${item.campaign.id}/results`
                  : `/dashboard/campaigns/${item.campaign.id}`
              }
              badge={KIND_BADGE[item.kind]}
              badgeTone={statusTone(item.kind)}
              title={item.title}
              detail={item.detail}
              actionLabel={item.actionLabel}
            />
          ))}
        </WorkSection>
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
              detail={item.detail}
              actionLabel={item.actionLabel}
            />
          ))}
        </WorkSection>
      )}

      {recentItems.length > 0 && (
        <WorkSection title="Recently closed" count={recentItems.length}>
          {recentItems.map((item) => (
            <AttentionRow
              key={`${item.kind}-${item.campaign.id}`}
              href={`/dashboard/campaigns/${item.campaign.id}/results`}
              badge={KIND_BADGE[item.kind]}
              badgeTone="muted"
              title={item.title}
              detail={item.detail}
              actionLabel={item.actionLabel}
            />
          ))}
        </WorkSection>
      )}

      {campaigns.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <Link href="/dashboard/campaigns" className="hover:text-foreground">
            See all campaigns →
          </Link>
          {!hasWork && (
            <span className="ml-2">Nothing needs attention right now.</span>
          )}
        </p>
      )}
    </div>
  );
}

function StartSurface({ enabled360 }: { enabled360: boolean }) {
  return (
    <section className="rounded-xl border border-border/80 bg-card/60 px-4 py-5 sm:px-5">
      <h2 className="text-base font-medium tracking-tight text-foreground">
        What would you like to do?
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Start something new for your team.
      </p>
      <div
        className={cn(
          "mt-4 grid gap-2",
          enabled360 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        <StartAction
          href="/dashboard/campaigns/new"
          title="Annual appraisal"
          description="Self and manager review"
        />
        {enabled360 && (
          <StartAction
            href="/dashboard/campaigns/new?type=360"
            title="360 feedback"
            description="Anonymous multi-reviewer feedback"
          />
        )}
        <StartAction
          href="/dashboard/people"
          title="Add people"
          description="Grow your employee directory"
        />
      </div>
    </section>
  );
}

function StartAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-background/80 px-3.5 py-3 transition-colors hover:border-foreground/15 hover:bg-card"
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
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
