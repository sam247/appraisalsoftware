import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { requireOrgAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildAttentionItems } from "../campaigns/presentation";
import { onboardingState } from "../workspace-state";
import { PageHeader } from "../chrome";
import { Button } from "@/components/ui/button";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";

export default async function GettingStartedPage() {
  const { org } = await requireOrgAdmin();
  const supabase = await createClient();
  const results = await Promise.all([
    supabase.from("campaigns").select("*").eq("organization_id", org.id),
    supabase.from("people").select("id,archived_at").eq("organization_id", org.id),
    supabase.from("campaign_subjects").select("campaign_id,person_id").eq("organization_id", org.id),
    supabase.from("campaign_assignments").select("*").eq("organization_id", org.id),
    supabase.from("campaign_questions").select("campaign_id,type").eq("organization_id", org.id),
    supabase.from("templates").select("id").eq("organization_id", org.id).is("archived_at", null),
    supabase.from("template_questions").select("template_id,type").eq("organization_id", org.id),
  ]);
  if (results.some((result) => result.error)) throw new Error("Unable to load workspace setup");
  const [campaignResult, peopleResult, subjectResult, assignmentResult, questionResult, templateResult, templateQuestionResult] = results;
  const campaigns = (campaignResult.data ?? []) as Campaign[];
  const assignments = (assignmentResult.data ?? []) as CampaignAssignment[];
  const activePeople = new Set((peopleResult.data ?? []).filter((person) => !person.archived_at).map((person) => person.id));
  const templates = new Set((templateResult.data ?? []).map((template) => template.id));
  const subjects = subjectResult.data ?? [];
  const subjectCounts: Record<string, number> = {};
  const questionCounts: Record<string, number> = {};
  const reviewers: Record<string, number> = {};
  for (const campaign of campaigns) {
    const is360 = campaign.campaign_type === "feedback_360";
    const savedSubjects = subjects.filter((subject) => subject.campaign_id === campaign.id);
    subjectCounts[campaign.id] = savedSubjects.filter((subject) => !is360 || activePeople.has(subject.person_id)).length;
    const cohort = assignments.filter((assignment) => assignment.campaign_id === campaign.id);
    reviewers[campaign.id] = new Set(cohort.filter((assignment) => assignment.status === "pending" && activePeople.has(assignment.respondent_person_id) && assignment.subject_person_id === savedSubjects[0]?.person_id && assignment.respondent_person_id !== savedSubjects[0]?.person_id && ["manager", "peer", "direct_report", "other"].includes(assignment.relationship ?? "")).map((assignment) => assignment.respondent_person_id)).size;
    const local = !!(campaign.form_started_at || campaign.questions_frozen_at);
    const key = local ? campaign.id : campaign.template_id ?? "";
    const questions = local ? (questionResult.data ?? []).filter((question) => question.campaign_id === key) : (templateQuestionResult.data ?? []).filter((question) => question.template_id === key);
    questionCounts[campaign.id] = is360 && ((!local && !templates.has(key)) || questions.some((question) => !["rating", "text"].includes(question.type))) ? 0 : questions.length;
  }
  const ready = new Set(buildAttentionItems(campaigns, assignments, subjectCounts, questionCounts, reviewers).filter((item) => item.kind === "ready_to_send").map((item) => item.campaign.id));
  const state = onboardingState(campaigns, activePeople.size, ready);
  const current = state.steps.findIndex((step) => !step.done);
  return <div className="onboarding-page">
    <PageHeader title="Getting Started" subtitle="A few steps to your first appraisal or feedback campaign." action={<Button asChild variant="outline"><Link href="/dashboard">Go to Home</Link></Button>} />
    <div className="onboarding-intro">
      <div className="setup-ring" role="progressbar" aria-label="Workspace setup" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.percent} style={{ background: `conic-gradient(var(--primary) ${state.percent}%, var(--border) 0)` }}><span>{state.percent}%</span></div>
      <div><h2 className="text-2xl font-semibold">{state.complete ? "Your workspace is ready" : "Launch your first campaign"}</h2><p className="mt-2 text-sm text-muted-foreground">{state.complete ? "Continue your work from Home, or explore completed campaign reports." : "Your progress follows the people and campaign setup you save."}</p></div>
    </div>
    <ol className="onboarding-checklist">
      {state.steps.map((step, index) => <li key={step.label} className={current === index ? "current" : ""}>
        <span className={`step-marker ${step.done ? "done" : ""}`}>{step.done ? <Check size={16} aria-hidden /> : index + 1}</span>
        <div className="min-w-0 flex-1"><h3 className="text-lg font-semibold">{step.label}</h3><p className="mt-2 text-sm text-muted-foreground">{step.description}</p></div>
        <Button asChild variant={current === index ? "default" : "outline"}><Link href={state.complete ? (index === 0 ? "/dashboard/people" : "/dashboard/campaigns") : step.href}>{step.done ? "View" : "Continue"}<ArrowRight size={16} aria-hidden /></Link></Button>
      </li>)}
    </ol>
  </div>;
}
