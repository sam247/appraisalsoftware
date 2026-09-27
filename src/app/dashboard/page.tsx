import CreationLauncher, {
  type LauncherAction,
} from "@/app/dashboard/home/creation-launcher";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "./chrome";
import {
  buildAttentionItems,
  dedupeAttentionByCampaign,
  HOME_WORK_LIMIT,
  homeWorkAction,
  homeWorkBadge,
  homeWorkHref,
  homeWorkMeta,
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
  const [campaignResult, assignmentResult, subjectResult, profileResult, templateResult, templateQuestions, frozenQuestions, peopleResult, activeTemplatesResult] =
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
        .select("campaign_id, person_id")
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
      supabase.from("template_questions").select("template_id, type").eq("organization_id", org.id),
      supabase.from("campaign_questions").select("campaign_id, type").eq("organization_id", org.id),
      supabase.from("people").select("id, archived_at").eq("organization_id", org.id),
      supabase.from("templates").select("id").eq("organization_id", org.id).is("archived_at", null),
    ]);

  if (campaignResult.error || assignmentResult.error || subjectResult.error || templateQuestions.error || frozenQuestions.error || peopleResult.error || activeTemplatesResult.error)
    throw new Error("Unable to load your workspace");

  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const assignments = (assignmentResult.data ?? []) as CampaignAssignment[];
  const subjects = (subjectResult.data ?? []) as Pick<
    CampaignSubject,
    "campaign_id" | "person_id"
  >[];

  const activePersonIds = new Set((peopleResult.data ?? []).filter((p) => !p.archived_at).map((p) => p.id));
  const subjectByCampaign = Object.fromEntries(subjects.map((s) => [s.campaign_id, s.person_id]));
  const campaignTypeById = Object.fromEntries(campaigns.map((c) => [c.id, c.campaign_type]));

  const subjectCounts: Record<string, number> = {};
  for (const s of subjects) {
    if (activePersonIds.has(s.person_id) || campaignTypeById[s.campaign_id] !== "feedback_360")
      subjectCounts[s.campaign_id] = (subjectCounts[s.campaign_id] ?? 0) + 1;
  }
  const questionCounts: Record<string, number> = {};
  const invalidQuestions = new Set<string>();
  const activeTemplateIds = new Set((activeTemplatesResult.data ?? []).map((t) => t.id));
  for (const q of templateQuestions.data ?? []) questionCounts[q.template_id] = (questionCounts[q.template_id] ?? 0) + 1;
  for (const q of frozenQuestions.data ?? []) questionCounts[q.campaign_id] = (questionCounts[q.campaign_id] ?? 0) + 1;
  for (const q of templateQuestions.data ?? []) if (!["rating", "text"].includes(q.type)) invalidQuestions.add(q.template_id);
  for (const q of frozenQuestions.data ?? []) if (!["rating", "text"].includes(q.type)) invalidQuestions.add(q.campaign_id);
  for (const c of campaigns) if (c.campaign_type === "feedback_360" && (invalidQuestions.has(c.questions_frozen_at || c.form_started_at ? c.id : (c.template_id ?? "")) || (!c.questions_frozen_at && !c.form_started_at && (!c.template_id || !activeTemplateIds.has(c.template_id))))) questionCounts[c.id] = 0;
  const reviewerIdsByCampaign = new Map<string, Set<string>>();
  for (const a of assignments) if (a.status === "pending" && activePersonIds.has(a.respondent_person_id) && a.subject_person_id === subjectByCampaign[a.campaign_id] && a.respondent_person_id !== a.subject_person_id && ["manager", "peer", "direct_report", "other"].includes(a.relationship ?? ""))
    reviewerIdsByCampaign.set(a.campaign_id, (reviewerIdsByCampaign.get(a.campaign_id) ?? new Set<string>()).add(a.respondent_person_id));
  const valid360ReviewerCounts = Object.fromEntries([...reviewerIdsByCampaign].map(([id, reviewers]) => [id, reviewers.size]));

  const workItems = dedupeAttentionByCampaign(
    buildAttentionItems(campaigns, assignments, subjectCounts, questionCounts, valid360ReviewerCounts),
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
      href: "/dashboard/campaigns/new?type=360",
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
    <div className="mx-auto w-full space-y-10 pb-4">
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
                className="group flex flex-col gap-1.5 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 sm:block">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </p>
                    <StatusBadge
                      tone={statusTone(item.kind)}
                      className="shrink-0 sm:hidden"
                    >
                      {homeWorkBadge(item.kind)}
                    </StatusBadge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {homeWorkMeta(item)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-5">
                  <StatusBadge
                    tone={statusTone(item.kind)}
                    className="hidden shrink-0 sm:inline-flex"
                  >
                    {homeWorkBadge(item.kind)}
                  </StatusBadge>
                  <span className="shrink-0 text-sm font-medium text-primary transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                    {homeWorkAction(item.kind)} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
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
