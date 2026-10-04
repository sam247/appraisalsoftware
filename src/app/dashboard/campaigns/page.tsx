import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../chrome";
import CampaignsDirectory from "./campaigns-directory";
import type {
  Campaign,
  CampaignAssignment,
  CampaignSubject,
} from "@/lib/types/database";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { org } = await requireOrgAdmin();
  const params = await searchParams;
  const supabase = await createClient();
  const [campaignResult, assignmentResult, subjectResult, templateQuestions, frozenQuestions, peopleResult, activeTemplatesResult] = await Promise.all([
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
    supabase.from("template_questions").select("template_id, type").eq("organization_id", org.id),
    supabase.from("campaign_questions").select("campaign_id, type").eq("organization_id", org.id),
    supabase.from("people").select("id, archived_at").eq("organization_id", org.id),
    supabase.from("templates").select("id").eq("organization_id", org.id).is("archived_at", null),
  ]);
  if (campaignResult.error || assignmentResult.error || subjectResult.error || templateQuestions.error || frozenQuestions.error || peopleResult.error || activeTemplatesResult.error)
    throw new Error("Unable to load your campaigns");

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

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Appraisals and feedback cycles across your team."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/campaigns/new">+ Create campaign</Link>
          </Button>
        }
      />
      {params.error && (
        <div
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {params.error}
        </div>
      )}
      {params.ok && (
        <div className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
          {params.ok}
        </div>
      )}
      <div className="mt-4">
        <CampaignsDirectory
          campaigns={campaigns}
          assignments={assignments}
          subjectCounts={subjectCounts}
          questionCounts={questionCounts}
          valid360ReviewerCounts={valid360ReviewerCounts}
        />
      </div>
    </div>
  );
}
