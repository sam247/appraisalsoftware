import CreationLauncher, {
  type LauncherAction,
} from "@/app/dashboard/home/creation-launcher";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "./chrome";
import {
  buildAttentionItems,
  campaignTypeLabel,
  dedupeAttentionByCampaign,
  HOME_WORK_LIMIT,
  homeWorkAction,
  homeWorkBadge,
  homeWorkHref,
  statusTone,
} from "./campaigns/presentation";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
} from "@/lib/types/database";

export default async function OverviewPage() {
  const { org, userId } = await requireOrgAdmin();
  const supabase = await createClient();
  const enabled360 = process.env.ENABLE_360_FEEDBACK === "true";

  const [campaignResult, assignmentResult, subjectResult, profileResult, templateResult] =
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
      supabase
        .from("templates")
        .select("id")
        .eq("organization_id", org.id)
        .eq("campaign_type_default", "probation_review")
        .is("archived_at", null)
        .limit(1)
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

  const workItems = dedupeAttentionByCampaign(
    buildAttentionItems(campaigns, assignments, subjectCounts),
  ).slice(0, HOME_WORK_LIMIT);

  const firstName = firstNameFrom(profileResult.data?.full_name ?? null);
  const greeting = firstName
    ? `${dayGreeting(org.timezone || "Europe/London")}, ${firstName}`
    : dayGreeting(org.timezone || "Europe/London");

  const probationTemplateId = templateResult.data?.id ?? null;
  const probationHref = probationTemplateId
    ? `/dashboard/campaigns/new?template=${probationTemplateId}`
    : "/dashboard/templates";

  const launcherActions: LauncherAction[] = [
    {
      href: "/dashboard/campaigns/new",
      title: "Annual appraisal",
      description: "Self and manager review",
      icon: "annual",
    },
    {
      href: enabled360
        ? "/dashboard/campaigns/new?type=360"
        : "/dashboard/campaigns/new",
      title: "360 feedback",
      description: "Anonymous multi-reviewer feedback",
      icon: "feedback",
    },
    {
      href: probationHref,
      title: "Probation review",
      description: "Review a new team member",
      icon: "probation",
    },
    {
      href: "/dashboard/templates",
      title: "Start from a template",
      description: "Use one of your question templates",
      icon: "template",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 pb-4">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          What would you like to do?
        </h1>
      </header>

      <CreationLauncher actions={launcherActions} />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Your work</h2>
          <Link
            href="/dashboard/campaigns"
            className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            View all →
          </Link>
        </div>

        {workItems.length === 0 ? (
          <div className="border-t border-border py-6">
            <p className="text-sm text-foreground">No campaigns yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start an appraisal or feedback cycle above.
            </p>
          </div>
        ) : (
          <div className="border-t border-border">
            {workItems.map((item) => (
              <Link
                key={item.campaign.id}
                href={homeWorkHref(item)}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-border py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1.2fr)_auto] sm:gap-x-4"
              >
                <p className="min-w-0 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </p>
                <StatusBadge tone={statusTone(item.kind)}>
                  {homeWorkBadge(item.kind)}
                </StatusBadge>
                <p className="col-span-2 min-w-0 truncate text-xs text-muted-foreground sm:col-span-1">
                  {homeDetail(item.campaign, item.detail)}
                </p>
                <span className="col-start-2 row-start-1 shrink-0 text-sm font-medium text-primary transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 sm:col-start-auto sm:row-start-auto">
                  {homeWorkAction(item.kind)} →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function homeDetail(campaign: Campaign, detail: string): string {
  const type = campaignTypeLabel(campaign.campaign_type);
  if (!detail || detail === "—") return type;
  if (detail.startsWith(type)) return detail;
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
