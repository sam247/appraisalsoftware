import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  PageHeader,
  AttentionRow,
  NextAction,
} from "./chrome";
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

const KIND_BADGE: Record<AttentionKind, string> = {
  needs_setup: "Needs setup",
  ready_to_send: "Ready to send",
  scheduled: "Scheduled",
  collecting: "Collecting",
  delivery_issue: "Delivery issue",
  ready_to_close: "Ready to close",
  view_results: "Results ready",
};

export default async function OverviewPage() {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
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
  const activeItems = attention.filter((i) =>
    ["scheduled", "collecting"].includes(i.kind),
  );
  const recentItems = attention.filter((i) => i.kind === "view_results").slice(0, 3);

  const primary = actionItems[0] ?? activeItems[0] ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Home"
        subtitle={
          campaigns.length
            ? "What needs your attention across appraisals and feedback."
            : "Set up people, then create your first appraisal."
        }
        action={
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Create appraisal
          </Link>
        }
      />

      {!campaigns.length ? (
        <EmptyHome hasPeople={hasPeople} />
      ) : (
        <>
          {primary && (
            <NextAction
              label={primary.actionLabel}
              detail={`${primary.title} · ${primary.detail}`}
              href={
                primary.kind === "view_results"
                  ? `/dashboard/campaigns/${primary.campaign.id}/results`
                  : `/dashboard/campaigns/${primary.campaign.id}`
              }
            />
          )}

          {actionItems.length > 0 && (
            <AttentionSection title="Needs attention">
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
            </AttentionSection>
          )}

          {activeItems.length > 0 && (
            <AttentionSection title="In progress">
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
            </AttentionSection>
          )}

          {recentItems.length > 0 && (
            <AttentionSection title="Recently closed">
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
            </AttentionSection>
          )}

          {!actionItems.length && !activeItems.length && !recentItems.length && (
            <p className="text-sm text-muted-foreground">
              Nothing needs attention right now.{" "}
              <Link
                href="/dashboard/campaigns/new"
                className="font-medium text-primary hover:underline"
              >
                Create an appraisal
              </Link>
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            <Link href="/dashboard/campaigns" className="hover:text-foreground">
              See all campaigns →
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function AttentionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold text-foreground">{title}</h2>
      <div className="border-t border-border">{children}</div>
    </section>
  );
}

function EmptyHome({ hasPeople }: { hasPeople: boolean }) {
  return (
    <div className="space-y-6">
      {!hasPeople ? (
        <NextAction
          label="Add people"
          detail="Import a CSV or add employees before you create an appraisal."
          href="/dashboard/people"
        />
      ) : (
        <NextAction
          label="Create appraisal"
          detail="People are ready. Name the appraisal, choose questions, then invite respondents."
          href="/dashboard/campaigns/new"
        />
      )}

      <section>
        <h2 className="mb-1 text-sm font-semibold text-foreground">
          Minimum setup
        </h2>
        <ol className="divide-y divide-border border-t border-border">
          <li className="flex gap-3 py-3">
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                hasPeople
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {hasPeople ? "✓" : "1"}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">People</p>
              <p className="text-sm text-muted-foreground">
                {hasPeople
                  ? "Directory ready."
                  : "Add employees and managers once; reuse them every cycle."}
              </p>
              {!hasPeople && (
                <Link
                  href="/dashboard/people"
                  className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Add or import people →
                </Link>
              )}
            </div>
          </li>
          <li className="flex gap-3 py-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted-foreground">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Appraisal</p>
              <p className="text-sm text-muted-foreground">
                Create a campaign, assign people, then send or schedule invitations.
              </p>
              {hasPeople && (
                <Link
                  href="/dashboard/campaigns/new"
                  className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Create appraisal →
                </Link>
              )}
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}
